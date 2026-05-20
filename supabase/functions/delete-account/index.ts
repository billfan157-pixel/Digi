import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ error: 'Server configuration error' }, 500, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }

    // Rate limit: max 1 delete attempt per hour per user
    const rateLimit = await checkRateLimit(`delete-account:${user.id}`, RATE_LIMITS.deleteAccount);
    if (!rateLimit.allowed) {
      return json({
        error: `Too many delete attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      }, 429, origin);
    }

    // Require password re-confirmation
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      return json({ error: 'Password confirmation required.' }, 400, origin);
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email ?? '',
      password,
    });

    if (signInError) {
      return json({ error: 'Password incorrect. Account deletion cancelled.' }, 403, origin);
    }

    // Use RPC that cascades from auth.users → profiles → all related tables
    const { error: rpcError } = await supabase.rpc('delete_account_and_auth');

    if (rpcError) {
      console.error('delete-account error:', rpcError.message);
      return json({ error: rpcError.message }, 500, origin);
    }

    return json({ success: true }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('delete-account error:', message);
    return json({ error: message }, 500, origin);
  }
});
