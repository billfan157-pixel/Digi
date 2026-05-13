import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';

export const CALENDAR_OAUTH_PENDING_KEY = 'digiwell_pending_calendar_oauth';
export const CALENDAR_TOKEN_UPDATED_EVENT = 'digiwell:google-provider-token-updated';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_SYNC_TOAST_ID = 'digiwell-calendar-sync-toast';
const CALENDAR_RETRY_TOAST_DURATION_MS = 3000;
const CALENDAR_OAUTH_MODE_KEY = 'digiwell_calendar_oauth_mode';

export interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  startRaw: string;
  endRaw: string;
  isAllDay: boolean;
  status?: string;
  transparency?: string;
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
  status?: string;
  transparency?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
};

type CalendarOAuthMode = 'link' | 'signin';

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
  if (event.status === 'cancelled' || event.transparency === 'transparent') {
    return null;
  }

  const isAllDay = !!event.start?.date && !event.start?.dateTime;
  const startRaw = event.start?.dateTime || event.start?.date || '';
  const endRaw = event.end?.dateTime || event.end?.date || '';

  if (!event.id || !startRaw) return null;

  return {
    id: event.id,
    title: event.summary?.trim() || 'Sự kiện không tên',
    start: getDisplayTime(event.start),
    end: getDisplayTime(event.end, true),
    startRaw,
    endRaw,
    isAllDay,
    status: event.status,
    transparency: event.transparency,
    htmlLink: event.htmlLink,
  };
}

function readCalendarOAuthMode(): CalendarOAuthMode | null {
  const mode = window.sessionStorage.getItem(CALENDAR_OAUTH_MODE_KEY)
    || localStorage.getItem(CALENDAR_OAUTH_MODE_KEY);
  return mode === 'link' || mode === 'signin' ? mode : null;
}

function writeCalendarOAuthMode(mode: CalendarOAuthMode | null) {
  if (mode) {
    window.sessionStorage.setItem(CALENDAR_OAUTH_MODE_KEY, mode);
    localStorage.setItem(CALENDAR_OAUTH_MODE_KEY, mode);
    return;
  }
  window.sessionStorage.removeItem(CALENDAR_OAUTH_MODE_KEY);
  localStorage.removeItem(CALENDAR_OAUTH_MODE_KEY);
}

async function beginGoogleCalendarOAuth(options: { forceSignIn?: boolean } = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Vui lòng đăng nhập trước khi kết nối Google Calendar.');

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
  const shouldSignIn = options.forceSignIn || hasGoogleIdentity;
  writeCalendarOAuthMode(shouldSignIn ? 'signin' : 'link');

  const response = shouldSignIn
    ? await supabase.auth.signInWithOAuth(credentials)
    : await supabase.auth.linkIdentity(credentials);

  if (response.error) throw response.error;

  if (Capacitor.isNativePlatform() && response.data?.url) {
    await Browser.open({ url: response.data.url });
  }
}

/**
 * Fetch calendar events via the server-side proxy Edge Function.
 * The provider token is passed in Authorization header for safety.
 */
async function fetchCalendarEventsViaProxy(): Promise<CalendarProxyResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  // Nếu chưa có phiên đăng nhập (app vừa mở lên chưa kịp tải), chặn không gọi API để tránh lỗi 401
  if (!session?.access_token) {
    return { events: [], needs_reauth: true };
  }

  // Bắt đầu từ đầu ngày hôm nay (local time) để lấy đủ lịch trình cả ngày
  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0);

  const providerToken = session.provider_token;
  const refreshToken = session.provider_refresh_token;

  const { data, error } = await supabase.functions.invoke('calendar-proxy', {
    body: {
      action: 'list-events',
      maxResults: 50,
      daysAhead: 7,
      timeMin: timeMin.toISOString(),
      providerToken,
      providerRefreshToken: refreshToken,
    },
  });

  if (error) {
    throw new Error(error.message || 'Không thể kết nối calendar proxy.');
  }

  const response = data as CalendarProxyResponse | null;
  if (response?.error) {
    // Nếu proxy báo lỗi unauthorized, có thể cần re-auth
    if (response.error.includes('unauthorized') || response.error.includes('invalid_grant')) {
      return { events: [], needs_reauth: true };
    }
    throw new Error(response.error);
  }

  return response ?? { events: [], needs_reauth: true };
}

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút giữa các lần sync

