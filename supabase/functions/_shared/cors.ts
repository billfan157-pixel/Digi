/**
 * Shared CORS helper for Supabase Edge Functions.
 * Replaces wildcard '*' with origin allowlists to prevent CSRF attacks.
 */

const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';

const allowedOrigins = [
  appUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'capacitor://localhost',
  ...(Deno.env.get('EXTRA_ALLOWED_ORIGINS')?.split(',').filter(Boolean) ?? []),
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.protocol === 'capacitor:' ||
      origin === 'capacitor://localhost'
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(origin: string | null, extraHeaders = '') {
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : appUrl;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': `authorization, x-client-info, apikey, content-type${extraHeaders ? `, ${extraHeaders}` : ''}`,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function handleCors(request: Request, extraHeaders = ''): Response | null {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin, extraHeaders) });
  }

  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin, extraHeaders) },
    });
  }

  return null;
}
