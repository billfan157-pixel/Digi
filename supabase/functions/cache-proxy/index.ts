import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { redis } from '../_shared/redis.ts';
import { captureException } from '../_shared/sentry.ts';
import { logMetric } from '../_shared/metrics.ts';

/// <reference lib="deno.ns" />

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://plbwqjdrivyffrhpbmvm.supabase.co';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'dummy-key';

const jsonResponse = (body: Record<string, unknown>, status = 200, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

export async function handler(request: Request): Promise<Response> {
  const startTime = performance.now();
  let statusCode = 200;
  
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, ''); // Strip trailing slash

  // Initialize service role admin client for database lookups and webhook invalidation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 1. POST /invalidate - Handles Supabase Database Webhook to invalidate Redis cache keys
    if (request.method === 'POST' && path.endsWith('/invalidate')) {
      const apiKey = request.headers.get('apikey') ?? '';
      const authHeader = request.headers.get('Authorization') ?? '';
      const isAuthorized =
        apiKey === supabaseServiceRoleKey ||
        authHeader.replace('Bearer ', '') === supabaseServiceRoleKey;

      if (!isAuthorized) {
        statusCode = 401;
        return jsonResponse({ error: 'Unauthorized webhook request' }, 401, origin);
      }

      const payload = await request.json();
      const table = payload.table;
      const record = payload.record || {};
      const oldRecord = payload.old_record || {};

      const userId = record.user_id || record.id || oldRecord.user_id || oldRecord.id;

      if (!userId) {
        statusCode = 400;
        return jsonResponse({ error: 'Missing user identifier in payload' }, 400, origin);
      }

      const invalidatedKeys: string[] = [];

      if (table === 'profiles') {
        const key = `user:${userId}:profile`;
        await redis.del(key);
        await redis.del('leaderboard:daily');
        invalidatedKeys.push(key, 'leaderboard:daily');
      } else if (table === 'user_streaks') {
        const key = `user:${userId}:streak`;
        await redis.del(key);
        invalidatedKeys.push(key);
      } else if (table === 'water_logs') {
        const key = `user:${userId}:water_today`;
        await redis.del(key);
        invalidatedKeys.push(key);
      }

      return jsonResponse({ success: true, invalidatedKeys }, 200, origin);
    }

    // All GET endpoints require user token verification
    if (request.method !== 'GET') {
      statusCode = 405;
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const authHeader = request.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      statusCode = 401;
      return jsonResponse({ error: 'Missing or invalid authorization token' }, 401, origin);
    }
    const token = authHeader.split(' ')[1];

    // Verify User JWT using Supabase Auth Client
    const supabase = createClient(supabaseUrl, token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      statusCode = 401;
      return jsonResponse({ error: 'Unauthorized' }, 401, origin);
    }

    // 2. GET /profile - Cache Proxy for User Profile (TTL: 300s)
    if (path.endsWith('/profile')) {
      const cacheKey = `user:${user.id}:profile`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logMetric('cache_hit_rate', 1, { endpoint: 'profile', userId: user.id });
        return jsonResponse({ data: cached, source: 'cache' }, 200, origin);
      }

      logMetric('cache_hit_rate', 0, { endpoint: 'profile', userId: user.id });
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      await redis.setex(cacheKey, 300, JSON.stringify(data));
      return jsonResponse({ data, source: 'db' }, 200, origin);
    }

    // 3. GET /streak - Cache Proxy for User Streak (TTL: 3600s)
    if (path.endsWith('/streak')) {
      const cacheKey = `user:${user.id}:streak`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logMetric('cache_hit_rate', 1, { endpoint: 'streak', userId: user.id });
        return jsonResponse({ data: cached, source: 'cache' }, 200, origin);
      }

      logMetric('cache_hit_rate', 0, { endpoint: 'streak', userId: user.id });
      const { data, error } = await supabaseAdmin
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      await redis.setex(cacheKey, 3600, JSON.stringify(data));
      return jsonResponse({ data, source: 'db' }, 200, origin);
    }

    // 4. GET /water-today - Cache Proxy for Daily Hydration Logs (TTL: 60s)
    if (path.endsWith('/water-today')) {
      const cacheKey = `user:${user.id}:water_today`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logMetric('cache_hit_rate', 1, { endpoint: 'water-today', userId: user.id });
        return jsonResponse({ data: cached, source: 'cache' }, 200, origin);
      }

      logMetric('cache_hit_rate', 0, { endpoint: 'water-today', userId: user.id });
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseAdmin
        .from('water_logs')
        .select('id, amount, name, exp, day, created_at')
        .eq('user_id', user.id)
        .eq('day', todayStr);

      if (error) throw error;

      await redis.setex(cacheKey, 60, JSON.stringify(data));
      return jsonResponse({ data, source: 'db' }, 200, origin);
    }

    // 5. GET /leaderboard - Cache Proxy for Top Leaderboard (TTL: 120s)
    if (path.endsWith('/leaderboard')) {
      const cacheKey = `leaderboard:daily`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logMetric('cache_hit_rate', 1, { endpoint: 'leaderboard', userId: user.id });
        return jsonResponse({ data: cached, source: 'cache' }, 200, origin);
      }

      logMetric('cache_hit_rate', 0, { endpoint: 'leaderboard', userId: user.id });
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, nickname, avatar_url, total_exp, level')
        .order('total_exp', { ascending: false })
        .limit(10);

      if (error) throw error;

      await redis.setex(cacheKey, 120, JSON.stringify(data));
      return jsonResponse({ data, source: 'db' }, 200, origin);
    }

    statusCode = 404;
    return jsonResponse({ error: 'Not found' }, 404, origin);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('cache-proxy error:', msg);
    statusCode = 500;
    
    await captureException(err, {
      path,
      method: request.method,
      status: 500,
    });

    return jsonResponse({ error: msg }, 500, origin);
  } finally {
    const duration = performance.now() - startTime;
    logMetric('request_latency', duration, {
      path,
      method: request.method,
      status: statusCode,
    });
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