export function useCalendarSync() {
  const [isCalendarSynced, setIsCalendarSynced] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const lastSyncTimeRef = useRef<number>(0);

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
    toast.dismiss(CALENDAR_SYNC_TOAST_ID);
  }, []);

  const syncCalendar = useCallback(async (
    options: { silent?: boolean; startOAuthIfNeeded?: boolean } = {},
  ): Promise<number | false> => {
    const { silent = false, startOAuthIfNeeded = true } = options;
    // Cooldown: không sync nếu đã sync trong 5 phút gần đây
    const now = Date.now();
    if (lastSyncTimeRef.current > 0 && now - lastSyncTimeRef.current < SYNC_COOLDOWN_MS) {
      if (!silent) {
        toast.success('Lịch trình đã được đồng bộ gần đây.', { id: toast.loading('') });
      }
      return isCalendarSynced ? 0 : false;
    }

    const tid = silent ? '' : toast.loading('Đang quét lịch trình Google Calendar...');

    try {
      const proxyResponse = await fetchCalendarEventsViaProxy();
      lastSyncTimeRef.current = Date.now();

      // Server says the token is expired or missing — start OAuth
      if (proxyResponse.needs_reauth) {
        if (!startOAuthIfNeeded) return false;

        await beginGoogleCalendarOAuth();
        if (!silent) {
          toast.success('Đang mở Google để kết nối Calendar. Hoàn tất OAuth để app tiếp tục đồng bộ.', { id: tid });
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
      writeCalendarOAuthMode(null);

      if (!silent) {
        toast.success(
          events.length > 0
            ? `Đã đồng bộ ${events.length} sự kiện sắp tới từ Google Calendar.`
            : 'Đã kết nối Google Calendar. Không có sự kiện sắp tới.',
          { id: tid },
        );
      }
      return events.length;
    } catch (error) {
      setIsCalendarSynced(false);
      setCalendarEvents([]);
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Lỗi đồng bộ lịch trình.';
        toast.error(message, { id: tid });
      }
      return false;
    }
  }, [syncToStore, clearRetry]);

  // After OAuth redirect, retry sync with backoff (silent, no toasts)
  const scheduleRetry = useCallback(() => {
    clearRetry();
    setIsSyncing(true);
    const retry = async () => {
      retryCountRef.current++;
      const attempt = retryCountRef.current;
      console.log(`[Calendar] Silent retry #${attempt}...`);
      const result = await syncCalendar({ silent: true, startOAuthIfNeeded: false });
      if (result !== false) {
        setIsSyncing(false);
        console.log(`[Calendar] Sync success after retry #${attempt}`);
        return;
      }
      if (attempt < 3) {
        const delayMs = Math.min(1500 * attempt, 6000);
        console.log(`[Calendar] Retry #${attempt} failed, next in ${delayMs}ms`);
        retryTimerRef.current = setTimeout(retry, delayMs);
      } else {
        setIsSyncing(false);
        writeCalendarOAuthPendingFlag(false);
        writeCalendarOAuthMode(null);
        clearRetry();
        console.log('[Calendar] All retries exhausted');
      }
    };
    retryTimerRef.current = setTimeout(retry, 1000);
  }, [syncCalendar, clearRetry]);

  useEffect(() => {
    const shouldResumeCalendarSync = async () => {
      // If pending flag OR no flag but we should try sync silently
      // to detect if user already has a Google session
      const isPending = readCalendarOAuthPendingFlag();

      if (isPending) {
        console.log('[Calendar] OAuth pending flag detected, starting retry...');
        scheduleRetry();
        return;
      }

      // No pending flag — try a silent sync to check if Google is already linked
      // This handles the case where the flag was lost during redirect
      console.log('[Calendar] No pending flag, trying silent sync...');
      await syncCalendar({ silent: true, startOAuthIfNeeded: false });
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
