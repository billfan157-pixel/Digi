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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ error: 'Server configuration error' }, 500, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, data } = await req.json();
    if (!user_id || !title) {
      return json({ error: 'Missing required fields: user_id, title' }, 400, origin);
    }

    const rateLimit = await checkRateLimit(`fcm:${user_id}`, RATE_LIMITS.pushNotification);
    if (!rateLimit.allowed) {
      return json({ error: `Rate limited. Try again in ${rateLimit.retryAfterSeconds}s` }, 429, origin);
    }

    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint')
      .eq('user_id', user_id)
      .eq('platform', 'native');

    if (subError) {
      return json({ error: subError.message }, 500, origin);
    }

    if (!subs || subs.length === 0) {
      return json({ sent: 0, message: 'No native subscriptions' }, 200, origin);
    }

    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY') ?? '';
    if (!fcmServerKey) {
      return json({ sent: 0, message: 'FCM not configured' }, 200, origin);
    }

    let sent = 0;
    for (const sub of subs) {
      try {
        const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: sub.endpoint,
            notification: {
              title: title.slice(0, 80),
              body: (body ?? '').slice(0, 240),
              sound: 'default',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
            },
            data: {
              ...(data && typeof data === 'object' ? data : {}),
              url: data?.url ?? '/',
            },
          }),
        });
        if (fcmRes.ok) sent++;
      } catch (err) {
        console.warn('[fcm] Send failed:', err instanceof Error ? err.message : String(err));
      }
    }

    return json({ sent, total: subs.length }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[fcm] Error:', message);
    return json({ error: message }, 500, origin);
  }
});
