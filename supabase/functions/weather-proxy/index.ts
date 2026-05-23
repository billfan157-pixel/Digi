import { checkRateLimit, getRateLimitKey } from '../_shared/rateLimit.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';


Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);


  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'weather-proxy');
    const rateLimitResult = await checkRateLimit(rateLimitKey, { maxRequests: 30, windowSeconds: 60 });
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lat, lon, city } = await req.json();

    // Validate inputs
    if (!lat && !lon && !city) {
      return new Response(JSON.stringify({ error: 'Missing location input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenWeather API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build query
    const query = lat && lon
      ? `lat=${lat}&lon=${lon}`
      : city
        ? `q=${encodeURIComponent(city)}`
        : '';

    if (!query) {
      return new Response(JSON.stringify({ error: 'Invalid location input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from OpenWeather API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${apiKey}`,
      {
        signal: req.signal,
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `OpenWeather API error: ${response.statusText}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
