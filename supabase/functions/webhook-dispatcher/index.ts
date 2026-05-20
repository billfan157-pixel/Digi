import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

// Calculate HMAC-SHA256 hex signature using Web Crypto API
async function calculateHmac256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(secret);
  const dataBuf = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataBuf);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  // 1. Authenticate request from Database Trigger
  const dbSecret = req.headers.get('x-database-secret');
  const expectedSecret = Deno.env.get('DATABASE_WEBHOOK_SECRET') || '';

  if (!dbSecret || dbSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Không được phép truy cập từ nguồn này.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse request body
  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Yêu cầu không hợp lệ. Body phải là JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { user_id, event_type, payload } = body;
  if (!user_id || !event_type || !payload) {
    return new Response(JSON.stringify({ error: 'Thiếu thông tin user_id, event_type hoặc payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Initialize Supabase Client with service_role to lookup subscriptions and insert deliveries
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch active subscriptions for the user
  const { data: subscriptions, error: subsError } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_active', true);

  if (subsError) {
    console.error('Lỗi khi truy vấn đăng ký webhook:', subsError);
    return new Response(JSON.stringify({ error: 'Lỗi máy chủ khi truy vấn đăng ký.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ message: 'Không có đăng ký webhook nào hoạt động cho người dùng này.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Match and dispatch to subscriptions
  const deliveries = [];

  for (const sub of subscriptions) {
    const isMatched = sub.events.includes(event_type) || sub.events.includes('*');
    if (!isMatched) continue;

    const deliveryId = crypto.randomUUID();
    const eventPayload = {
      id: deliveryId,
      event: event_type,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const jsonString = JSON.stringify(eventPayload);
    let signature = '';
    try {
      signature = await calculateHmac256(sub.secret, jsonString);
    } catch (err) {
      console.error('Lỗi tính toán chữ ký HMAC:', err);
    }

    let responseStatus: number | null = null;
    let responseBody = '';
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      const response = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-digiwell-signature-256': `sha256=${signature}`,
          'user-agent': 'DigiWell-Webhook-Dispatcher/1.0.0',
        },
        body: jsonString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      responseBody = await response.text();
      // Truncate response body if it's too large to save DB space
      if (responseBody.length > 1000) {
        responseBody = responseBody.substring(0, 1000) + '... (bị cắt bớt)';
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        errorMessage = 'Yêu cầu bị quá hạn thời gian (Timeout 5s)';
      }
    }

    // Insert delivery log
    const { error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .insert({
        id: deliveryId,
        subscription_id: sub.id,
        event_type,
        payload: eventPayload,
        response_status: responseStatus,
        response_body: responseBody || null,
        error_message: errorMessage,
      });

    if (deliveryError) {
      console.error('Lỗi khi ghi nhật ký giao webhook:', deliveryError);
    }

    deliveries.push({
      subscription_id: sub.id,
      url: sub.url,
      success: errorMessage === null && responseStatus !== null && responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      error: errorMessage,
    });
  }

  return new Response(JSON.stringify({ message: 'Đã hoàn thành phân phối webhook.', deliveries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
