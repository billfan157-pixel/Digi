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
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';

  if (!stripeSecretKey) {
    return json({ error: 'Stripe not configured' }, 500, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }

    const rateLimit = await checkRateLimit(`stripe-portal:${user.id}`, RATE_LIMITS.stripePortal);
    if (!rateLimit.allowed) {
      return json({ error: `Rate limited. Retry in ${rateLimit.retryAfterSeconds}s` }, 429, origin);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return json({ error: 'No Stripe customer found. Subscribe first.' }, 400, origin);
    }

    const body = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Stripe portal error:', errText);
      return json({ error: 'Failed to create portal session' }, 500, origin);
    }

    const session = await resp.json();
    return json({ url: session.url }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('stripe-portal error:', message);
    return json({ error: message }, 500, origin);
  }
});
