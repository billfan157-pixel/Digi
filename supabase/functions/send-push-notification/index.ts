import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

const VAPID_CONTACT = 'mailto:push@digiwell.app';

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
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server configuration error' }, 500, origin);
  }

  if (!vapidPrivateKey || !vapidPublicKey) {
    return json({ error: 'VAPID keys not configured' }, 500, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }

    const rateLimit = await checkRateLimit(`push:${user.id}`, RATE_LIMITS.pushNotification);
    if (!rateLimit.allowed) {
      return json({
        error: `Rate limited. Try again in ${rateLimit.retryAfterSeconds}s`,
      }, 429, origin);
    }

    const { title, body, data: extraData, badge, icon } = await req.json();
    const targetUserId = user.id;
    const safeTitle = typeof title === 'string' && title.trim()
      ? title.trim().slice(0, 80)
      : 'DigiWell';
    const safeBody = typeof body === 'string'
      ? body.trim().slice(0, 240)
      : '';
    const safeData = extraData && typeof extraData === 'object' && !Array.isArray(extraData)
      ? extraData as Record<string, unknown>
      : {};

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', targetUserId);

    if (subError) {
      return json({ error: subError.message }, 500, origin);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return json({ sent: 0, message: 'No subscriptions found' }, 200, origin);
    }

    const payload = JSON.stringify({
      title: safeTitle,
      body: safeBody,
      icon: icon ?? '/pwa-192x192.png',
      badge: badge ?? '/pwa-192x192.png',
      data: safeData,
    });

    let sent = 0;
    let removed = 0;
    const results: Array<{ endpoint: string; ok: boolean; expired?: boolean; error?: string }> = [];

    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(
          sub.endpoint, sub.p256dh, sub.auth,
          payload, vapidPublicKey, vapidPrivateKey,
          VAPID_CONTACT,
        );
        if (result.ok) sent++;
        if (result.expired) {
          removed++;
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
        results.push({ endpoint: sub.endpoint.slice(0, 40) + '...', ...result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('send push failed for', sub.endpoint.slice(0, 40), msg);
        results.push({ endpoint: sub.endpoint.slice(0, 40) + '...', ok: false, error: msg });
      }
    }

    return json({ sent, total: subscriptions.length, removed, results }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('send-push-notification error:', message);
    return json({ error: message }, 500, origin);
  }
});

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
      console.warn('Subscription expired/gone, should be cleaned up:', endpoint.slice(0, 40));
      return { ok: false, expired: true };
    }

    return { ok: response.ok };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Web push failed:', message);
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
