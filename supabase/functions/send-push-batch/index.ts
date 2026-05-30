import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const VAPID_CONTACT = 'mailto:push@digiwell.app';

Deno.serve(async (req: Request) => {
  const dbSecret = req.headers.get('x-database-secret');
  let expectedSecret = Deno.env.get('DATABASE_WEBHOOK_SECRET') || '';

  if (!expectedSecret) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: settings } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'webhook_secret')
          .single();
        if (settings?.value) expectedSecret = settings.value;
      }
    } catch {
      // fallback env check only
    }
  }

  if (!dbSecret || dbSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY') ?? '';
  if ((!vapidPrivateKey || !vapidPublicKey) && !fcmServerKey) {
    return new Response(JSON.stringify({ error: 'No push provider configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, recipient_id, type, message')
      .is('push_sent', false)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (notifError) {
      return new Response(JSON.stringify({ error: notifError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0, processed: 0, message: 'Không có thông báo chờ xử lý' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const grouped = new Map<string, Array<{ id: string; type: string; message: string | null }>>();
    for (const n of notifications) {
      const list = grouped.get(n.recipient_id) || [];
      list.push(n);
      grouped.set(n.recipient_id, list);
    }

    let totalSent = 0;
    const notificationIds: string[] = [];

    for (const [recipientId, userNotifs] of grouped) {
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth, platform')
        .eq('user_id', recipientId);

      if (subError) {
        console.warn(`[push-batch] Failed to query subscriptions for ${recipientId}: ${subError.message}`);
        notificationIds.push(...userNotifs.map(n => n.id));
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        notificationIds.push(...userNotifs.map(n => n.id));
        continue;
      }

      for (const notif of userNotifs) {
        const title = getTitle(notif.type);
        const body = (notif.message ?? '').slice(0, 240);
        const data = { type: notif.type, url: getUrl(notif.type) };

        for (const sub of subscriptions) {
          if (sub.platform === 'native' && fcmServerKey) {
            try {
              const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                  'Authorization': `key=${fcmServerKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: sub.endpoint,
                  notification: { title: title.slice(0, 80), body, sound: 'default', icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' },
                  data,
                }),
              });
              if (fcmRes.ok) totalSent++;
            } catch (err) {
              console.warn('[push-batch] FCM send failed:', err instanceof Error ? err.message : String(err));
            }
          } else if (sub.platform === 'web' || !sub.platform) {
            try {
              const payload = JSON.stringify({
                title, body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                data,
              });
              const result = await sendWebPush(
                sub.endpoint, sub.p256dh!, sub.auth!,
                payload, vapidPublicKey, vapidPrivateKey,
                VAPID_CONTACT,
              );
              if (result.ok) totalSent++;
              if (result.expired) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              console.warn('[push-batch] Web push failed:', sub.endpoint.slice(0, 40), msg);
            }
          }
        }

        notificationIds.push(notif.id);
      }
    }

    if (notificationIds.length > 0) {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ push_sent: true })
        .in('id', notificationIds);

      if (updateError) {
        console.warn('[push-batch] Failed to mark notifications as sent:', updateError.message);
      }
    }

    return new Response(JSON.stringify({
      sent: totalSent,
      processed: notificationIds.length,
      total: notifications.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[push-batch] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function getTitle(type: string): string {
  switch (type) {
    case 'club_challenge': return 'Thách đấu Club';
    case 'club_battle_started': return 'Trận chiến Club';
    case 'club_battle_result': return 'Kết quả Club War';
    case 'duel_invite': return 'Lời thách đấu';
    case 'duel_result': return 'Kết quả đấu';
    case 'water_drop': return 'Nước từ bạn bè';
    default: return 'DigiWell';
  }
}

function getUrl(type: string): string {
  switch (type) {
    case 'club_challenge':
    case 'club_battle_started':
    case 'club_battle_result':
      return '/clubs';
    case 'duel_invite':
    case 'duel_result':
      return '/arena';
    case 'water_drop':
      return '/feed';
    default: return '/';
  }
}

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  contact: string,
): Promise<{ ok: boolean; expired?: boolean }> {
  try {
    const { body, contentEncoding } = await encryptPushPayload(payload, p256dh, auth);
    const jwt = await createVapidJwt(endpoint, contact, vapidPublicKey, vapidPrivateKey);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Encoding': contentEncoding,
        'Content-Type': 'application/octet-stream',
        TTL: '86400',
        Urgency: 'normal',
      },
      body,
    });

    if (response.status === 404 || response.status === 410) {
      return { ok: false, expired: true };
    }

    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    bytesToArrayBuffer(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, bytesToArrayBuffer(data)));
}

async function hkdfExpand(prk: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const digest = await hmacSha256(prk, concatBytes(textBytes(info), new Uint8Array([1])));
  return digest.slice(0, length);
}

async function encryptPushPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<{ body: Uint8Array; contentEncoding: string }> {
  const receiverPublicKey = base64UrlToBytes(p256dh);
  const authSecret = base64UrlToBytes(auth);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const senderKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );
  const senderPublicKey = new Uint8Array(await crypto.subtle.exportKey('raw', senderKeys.publicKey));
  const importedReceiverKey = await crypto.subtle.importKey(
    'raw',
    bytesToArrayBuffer(receiverPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: importedReceiverKey },
    senderKeys.privateKey,
    256,
  ));

  const prkKey = await hmacSha256(authSecret, sharedSecret);
  const keyInfo = concatBytes(textBytes('WebPush: info\0'), receiverPublicKey, senderPublicKey);
  const ikm = await hmacSha256(prkKey, keyInfo);
  const prk = await hmacSha256(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(prk, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = await hkdfExpand(prk, 'Content-Encoding: nonce\0', 12);
  const key = await crypto.subtle.importKey(
    'raw',
    bytesToArrayBuffer(contentEncryptionKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const plaintext = concatBytes(textBytes(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(nonce), tagLength: 128 },
    key,
    bytesToArrayBuffer(plaintext),
  ));
  const recordSize = new Uint8Array([0, 0, 16, 0]);
  const keyIdLength = new Uint8Array([senderPublicKey.length]);

  return {
    body: concatBytes(salt, recordSize, keyIdLength, senderPublicKey, ciphertext),
    contentEncoding: 'aes128gcm',
  };
}

async function createVapidJwt(
  endpoint: string,
  contact: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<string> {
  const publicKeyBytes = base64UrlToBytes(vapidPublicKey);
  const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: contact,
  };
  const encodedHeader = bytesToBase64Url(textBytes(JSON.stringify(header)));
  const encodedClaims = bytesToBase64Url(textBytes(JSON.stringify(claims)));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: bytesToBase64Url(publicKeyBytes.slice(1, 33)),
      y: bytesToBase64Url(publicKeyBytes.slice(33, 65)),
      d: bytesToBase64Url(privateKeyBytes),
      ext: false,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    bytesToArrayBuffer(textBytes(signingInput)),
  ));

  return `${signingInput}.${bytesToBase64Url(signature)}`;
}
