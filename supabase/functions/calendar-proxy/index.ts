// deno-lint-ignore no-import-prefix
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

type CalendarProxyAction = 'list-events';

type CalendarProxyRequestBody = {
  action?: CalendarProxyAction;
  maxResults?: number;
  daysAhead?: number;
  providerToken?: string;
  providerRefreshToken?: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Attempt to refresh an expired Google access token using the refresh token
 * stored in Supabase Auth's identity metadata.
 */
async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Google token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    return typeof data.access_token === 'string' ? data.access_token : null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Try to get a valid Google access token for the user.
 *
 * Strategy:
 * 1. Read provider_token from the active Supabase session
 * 2. If expired, try using provider_refresh_token from the session
 * 3. If no refresh token in session, try reading from admin API
 * 4. If all fail, return null (client must re-auth)
 */
async function resolveGoogleAccessToken(
  // deno-lint-ignore no-explicit-any
  userSupabase: any,
  userId: string,
  providerToken = '',
  providerRefreshToken = '',
): Promise<{ token: string | null; needsReauth: boolean }> {
  // Step 1: Try the provider token passed by the authenticated client.
  if (providerToken) {
    const testResponse = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary?fields=id`,
      { headers: { Authorization: `Bearer ${providerToken}` } },
    );

    if (testResponse.ok) {
      return { token: providerToken, needsReauth: false };
    }

    if ((testResponse.status === 401 || testResponse.status === 403) && providerRefreshToken) {
      const refreshed = await refreshGoogleAccessToken(providerRefreshToken);
      if (refreshed) {
        return { token: refreshed, needsReauth: false };
      }
    }
  }

  if (providerRefreshToken) {
    const refreshed = await refreshGoogleAccessToken(providerRefreshToken);
    if (refreshed) {
      return { token: refreshed, needsReauth: false };
    }
  }

  // Step 2: Try the session's provider_token when available.
  try {
    const { data: sessionData } = await userSupabase.auth.getSession();
    const session = sessionData?.session;

    if (session?.provider_token) {
      // Validate token by making a lightweight request
      const testResponse = await fetch(
        `${CALENDAR_API_BASE}/calendars/primary?fields=id`,
        { headers: { Authorization: `Bearer ${session.provider_token}` } },
      );

      if (testResponse.ok) {
        return { token: session.provider_token, needsReauth: false };
      }

      // Token expired — try refresh
      if (testResponse.status === 401 || testResponse.status === 403) {
        if (session.provider_refresh_token) {
          const refreshed = await refreshGoogleAccessToken(session.provider_refresh_token);
          if (refreshed) {
            return { token: refreshed, needsReauth: false };
          }
        }
      }
    }

    // Step 3: Try refresh token from session even if provider_token was missing
    if (session?.provider_refresh_token) {
      const refreshed = await refreshGoogleAccessToken(session.provider_refresh_token);
      if (refreshed) {
        return { token: refreshed, needsReauth: false };
      }
    }
  } catch (error) {
    console.error('Error resolving session token:', error);
  }

  // Step 4: Try admin API to get the refresh token from auth.users
  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: adminUser, error: adminError } = await adminClient.auth.admin.getUserById(userId);

      if (!adminError && adminUser?.user) {
        // Try raw_app_meta_data for refresh token
        const rawMeta = (adminUser.user as unknown as Record<string, unknown>).raw_app_meta_data as Record<string, unknown> | undefined;
        const refreshToken = (rawMeta?.provider_refresh_token as string) || '';

        if (refreshToken) {
          const refreshed = await refreshGoogleAccessToken(refreshToken);
          if (refreshed) {
            return { token: refreshed, needsReauth: false };
          }
        }
      }
    } catch (error) {
      console.error('Admin token resolution failed:', error);
    }
  }

  // All strategies exhausted — user must re-authenticate
  return { token: null, needsReauth: true };
}

async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number,
  daysAhead: number,
): Promise<Record<string, unknown>[]> {
  const now = new Date();
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + Math.min(Math.max(daysAhead, 1), 14));

  const query = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(Math.min(Math.max(maxResults, 1), 25)),
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error('TOKEN_EXPIRED');
  }

  if (!response.ok) {
    throw new Error(`Google Calendar API error (${response.status}).`);
  }

  const payload = (await response.json()) as { items?: Record<string, unknown>[] };
  return (payload.items || []).map((event) => ({
    id: event.id,
    summary: event.summary,
    htmlLink: event.htmlLink,
    status: event.status,
    transparency: event.transparency,
    start: event.start,
    end: event.end,
  }));
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'Missing Supabase configuration.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  // Authenticate via Supabase JWT
  const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  try {
    const body = (await request.json()) as CalendarProxyRequestBody;
    const action = body.action;

    if (action !== 'list-events') {
      return json({ error: `Unsupported action "${action}".` }, 400);
    }

    const maxResults = typeof body.maxResults === 'number' ? body.maxResults : 10;
    const daysAhead = typeof body.daysAhead === 'number' ? body.daysAhead : 7;
    const providerToken = typeof body.providerToken === 'string' ? body.providerToken : '';
    const providerRefreshToken = typeof body.providerRefreshToken === 'string' ? body.providerRefreshToken : '';

    // Resolve a valid Google access token
    const { token, needsReauth } = await resolveGoogleAccessToken(
      userSupabase,
      user.id,
      providerToken,
      providerRefreshToken,
    );

    if (needsReauth || !token) {
      return json({ needs_reauth: true, events: [] });
    }

    // Fetch events
    try {
      const events = await fetchCalendarEvents(token, maxResults, daysAhead);
      return json({ events, needs_reauth: false });
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return json({ needs_reauth: true, events: [] });
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return json({ error: message }, 500);
  }
});
