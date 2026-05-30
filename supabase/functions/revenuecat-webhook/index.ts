import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401, origin);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await request.json();
    const { event } = body;
    const userId = event?.app_user_id;

    if (!userId || userId.startsWith('$')) {
      return json({ message: 'Skipped: test or anonymous user' }, 200, origin);
    }

    const entitlement = event?.entitlements?.['pro'] || event?.entitlements?.['plus'];
    const tier = event?.entitlements?.['pro']?.product_identifier?.startsWith('digiwell_pro')
      ? 'pro'
      : event?.entitlements?.['plus']?.product_identifier?.startsWith('digiwell_plus')
        ? 'plus'
        : null;

    switch (event?.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION': {
        if (!tier) {
          return json({ message: 'Skipped: no matching entitlement' }, 200, origin);
        }

        const { error: upsertError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_end: entitlement?.expiration_date
              ? new Date(entitlement.expiration_date).toISOString()
              : null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
          })
          .eq('id', userId);

        if (upsertError) throw upsertError;

        await supabase
          .from('subscription_events')
          .insert({
            user_id: userId,
            event_type: event.type.toLowerCase(),
            tier,
            amount_vnd: 0,
          });

        return json({ message: `User ${userId} upgraded to ${tier}` }, 200, origin);
      }

      case 'CANCELLATION':
      case 'EXPIRATION': {
        if (!entitlement || entitlement?.expiration_date) {
          const { error: clearError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_end: entitlement?.expiration_date
                ? new Date(entitlement.expiration_date).toISOString()
                : null,
            })
            .eq('id', userId);

          if (clearError) throw clearError;
        }

        return json({ message: `User ${userId} subscription ended` }, 200, origin);
      }

      case 'PRODUCT_CHANGE': {
        if (tier) {
          const { error: changeError } = await supabase
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', userId);

          if (changeError) throw changeError;
        }
        return json({ message: `User ${userId} changed to ${tier}` }, 200, origin);
      }

      default:
        return json({ message: `Unhandled event type: ${event?.type}` }, 200, origin);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: msg }, 500, origin);
  }
});
