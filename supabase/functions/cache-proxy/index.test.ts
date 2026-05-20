/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { redis } from "../_shared/redis.ts";
import { handler } from "./index.ts";

const redisStore: Record<string, string> = {};

// Override Redis stub
const redisAny = redis as any;
redisAny.get = async (key: string) => {
  return redisStore[key] || null;
};
redisAny.setex = async (key: string, _ttl: number, value: any) => {
  redisStore[key] = typeof value === 'string' ? value : JSON.stringify(value);
  return "OK";
};
redisAny.del = async (key: string | string[]) => {
  const keys = Array.isArray(key) ? key : [key];
  let deleted = 0;
  for (const k of keys) {
    if (k in redisStore) {
      delete redisStore[k];
      deleted++;
    }
  }
  return deleted;
};

Deno.test({
  name: "POST /invalidate deletes keys successfully",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Setup cached data
    redisStore["user:user_123:profile"] = JSON.stringify({ name: "Bob" });
    redisStore["leaderboard:daily"] = JSON.stringify([]);

    // Create mock webhook request
    const payload = {
      type: "UPDATE",
      table: "profiles",
      record: { id: "user_123" },
    };

    const req = new Request("https://example.com/cache-proxy/invalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer dummy-key",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify(payload),
    });

    const res = await handler(req);
    assertEquals(res.status, 200);

    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.invalidatedKeys, ["user:user_123:profile", "leaderboard:daily"]);

    // Verify they were deleted from the store
    assertEquals(redisStore["user:user_123:profile"], undefined);
    assertEquals(redisStore["leaderboard:daily"], undefined);
  }
});

Deno.test({
  name: "POST /invalidate rejects unauthorized requests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://example.com/cache-proxy/invalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer bad-key",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({}),
    });

    const res = await handler(req);
    assertEquals(res.status, 401);
  }
});
