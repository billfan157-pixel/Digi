import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

// Validate webhook URL to prevent SSRF attacks
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    if (Deno.env.get('ALLOW_LOCALHOST_WEBHOOK') === 'true') {
      return { valid: true };
    }

    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Chỉ cho phép HTTPS URLs' };
    }

    const hostname = urlObj.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('0.') ||
        hostname.startsWith('[::')) {
      return { valid: false, error: 'Không cho phép localhost hoặc private addresses' };
    }

    // Block private IP ranges
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipPattern);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);

      // 10.0.0.0/8
      if (a === 10) {
        return { valid: false, error: 'Không cho phép private IP addresses (10.0.0.0/8)' };
      }

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { valid: false, error: 'Không cho phép private IP addresses (172.16.0.0/12)' };
      }

      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { valid: false, error: 'Không cho phép private IP addresses (192.168.0.0/16)' };
      }

      // 169.254.169.254 (cloud metadata)
      if (a === 169 && b === 254 && c === 169 && d === 254) {
        return { valid: false, error: 'Không cho phép cloud metadata endpoints' };
      }
    }

    // Block .local, .internal, .corp TLDs
    const tld = hostname.split('.').pop();
    if (tld === 'local' || tld === 'internal' || tld === 'corp') {
      return { valid: false, error: 'Không cho phép internal TLDs' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'URL không hợp lệ' };
  }
}

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
  
  // Get expected secret from env var or fallback to app_settings table
  let expectedSecret = Deno.env.get('DATABASE_WEBHOOK_SECRET') || '';
  
  // If env var not set, query app_settings table (same fallback as DB trigger)
  if (!expectedSecret) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'webhook_secret')
        .single();
      
      if (settings && settings.value) {
        expectedSecret = settings.value;
      }
    } catch (err) {
      console.error('Failed to fetch webhook_secret from app_settings:', err);
    }
  }

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
  } catch {
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

    // Check webhook subscription daily quota
    const { count, error: countErr } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', sub.id)
      .gte('delivered_at', new Date(Date.now() - 24*60*60*1000).toISOString());

    if (countErr) {
      console.error('Lỗi khi đếm lượng giao webhook:', countErr);
    }

    const currentQuota = sub.daily_quota ?? 200;
    if (count !== null && count >= currentQuota) {
      console.warn(`Webhook subscription ${sub.id} đã vượt quá quota hàng ngày: ${count}/${currentQuota}`);
      
      const { error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .insert({
          id: crypto.randomUUID(),
          subscription_id: sub.id,
          event_type,
          payload: {
            id: crypto.randomUUID(),
            event: event_type,
            timestamp: new Date().toISOString(),
            data: payload,
          },
          response_status: null,
          response_body: null,
          error_message: 'Vượt quá quota webhook hàng ngày',
        });

      if (deliveryError) {
        console.error('Lỗi khi ghi nhận log vượt quota webhook:', deliveryError);
      }

      deliveries.push({
        subscription_id: sub.id,
        url: sub.url,
        success: false,
        status: null,
        error: 'Vượt quá quota webhook hàng ngày',
      });
      continue;
    }

    // Validate webhook URL before dispatching
    const urlValidation = validateWebhookUrl(sub.url);
    if (!urlValidation.valid) {
      console.error(`Webhook URL validation failed for subscription ${sub.id}:`, urlValidation.error);

      // Log delivery failure
      const { error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .insert({
          id: crypto.randomUUID(),
          subscription_id: sub.id,
          event_type,
          payload: {
            id: crypto.randomUUID(),
            event: event_type,
            timestamp: new Date().toISOString(),
            data: payload,
          },
          response_status: null,
          response_body: null,
          error_message: `URL validation failed: ${urlValidation.error}`,
        });

      if (deliveryError) {
        console.error('Lỗi khi ghi nhật ký giao webhook:', deliveryError);
      }

      deliveries.push({
        subscription_id: sub.id,
        url: sub.url,
        success: false,
        status: null,
        error: `URL validation failed: ${urlValidation.error}`,
      });
      continue;
    }

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

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      responseStatus = null;
      responseBody = '';
      errorMessage = null;

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
        if (responseBody.length > 1000) {
          responseBody = responseBody.substring(0, 1000) + '... (bị cắt bớt)';
        }

        if (responseStatus >= 200 && responseStatus < 300) {
          break;
        }

        // Only retry on server-side issues (5xx)
        if (responseStatus < 500) {
          break;
        }

        if (attempt < maxAttempts) {
          const delay = attempt === 1 ? 500 : 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
        if (err instanceof DOMException && err.name === 'AbortError') {
          errorMessage = 'Yêu cầu bị quá hạn thời gian (Timeout 5s)';
        }

        if (attempt < maxAttempts) {
          const delay = attempt === 1 ? 500 : 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
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
