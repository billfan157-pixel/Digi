import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { redis } from '../_shared/redis.ts';
import { captureException } from '../_shared/sentry.ts';

/// <reference lib="deno.ns" />

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

interface QueueMessage {
  id: bigint;
  msg_id: bigint;
  read_ct: number;
  message: {
    type: 'webhook_dispatch' | 'push_notification';
    payload: Record<string, unknown>;
    subscription_id?: string;
    user_id?: string;
    event_type?: string;
    retry_count?: number;
  };
}

async function processWebhookDispatch(supabase: ReturnType<typeof createClient>, msg: QueueMessage) {
  const { payload, subscription_id, event_type } = msg.message;
  if (!subscription_id || !event_type) return;

  const { data: sub } = await supabase
    .from('webhook_subscriptions')
    .select('url, secret, is_active')
    .eq('id', subscription_id)
    .single();

  if (!sub || !sub.is_active) return;

  const signature = await createHmacSignature(JSON.stringify(payload), sub.secret);
  const response = await fetch(sub.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-digiwell-signature-256': signature,
      'x-digiwell-event': event_type,
      'User-Agent': 'DigiWell-Webhook/1.0',
    },
    body: JSON.stringify(payload),
  });

  await supabase.from('webhook_deliveries').insert({
    subscription_id,
    event_type,
    payload,
    response_status: response.status,
    response_body: await response.text().catch(() => null),
    delivered_at: new Date().toISOString(),
  });

  if (!response.ok && (msg.message.retry_count ?? 0) < MAX_RETRIES) {
    await supabase.rpc('pgmq_send', {
      queue_name: 'webhook_dispatch_queue',
      msg: JSON.stringify({ ...msg.message, retry_count: (msg.message.retry_count ?? 0) + 1 }),
      delay: Math.pow(2, msg.message.retry_count ?? 0) * 5,
    });
  }
}

async function processPushNotification(supabase: ReturnType<typeof createClient>, msg: QueueMessage) {
  const { user_id, payload } = msg.message;
  if (!user_id) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('push_subscription, push_enabled')
    .eq('id', user_id)
    .single();

  if (!profile?.push_subscription || !profile.push_enabled) return;

  try {
    const subscription = JSON.parse(profile.push_subscription);
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${Deno.env.get('FCM_SERVER_KEY') ?? ''}`,
      },
      body: JSON.stringify({
        to: subscription.endpoint,
        notification: payload,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
}

async function createHmacSignature(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function handler(request: Request): Promise<Response> {
  const startTime = performance.now();
  const authHeader = request.headers.get('Authorization') ?? '';
  const expectedToken = Deno.env.get('QUEUE_WORKER_SECRET') ?? '';

  if (authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const processed: string[] = [];
  const errors: string[] = [];

  try {
    for (const queueName of ['webhook_dispatch_queue', 'push_notification_queue']) {
      for (let i = 0; i < BATCH_SIZE; i++) {
        const { data: msg, error } = await supabase.rpc('pgmq_read', {
          queue_name: queueName,
          max_messages: 1,
          visibility_timeout: 30,
        }) as { data: QueueMessage[] | null; error: unknown };

        if (error || !msg || msg.length === 0) break;

        const message = msg[0];
        try {
          if (message.message.type === 'webhook_dispatch') {
            await processWebhookDispatch(supabase, message);
          } else if (message.message.type === 'push_notification') {
            await processPushNotification(supabase, message);
          }
          await supabase.rpc('pgmq_delete', {
            queue_name: queueName,
            msg_id: message.msg_id,
          });
          processed.push(`${queueName}:${message.msg_id}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await supabase.from('dead_letter_queue').insert({
            queue_name: queueName,
            message: message.message,
            error_message: errorMsg,
            retry_count: message.message.retry_count ?? 0,
          });
          await supabase.rpc('pgmq_delete', {
            queue_name: queueName,
            msg_id: message.msg_id,
          });
          errors.push(`${queueName}:${message.msg_id} - ${errorMsg}`);
          await captureException(err, { queueName, msgId: String(message.msg_id) });
        }
      }
    }

    const duration = performance.now() - startTime;
    return new Response(JSON.stringify({
      success: true,
      processed,
      errors,
      duration_ms: Math.round(duration),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await captureException(err, { handler: 'queue-worker' });
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
