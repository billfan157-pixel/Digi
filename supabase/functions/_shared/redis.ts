import { Redis } from 'https://esm.sh/@upstash/redis@1.30.0';

/// <reference lib="deno.ns" />

const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? 'https://example-redis.upstash.io';
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? 'dummy-token';

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
