import { handleCors, getCorsHeaders } from './cors.ts';
import { authenticate } from './auth.ts';
import { checkRateLimit, getRateLimitKey } from './rateLimit.ts';
import { createErrorResponse, createJsonResponse } from './errors.ts';
import { HandlerConfig, MiddlewareHandler } from './types.ts';
import { captureException } from './sentry.ts';
import { logMetric } from './metrics.ts';

export function createHandler(config: HandlerConfig, handler: MiddlewareHandler) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    const startTime = performance.now();
    let statusCode = 200;
    let user;

    // 1. CORS Preflight & Origin check
    if (req.method === 'OPTIONS') {
      return handleCors(req) || new Response('ok', { headers: getCorsHeaders(origin) });
    }

    if (!config.skipOriginCheck) {
      const corsRes = handleCors(req);
      if (corsRes) return corsRes;
    }

    // 2. Method check
    const allowedMethods = Array.isArray(config.method) 
      ? config.method 
      : [config.method ?? 'POST'];
    if (!allowedMethods.includes(req.method as any)) {
      statusCode = 405;
      return createJsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    try {
      let supabase;

      // 3. Auth (if required)
      if (config.requireAuth) {
        const auth = await authenticate(req);
        user = auth.user;
        supabase = auth.supabase;
      }

      // 4. Rate limit (if configured)
      if (config.rateLimit) {
        const rateLimitKey = user 
          ? `${config.rateLimit.scope}:${user.id}` 
          : getRateLimitKey(req, config.rateLimit.scope);
        const limitRes = await checkRateLimit(rateLimitKey, config.rateLimit.config);
        if (!limitRes.allowed) {
          statusCode = 429;
          return createJsonResponse(
            { 
              error: `Too many requests. Try again in ${limitRes.retryAfterSeconds} seconds.` 
            }, 
            429, 
            origin
          );
        }
      }

      // 5. Execute handler
      const response = await handler(req, { user, supabase, origin });
      statusCode = response.status;
      return response;
    } catch (err) {
      statusCode = (err as any)?.status || 500;
      
      // Sentry error capture
      await captureException(err, {
        path: new URL(req.url).pathname,
        method: req.method,
        userId: user?.id,
        status: statusCode,
      });

      return createErrorResponse(err, origin);
    } finally {
      const duration = performance.now() - startTime;
      logMetric('request_latency', duration, {
        path: new URL(req.url).pathname,
        method: req.method,
        status: statusCode,
        userId: user?.id || null,
      });
    }
  };
}
