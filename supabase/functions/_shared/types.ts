import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { RateLimitConfig } from './rateLimit.ts';

export interface MiddlewareContext {
  user?: User;
  supabase?: SupabaseClient;
  origin: string | null;
}

export type HandlerConfig = {
  method?: 'GET' | 'POST' | 'OPTIONS' | 'DELETE' | 'PUT' | Array<'GET' | 'POST' | 'OPTIONS' | 'DELETE' | 'PUT'>;
  requireAuth?: boolean;
  skipOriginCheck?: boolean;
  rateLimit?: {
    config: RateLimitConfig;
    scope: string;
  };
};

export type MiddlewareHandler = (
  req: Request,
  ctx: MiddlewareContext
) => Promise<Response> | Response;
