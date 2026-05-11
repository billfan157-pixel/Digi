import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';

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
    || localStorage.getItem(CALENDAR_OAUTH_PENDING_KEY) === 'true';
}

function writeCalendarOAuthPendingFlag(value: boolean) {
  if (value) {
    window.sessionStorage.setItem(CALENDAR_OAUTH_PENDING_KEY, 'true');
    localStorage.setItem(CALENDAR_OAUTH_PENDING_KEY, 'true'); // persist qua redirect
    return;
  }
  window.sessionStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
  localStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
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
  const { data: { session } } = await supabase.auth.getSession();

  // Nếu chưa có phiên đăng nhập (app vừa mở lên chưa kịp tải), chặn không gọi API để tránh lỗi 401
  if (!session?.access_token) {
    return { events: [], needs_reauth: true };
  }

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
  const [isSyncing, setIsSyncing] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Sync local state to global store so parent components see it
  const syncToStore = useCallback(() => {
    useAppStore.getState().setAppState({ isCalendarSynced: true });
  }, []);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  const syncCalendar = useCallback(async (
    options: { silent?: boolean; startOAuthIfNeeded?: boolean } = {},
  ): Promise<number | false> => {
    const { silent = false, startOAuthIfNeeded = true } = options;
    const tid = silent ? '' : toast.loading('Dang quet lich trinh Google Calendar...');

    try {
      const proxyResponse = await fetchCalendarEventsViaProxy();

      // Server says the token is expired or missing — start OAuth
      if (proxyResponse.needs_reauth) {
        if (!startOAuthIfNeeded) return false;

        await beginGoogleCalendarOAuth();
        if (!silent) {
          toast.success('Dang mo Google de ket noi Calendar. Hoan tat OAuth de app tiep tuc dong bo.', { id: tid });
        }
        return false;
      }

      const events = (proxyResponse.events || [])
        .map(mapGoogleEvent)
        .filter((event): event is CalendarEventItem => !!event);

      setCalendarEvents(events);
      setIsCalendarSynced(true);
      syncToStore();
      clearRetry();
      writeCalendarOAuthPendingFlag(false);

      if (!silent) {
        toast.success(
          events.length > 0
            ? `Da dong bo ${events.length} su kien sap toi tu Google Calendar.`
            : 'Da ket noi Google Calendar. Khong co su kien sap toi.',
          { id: tid },
        );
      }
      return events.length;
    } catch (error) {
      setIsCalendarSynced(false);
      setCalendarEvents([]);
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Loi dong bo lich trinh.';
        toast.error(message, { id: tid });
      }
      return false;
    }
  }, [syncToStore, clearRetry]);

  // After OAuth redirect, retry sync with backoff until token is ready
  const scheduleRetry = useCallback(() => {
    clearRetry();
    setIsSyncing(true);
    const tid = toast.loading('⏳ Đang đồng bộ Google Calendar sau khi xác thực...', { duration: Infinity });
    // Helper to update toast text
    const updateToast = (msg: string) => toast.loading(msg, { id: tid, duration: Infinity });
    const retry = async () => {
      retryCountRef.current++;
      const attempt = retryCountRef.current;
      console.log(`[Calendar] Retry #${attempt}...`);
      updateToast(`⏳ Đang thử kết nối Google Calendar (lần ${attempt}/8)...`);
      const result = await syncCalendar({ silent: true, startOAuthIfNeeded: false });
      if (result !== false) {
        toast.dismiss(tid);
        setIsSyncing(false);
        if (result > 0) {
          toast.success(`✅ Đã đồng bộ ${result} sự kiện từ Google Calendar!`, { duration: 5000 });
        } else {
          toast.success('✅ Đã kết nối Google Calendar. Không có sự kiện trong tuần này.', { duration: 4000 });
        }
        return;
      }
      if (attempt < 8) {
        const delayMs = Math.min(1500 * attempt, 8000);
        console.log(`[Calendar] Retry #${attempt} failed, next in ${delayMs}ms`);
        updateToast(`⏳ Đồng bộ chưa sẵn sàng, thử lại sau ${Math.round(delayMs/1000)}s...`);
        retryTimerRef.current = setTimeout(retry, delayMs);
      } else {
        toast.dismiss(tid);
        setIsSyncing(false);
        writeCalendarOAuthPendingFlag(false);
        clearRetry();
        toast.error('Không thể đồng bộ Google Calendar. Bạn có thể thử lại bằng nút "Kết nối".', { duration: 6000 });
      }
    };
    retryTimerRef.current = setTimeout(retry, 1000); // Start faster: 1s
  }, [syncCalendar, clearRetry]);

  useEffect(() => {
    const shouldResumeCalendarSync = async () => {
      if (!readCalendarOAuthPendingFlag()) return;
      console.log('[Calendar] OAuth pending flag detected, starting retry...');
      scheduleRetry();
    };

    void shouldResumeCalendarSync();

    const handleTokenUpdated = () => {
      console.log('[Calendar] Token updated event received');
      scheduleRetry();
    };

    window.addEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);

    return () => {
      window.removeEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);
      clearRetry();
    };
  }, [syncCalendar, scheduleRetry, clearRetry]);

  return { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar, isSyncing };
}
