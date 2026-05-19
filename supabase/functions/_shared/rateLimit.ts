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

export function getRateLimitKey(request: Request, scope: string, fallback = 'unknown'): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  return `${scope}:${forwardedFor || realIp || cfIp || fallback}`;
}

/**
 * Common rate limit presets for different endpoint types.
 */
export const RATE_LIMITS = {
  // AI endpoints: DB usage limits still apply; this protects the function itself.
  aiGateway: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,

  // Payment endpoints: strict to prevent abuse
  stripeCheckout: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
  stripePortal: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
  stripeWebhook: { maxRequests: 120, windowSeconds: 60 } as RateLimitConfig,

  // Account deletion: very strict (1 per hour)
  deleteAccount: { maxRequests: 1, windowSeconds: 3600 } as RateLimitConfig,

  // Calendar proxy: moderate (30 per minute to avoid Google API quota exhaustion)
  calendarProxy: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,

  // Push: authenticated sender endpoint
  pushNotification: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};
