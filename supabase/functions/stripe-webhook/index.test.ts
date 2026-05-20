import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { safeEqual, extractSubDetails, extractUserId } from "./index.ts";

Deno.test("safeEqual matches identical strings", () => {
  assertEquals(safeEqual("hello", "hello"), true);
  assertEquals(safeEqual("hello", "world"), false);
  assertEquals(safeEqual("hello", "helloo"), false);
});

Deno.test("extractSubDetails extracts correct fields", () => {
  const sub = {
    id: "sub_123",
    customer: "cus_123",
    current_period_end: 1716200000,
    items: {
      data: [
        {
          price: {
            id: "price_premium_yearly",
          },
        },
      ],
    },
  };
  const details = extractSubDetails(sub);
  assertEquals(details.priceId, "price_premium_yearly");
  assertEquals(details.customer, "cus_123");
  assertEquals(details.periodEnd, new Date(1716200000 * 1000).toISOString());
});

Deno.test("extractUserId extracts client_reference_id", async () => {
  const obj = {
    client_reference_id: "user_client_ref_123",
    metadata: {
      userId: "user_metadata_123",
    },
  };
  const userId = await extractUserId(obj);
  assertEquals(userId, "user_client_ref_123");
});

Deno.test("extractUserId falls back to metadata.userId", async () => {
  const obj = {
    metadata: {
      userId: "user_metadata_123",
    },
  };
  const userId = await extractUserId(obj);
  assertEquals(userId, "user_metadata_123");
});
