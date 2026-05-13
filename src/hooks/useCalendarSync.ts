import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';

export const CALENDAR_OAUTH_PENDING_KEY = 'digiwell_pending_calendar_oauth';
export const CALENDAR_TOKEN_UPDATED_EVENT = 'digiwell:google-provider-token-updated';
const CALENDAR_CACHE_KEY = 'digiwell_calendar_events_cache';
const CALENDAR_SYNCED_KEY = 'digiwell_calendar_synced_flag';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_SYNC_TOAST_ID = 'digiwell-calendar-sync-toast';
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
    localStorage.setItem(CALENDAR_OAUTH_PENDING_KEY, 'true');
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
  // Chỉ lọc ra các sự kiện đang hoạt động
  if (event.status === 'cancelled') return null;
  
  // Note: Một số người dùng set lịch là "Rảnh" (transparent) nhưng vẫn muốn thấy nó.
  // Nếu muốn bỏ qua các lịch rảnh hoàn toàn, có thể uncomment dòng dưới:
  // if (event.transparency === 'transparent') return null;

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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
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

async function fetchCalendarEventsViaProxy(): Promise<CalendarProxyResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { events: [], needs_reauth: true };
  }
  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.functions.invoke('calendar-proxy', {
    body: {
      action: 'list-events',
      maxResults: 50,
      daysAhead: 7,
      timeMin: timeMin.toISOString(),
      providerToken: session.provider_token,
      providerRefreshToken: session.provider_refresh_token,
    },
  });
  if (error) throw new Error(error.message || 'Không thể kết nối calendar proxy.');
  const response = data as CalendarProxyResponse | null;
  if (response?.error) {
    if (response.error.includes('unauthorized') || response.error.includes('invalid_grant')) {
      return { events: [], needs_reauth: true };
    }
    throw new Error(response.error);
  }
  return response ?? { events: [], needs_reauth: true };
}

const SYNC_COOLDOWN_MS = 1 * 60 * 1000; // Giảm cooldown xuống 1 phút

export function useCalendarSync() {
  const isCalendarSynced = useAppStore(s => s.isCalendarSynced);
  const calendarEvents = useAppStore(s => s.calendarEvents);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const lastSyncTimeRef = useRef<number>(0);

  const setIsCalendarSynced = useCallback((synced: boolean) => {
    useAppStore.getState().setAppState({ isCalendarSynced: synced });
    localStorage.setItem(CALENDAR_SYNCED_KEY, synced ? 'true' : 'false');
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
    const now = Date.now();
    
    if (lastSyncTimeRef.current > 0 && now - lastSyncTimeRef.current < SYNC_COOLDOWN_MS) {
      return calendarEvents.length;
    }

    const tid = silent ? '' : toast.loading('Đang cập nhật lịch Google...', { id: CALENDAR_SYNC_TOAST_ID });
    if (!silent) setIsSyncing(true);

    try {
      const proxyResponse = await fetchCalendarEventsViaProxy();
      lastSyncTimeRef.current = Date.now();

      if (proxyResponse.needs_reauth) {
        // Nếu cần re-auth, gỡ cờ để nút Connect hiện ra
        setIsCalendarSynced(false);
        setIsSyncing(false);

        if (!startOAuthIfNeeded) return false;

        await beginGoogleCalendarOAuth();
        if (!silent) {
          toast.success('Phiên làm việc hết hạn, vui lòng đăng nhập lại Google.', { id: tid });
        }
        return false;
      }

      const events = (proxyResponse.events || [])
        .map(mapGoogleEvent)
        .filter((event): event is CalendarEventItem => !!event);

      const store = useAppStore.getState();
      const currentEventsStr = JSON.stringify(store.calendarEvents);
      const newEventsStr = JSON.stringify(events);

      // Cập nhật dữ liệu mới nhất
      store.setAppState({ 
        calendarEvents: events,
        isCalendarSynced: true 
      });
      localStorage.setItem(CALENDAR_CACHE_KEY, newEventsStr);
      localStorage.setItem(CALENDAR_SYNCED_KEY, 'true');

      clearRetry();
      writeCalendarOAuthPendingFlag(false);

      if (!silent) {
        toast.success(
          events.length > 0
            ? `Đã đồng bộ ${events.length} sự kiện mới nhất.`
            : 'Lịch trình trống.',
          { id: tid },
        );
      }
      setIsSyncing(false);
      return events.length;
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Lỗi đồng bộ.';
        toast.error(message, { id: tid });
      }
      setIsSyncing(false);
      return false;
    }
  }, [calendarEvents.length, clearRetry, setIsCalendarSynced]);

  const scheduleRetry = useCallback(() => {
    clearRetry();
    const retry = async () => {
      retryCountRef.current++;
      const attempt = retryCountRef.current;
      const result = await syncCalendar({ silent: true, startOAuthIfNeeded: false });
      if (result !== false) return;
      if (attempt < 3) {
        retryTimerRef.current = setTimeout(retry, Math.min(1500 * attempt, 6000));
      } else {
        writeCalendarOAuthPendingFlag(false);
        clearRetry();
      }
    };
    retryTimerRef.current = setTimeout(retry, 1000);
  }, [syncCalendar, clearRetry]);

  useEffect(() => {
    // 1. Khôi phục từ Cache
    const cachedEvents = localStorage.getItem(CALENDAR_CACHE_KEY);
    const cachedSynced = localStorage.getItem(CALENDAR_SYNCED_KEY) === 'true';
    if (cachedEvents || cachedSynced) {
      useAppStore.getState().setAppState({
        calendarEvents: cachedEvents ? JSON.parse(cachedEvents) : [],
        isCalendarSynced: cachedSynced
      });
    }

    // 2. Tự động quét mới
    const initSync = async () => {
      const isPending = readCalendarOAuthPendingFlag();
      if (isPending) {
        scheduleRetry();
        return;
      }
      // Nếu đã từng sync, tự động quét ngầm
      if (cachedSynced) {
        await syncCalendar({ silent: true, startOAuthIfNeeded: false });
      }
    };

    void initSync();

    const handleTokenUpdated = () => scheduleRetry();
    window.addEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);

    return () => {
      window.removeEventListener(CALENDAR_TOKEN_UPDATED_EVENT, handleTokenUpdated);
      clearRetry();
    };
  }, []);

  return { isCalendarSynced, setIsCalendarSynced, calendarEvents, syncCalendar, isSyncing };
}
