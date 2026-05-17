/**
 * Shared rate limiter for Supabase Edge Functions.
 * Uses Deno KV for persistent, distributed rate limiting.
 * Falls back to in-memory Map if KV is unavailable.
 */

type RateLimitConfig = {
  maxRequests: number;
  windowSeconds: number;
};

// In-memory fallback (per-invocation only)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a request is within rate limits.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; retryAfterSeconds?: number; remaining?: number }> {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const storeKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

  // Try Deno KV first
  try {
    const kv = await Deno.openKv();
    const result = await kv.get<{ count: number }>([storeKey]);
    const count = result.value?.count ?? 0;

    if (count >= config.maxRequests) {
      const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      await kv.close();
      return { allowed: false, retryAfterSeconds: retryAfter };
    }

    await kv.atomic().sum([storeKey], 1n).commit();
    await kv.close();
    return { allowed: true, remaining: config.maxRequests - count - 1 };
  } catch {
    // Fallback to in-memory
    const entry = memoryStore.get(storeKey) ?? { count: 0, resetAt: now + windowMs };

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
    }

    entry.count += 1;
    memoryStore.set(storeKey, entry);

    // Clean up old entries
    for (const [k, v] of memoryStore) {
      if (v.resetAt < now) memoryStore.delete(k);
    }

    return { allowed: true, remaining: config.maxRequests - entry.count };
  }
}

/**
 * Common rate limit presets for different endpoint types.
 */
export const RATE_LIMITS = {
  // Payment endpoints: strict to prevent abuse
  stripeCheckout: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,

  // Account deletion: very strict (1 per hour)
  deleteAccount: { maxRequests: 1, windowSeconds: 3600 } as RateLimitConfig,

  // Calendar proxy: moderate (30 per minute to avoid Google API quota exhaustion)
  calendarProxy: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};
