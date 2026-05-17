import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

type StripeSubscription = {
  id: string;
  customer: string | null;
  items?: {
    data?: Array<{
      price?: { id?: string | null };
    }>;
  };
  current_period_end?: number;
  metadata?: Record<string, string>;
  status?: string;
};

const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': appUrl,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const encoder = new TextEncoder();

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
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

  // Prevent replay attack: reject signatures older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(stripeWebhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return safeEqual(hex(signed), signature);
};

const fetchStripeSubscription = async (subscriptionId: string): Promise<StripeSubscription | null> => {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });

  if (!response.ok) return null;
  return await response.json();
};

const updateProfileSubscription = async (
  userId: string,
  values: {
    subscriptionTier: 'free' | 'premium';
    subscriptionEnd: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
) => {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: values.subscriptionTier,
      subscription_end: values.subscriptionEnd,
      stripe_customer_id: values.stripeCustomerId ?? null,
      stripe_subscription_id: values.stripeSubscriptionId ?? null,
      // stripe_price_id omitted — column doesn't exist yet; add via migration if needed
    })
    .eq('id', userId);

  if (error) throw error;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return json({ error: 'Missing Stripe webhook environment configuration.' }, 500);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  const isValid = await verifyStripeSignature(rawBody, signature);

  if (!isValid) {
    return json({ error: 'Invalid Stripe signature.' }, 401);
  }

  const event = JSON.parse(rawBody);
  const eventType = event.type as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const object = event.data?.object as Record<string, any> | undefined;

  try {
    if (eventType === 'checkout.session.completed' && object) {
      const userId = String(object.client_reference_id ?? object.metadata?.userId ?? '');
      const subscriptionId = typeof object.subscription === 'string' ? object.subscription : '';

      if (userId && subscriptionId) {
        const subscription = await fetchStripeSubscription(subscriptionId);

        await updateProfileSubscription(userId, {
          subscriptionTier: 'premium',
          subscriptionEnd: subscription?.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          stripeCustomerId: typeof subscription?.customer === 'string' ? subscription.customer : null,
          stripeSubscriptionId: subscription?.id ?? subscriptionId,
        });
      }
    }

    if ((eventType === 'customer.subscription.updated' || eventType === 'customer.subscription.deleted') && object) {
      const subscription = object as StripeSubscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const isActive = eventType !== 'customer.subscription.deleted' && subscription.status !== 'canceled';

        await updateProfileSubscription(userId, {
          subscriptionTier: isActive ? 'premium' : 'free',
          subscriptionEnd: isActive && subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
          stripeSubscriptionId: subscription.id,
        });
      }
    }

    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
    console.error('stripe-webhook error:', message);
    return json({ error: message }, 500);
  }
});
