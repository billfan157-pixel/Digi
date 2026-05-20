import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

type BillingPlan = 'monthly' | 'yearly';

type CheckoutRequest = {
  plan: BillingPlan;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  customerEmail?: string;
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeMonthlyPriceId = Deno.env.get('STRIPE_PRICE_MONTHLY') ?? '';
const stripeYearlyPriceId = Deno.env.get('STRIPE_PRICE_YEARLY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const ALLOWED_REDIRECT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'capacitor://localhost',
  'digiwell://',
  ...(Deno.env.get('APP_URL') ? [Deno.env.get('APP_URL')!] : []),
  ...(Deno.env.get('EXTRA_ALLOWED_ORIGINS') ? Deno.env.get('EXTRA_ALLOWED_ORIGINS')!.split(',') : []),
];

function isUrlAllowed(url: string): boolean {
  // Allow digiwell:// deep links
  if (url.startsWith('digiwell://')) return true;
  // Allow capacitor:// deep links
  if (url.startsWith('capacitor://')) return true;
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_ORIGINS.some(allowed => parsed.origin === allowed);
  } catch {
    return false;
  }
}

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

const getPriceId = (plan: BillingPlan) => (plan === 'yearly' ? stripeYearlyPriceId : stripeMonthlyPriceId);

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Missing Stripe or Supabase environment configuration.' }, 500, origin);
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json({ error: 'Missing Authorization header.' }, 401, origin);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401, origin);
  }

  // Rate limit: max 5 checkout sessions per minute per user
  const rateLimit = await checkRateLimit(`stripe-checkout:${user.id}`, RATE_LIMITS.stripeCheckout);
  if (!rateLimit.allowed) {
    return json({
      error: `Too many checkout attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
    }, 429, origin);
  }

  const body = (await request.json()) as CheckoutRequest;
  const priceId = getPriceId(body.plan);

  if (!priceId) {
    return json({ error: `Missing Stripe price id for plan "${body.plan}".` }, 500, origin);
  }

  if (!isUrlAllowed(body.successUrl)) {
    return json({ error: 'Invalid successUrl: not in allowlist.' }, 400, origin);
  }
  if (!isUrlAllowed(body.cancelUrl)) {
    return json({ error: 'Invalid cancelUrl: not in allowlist.' }, 400, origin);
  }

  const payload = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    client_reference_id: user.id,
    'metadata[userId]': user.id,
    'metadata[plan]': body.plan,
    'subscription_data[metadata][userId]': user.id,
    'subscription_data[metadata][plan]': body.plan,
    ...(body.customerEmail ? { customer_email: body.customerEmail } : {}),
  });

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  const stripeData = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return json({ error: stripeData.error?.message ?? 'Stripe checkout creation failed.' }, 500, origin);
  }

  return json({ id: stripeData.id, url: stripeData.url }, 200, origin);
});
