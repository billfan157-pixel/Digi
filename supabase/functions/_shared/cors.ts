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

export function getCorsHeaders(origin: string | null, extraHeaders = '') {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : appUrl;
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

  if (!allowedOrigins.includes(origin ?? '')) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin, extraHeaders) },
    });
  }

  return null;
}
