import { supabase, isSupabaseConfigured } from './supabase';

const SESSION_KEY = 'digiwell_session_id';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export async function track(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (!isSupabaseConfigured) return;

  const { data: { session } } = await supabase.auth.getSession();

  try {
    await supabase.from('analytics_events').insert({
      user_id: session?.user?.id || null,
      event_name: eventName,
      properties: properties ?? {},
      session_id: getSessionId(),
      created_at: new Date().toISOString(),
    });
  } catch {
    // analytics should never throw — fire and forget
  }
}
