import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import { AppStorage } from '@/lib/storage';

export const CALENDAR_OAUTH_PENDING_KEY = 'digiwell_pending_calendar_oauth';
export const CALENDAR_TOKEN_UPDATED_EVENT = 'digiwell:google-provider-token-updated';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  startRaw: string;
  endRaw: string;
  isAllDay: boolean;
  htmlLink?: string;
}

type CalendarOAuthOptions = {
  provider: 'google';
  options: {
    redirectTo: string;
    skipBrowserRedirect: boolean;
    scopes: string;
    queryParams: {
      access_type: string;
      prompt: string;
      include_granted_scopes: string;
    };
  };
};

type GoogleEventDateTime = {
  date?: string;
  dateTime?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  htmlLink?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
};

type CalendarProxyResponse = {
  events?: GoogleCalendarEvent[];
  needs_reauth?: boolean;
  error?: string;
};

function getOAuthRedirectTo() {
  return Capacitor.isNativePlatform() ? 'digiwell://login-callback' : window.location.origin;
}

function readCalendarOAuthPendingFlag() {
  return window.sessionStorage.getItem(CALENDAR_OAUTH_PENDING_KEY) === 'true'
    || AppStorage.getItem(CALENDAR_OAUTH_PENDING_KEY) === 'true';
}

function writeCalendarOAuthPendingFlag(value: boolean) {
  if (value) {
    window.sessionStorage.setItem(CALENDAR_OAUTH_PENDING_KEY, 'true');
    AppStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
    return;
  }

  window.sessionStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
  AppStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
}

function getDisplayTime(date: GoogleEventDateTime | undefined, isEnd = false) {
  if (!date) return '--';

  if (date.dateTime) {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date.dateTime));
  }

  if (date.date) {
    if (isEnd) return '23:59';
    return '00:00';
  }

  return '--';
}

function mapGoogleEvent(event: GoogleCalendarEvent): CalendarEventItem | null {
  const isAllDay = !!event.start?.date && !event.start?.dateTime;
  const startRaw = event.start?.dateTime || event.start?.date || '';
  const endRaw = event.end?.dateTime || event.end?.date || '';

  if (!event.id || !startRaw) return null;

  return {
    id: event.id,
    title: event.summary?.trim() || 'Su kien khong ten',
    start: getDisplayTime(event.start),
    end: getDisplayTime(event.end, true),
    startRaw,
    endRaw,
    isAllDay,
    htmlLink: event.htmlLink,
  };
}

async function beginGoogleCalendarOAuth() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Vui long dang nhap truoc khi ket noi Google Calendar.');

  writeCalendarOAuthPendingFlag(true);

  const credentials: CalendarOAuthOptions = {
    provider: 'google' as const,
    options: {
      redirectTo: getOAuthRedirectTo(),
      skipBrowserRedirect: Capacitor.isNativePlatform(),
      scopes: GOOGLE_CALENDAR_SCOPE,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
      },
    },
  };

  const hasGoogleIdentity = user.identities?.some((identity: { provider?: string }) => identity.provider === 'google');
  const response = hasGoogleIdentity
    ? await supabase.auth.signInWithOAuth(credentials)
    : await supabase.auth.linkIdentity(credentials);

  if (response.error) throw response.error;

  if (Capacitor.isNativePlatform() && response.data?.url) {
    await Browser.open({ url: response.data.url });
  }
}

/**
 * Fetch calendar events via the server-side proxy Edge Function.
 * The provider token never reaches the client.
 */
async function fetchCalendarEventsViaProxy(): Promise<CalendarProxyResponse> {
  const { data, error } = await supabase.functions.invoke('calendar-proxy', {
    body: { action: 'list-events', maxResults: 10 },
  });

  if (error) {
    throw new Error(error.message || 'Khong the ket noi calendar proxy.');
  }

  const response = data as CalendarProxyResponse | null;
  if (response?.error) {
    throw new Error(response.error);
  }

  return response ?? { events: [], needs_reauth: true };
}

export function useCalendarSync() {
  const [isCalendarSynced, setIsCalendarSynced] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

  const syncCalendar = useCallback(async (
    options: { silent?: boolean; startOAuthIfNeeded?: boolean } = {},
  ) => {
    const { silent = false, startOAuthIfNeeded = true } = options;
    const tid = silent ? '' : toast.loading('Dang quet lich trinh Google Calendar...');

    try {
      const proxyResponse = await fetchCalendarEventsViaProxy();

      // Server says the token is expired or missing — start OAuth
      if (proxyResponse.needs_reauth) {
        if (!startOAuthIfNeeded) return;

        await beginGoogleCalendarOAuth();
        if (!silent) {
          toast.success('Dang mo Google de ket noi Calendar. Hoan tat OAuth de app tiep tuc dong bo.', { id: tid });
        }
        return;
      }

      const events = (proxyResponse.events || [])
        .map(mapGoogleEvent)
        .filter((event): event is CalendarEventItem => !!event);

      setCalendarEvents(events);
      setIsCalendarSynced(true);
      writeCalendarOAuthPendingFlag(false);

      if (!silent) {
        toast.success(
          events.length > 0
            ? `Da dong bo ${events.length} su kien sap toi tu Google Calendar.`
            : 'Da ket noi Google Calendar. Khong co su kien sap toi.',
          { id: tid },
        );
      }
    } catch (error) {
      setIsCalendarSynced(false);
      setCalendarEvents([]);
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Loi dong bo lich trinh.';
        toast.error(message, { id: tid });
      }
    }
  }, []);

  useEffect(() => {
      const shouldResumeCalendarSync = async () => {
      if (!readCalendarOAuthPendingFlag()) return;
      await syncCalendar({ silent: true, startOAuthIfNeeded: false });
    };

    void shouldResumeCalendarSync();

    const handleTokenUpdated = () => {
      void syncCalendar({ silent: true, startOAuthIfNeeded: false });
    };

    window.addEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);

    return () => {
      window.removeEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);
    };
  }, [syncCalendar]);

  return { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar };
}
