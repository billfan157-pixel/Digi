import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '../_shared/rateLimit.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': appUrl,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

const encoder = new TextEncoder();

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};

const verifyStripeSignature = async (body: string, signatureHeader: string) => {
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature || !stripeWebhookSecret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(stripeWebhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return safeEqual(hex(signed), signature);
};

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

async function logEvent(userId: string, eventType: string, tier: string, stripeEventId: string, amountVnd?: number) {
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: eventType,
    tier,
    stripe_event_id: stripeEventId,
    amount_vnd: amountVnd ?? null,
  }).maybeSingle();
}

async function extractUserId(obj: Record<string, unknown>): Promise<string> {
  const directId = String(obj.client_reference_id ?? (obj.metadata as Record<string, string> | undefined)?.userId ?? '');
  if (directId) return directId;

  // Fallback: invoice events don't have client_reference_id/metadata.userId
  // Look up by stripe_customer_id instead
  const customer = typeof obj.customer === 'string' ? obj.customer : '';
  if (customer) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customer)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return '';
}

function extractSubDetails(obj: Record<string, unknown>) {
  const items = obj.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const priceId = items?.data?.[0]?.price?.id ?? null;
  const periodEnd = typeof obj.current_period_end === 'number' ? new Date(obj.current_period_end * 1000).toISOString() : null;
  const customer = typeof obj.customer === 'string' ? obj.customer : null;
  return { priceId, periodEnd, customer };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return json({ error: 'Missing configuration' }, 500);
  }

  const rateLimit = await checkRateLimit(
    getRateLimitKey(request, 'stripe-webhook'),
    RATE_LIMITS.stripeWebhook,
  );
  if (!rateLimit.allowed) {
    return json({ error: `Rate limited. Retry in ${rateLimit.retryAfterSeconds}s` }, 429);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  if (!(await verifyStripeSignature(rawBody, signature))) {
    return json({ error: 'Invalid signature' }, 401);
  }

  const event = JSON.parse(rawBody);
  const eventType = event.type as string;
  const eventId = String(event.id ?? '');
  const obj = event.data?.object as Record<string, unknown> | undefined;

  // Idempotency: skip if this event was already processed
  if (eventId) {
    const { data: existingEvent } = await supabase
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`stripe-webhook: skipping duplicate event ${eventId}`);
      return json({ received: true, duplicate: true });
    }
  }

  try {
    if (eventType === 'checkout.session.completed' && obj) {
      const userId = await extractUserId(obj);
      const subscriptionId = typeof obj.subscription === 'string' ? obj.subscription : '';

      if (userId && subscriptionId) {
        const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });
        if (resp.ok) {
          const sub = await resp.json() as Record<string, unknown>;
          const { priceId, periodEnd, customer } = extractSubDetails(sub);
          await updateProfile(userId, {
            subscription_tier: 'premium',
            subscription_end: periodEnd,
            stripe_customer_id: customer,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            grace_period_end: null,
          });
          await logEvent(userId, 'subscription_created', 'premium', eventId);
        }
      }
    }

    if (eventType === 'customer.subscription.updated' && obj) {
      const userId = await extractUserId(obj);
      const status = String(obj.status ?? '');
      const { priceId, periodEnd, customer } = extractSubDetails(obj);

      if (userId) {
        const isActive = status !== 'canceled' && status !== 'incomplete_expired' && status !== 'unpaid';
        const cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);

        await updateProfile(userId, {
          subscription_tier: isActive ? 'premium' : 'free',
          subscription_end: periodEnd,
          stripe_customer_id: customer,
          stripe_subscription_id: String(obj.id ?? ''),
          stripe_price_id: priceId,
          cancel_at_period_end: cancelAtPeriodEnd,
          grace_period_end: status === 'active' ? null : undefined,
        });
        await logEvent(userId, isActive ? 'subscription_updated' : 'subscription_expired', isActive ? 'premium' : 'free', eventId);
      }
    }

    if (eventType === 'customer.subscription.deleted' && obj) {
      const userId = await extractUserId(obj);
      if (userId) {
        await updateProfile(userId, {
          subscription_tier: 'free',
          subscription_end: null,
          cancel_at_period_end: false,
          grace_period_end: null,
        });
        await logEvent(userId, 'subscription_canceled', 'free', eventId);
      }
    }

    if (eventType === 'invoice.payment_succeeded' && obj) {
      const subscriptionId = typeof obj.subscription === 'string' ? obj.subscription : '';
      const amountPaid = typeof obj.amount_paid === 'number' ? obj.amount_paid : 0;
      const amountVnd = Math.round(amountPaid / 100);
      const userId = await extractUserId(obj);

      if (userId && subscriptionId) {
        const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });
        if (resp.ok) {
          const sub = await resp.json() as Record<string, unknown>;
          const { priceId, periodEnd } = extractSubDetails(sub);
          await updateProfile(userId, {
            subscription_tier: 'premium',
            subscription_end: periodEnd,
            stripe_price_id: priceId,
            grace_period_end: null,
            cancel_at_period_end: false,
          });
        }
        await logEvent(userId, 'payment_succeeded', 'premium', eventId, amountVnd);
      }
    }

    if (eventType === 'invoice.payment_failed' && obj) {
      const userId = await extractUserId(obj);
      const attemptCount = typeof obj.attempt_count === 'number' ? obj.attempt_count : 0;

      if (userId) {
        // Grant 7-day grace period on first failure
        if (attemptCount <= 1) {
          const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await updateProfile(userId, { grace_period_end: graceEnd });
        }
        await logEvent(userId, 'payment_failed', 'premium', eventId);
      }
    }

    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('stripe-webhook error:', message);
    return json({ error: message }, 500);
  }
});
