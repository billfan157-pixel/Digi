// src/hooks/useAppSystem.ts
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
// ✅ Import đúng hook đã sửa
import { useWeatherSync } from './useWeatherSync';
import {
  CALENDAR_OAUTH_PENDING_KEY,
  CALENDAR_TOKEN_UPDATED_EVENT,
  useCalendarSync,
} from './useCalendarSync';
import { useDeviceHealth } from './useDeviceHealth';
import { appQueryKeys } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import { ensureProfileExists, fetchProfileById } from '@/services/profile.service';
import {
  clearUserSessionArtifacts,
  getBiometricEnabled,
  purgeLegacySensitiveStorage,
} from '@/lib/sessionSecurity';

export function useAppSystem() {
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'app' | 'locked'>('welcome');
  const [profile, setProfile] = useState<any>(null);
  const [loginPrefill, setLoginPrefill] = useState('');
  const profileIdRef = useRef<string | undefined>(undefined);

  // ✅ Khởi tạo các hooks con (bao gồm useWeatherSync đã fix)
  const weatherHook = useWeatherSync();
  const calendarHook = useCalendarSync();
  const healthHook = useDeviceHealth(profile?.id);

  useEffect(() => {
    profileIdRef.current = profile?.id;
  }, [profile?.id]);

  const loadProfileForCurrentUser = async () => {
    try {
      const { data: sessionRes, error: sessionErr } = await supabase!.auth.getSession();
      if (sessionErr || !sessionRes.session?.user.id) return null;
      const userId = sessionRes.session.user.id;

      return queryClient.fetchQuery({
        queryKey: appQueryKeys.profile(userId),
        queryFn: () => fetchProfileById(userId),
      });
    } catch { return null; }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const sub = CapacitorApp.addListener('appUrlOpen', async (event) => {
        if (
          event.url.includes('login-callback') ||
          event.url.includes('access_token') ||
          event.url.includes('code=')
        ) {
          Browser.close().catch(() => { });
          const urlStr = event.url;
          if (urlStr.includes('#') || urlStr.includes('?')) {
            const fragment = urlStr.substring(urlStr.indexOf(urlStr.includes('?') ? '?' : '#'));
            window.location.href = `${window.location.origin}${window.location.pathname}${fragment}`;

            setTimeout(async () => {
              const { data } = await supabase!.auth.getSession();
              if (data?.session) {
                setView('app');
              }
            }, 500);
          }
        }
      });
      return () => { sub.then(s => s.remove()); };
    }
  }, []);

  useEffect(() => {
    purgeLegacySensitiveStorage();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const { data: sub } = supabase!.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted) return;
      try {
        if (session) {
          if (session.provider_token) {
            window.dispatchEvent(new CustomEvent(CALENDAR_TOKEN_UPDATED_EVENT));
          }
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
              let p = await loadProfileForCurrentUser();
              if (!p && session.user) {
                const defaultName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
                p = await ensureProfileExists(session.user.id, defaultName);
              }
              if (p && isMounted) {
                setProfile(p);
                const isBiometricEnabled = await getBiometricEnabled(p.id);
                setView(isBiometricEnabled ? 'locked' : 'app');
              }
            }, 500);
          }
        } else if (event === 'SIGNED_OUT' || !session) {
          await clearUserSessionArtifacts(profileIdRef.current);
          queryClient.clear();
          setProfile(null);
          window.sessionStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
          localStorage.removeItem(CALENDAR_OAUTH_PENDING_KEY);
          window.dispatchEvent(new CustomEvent(CALENDAR_TOKEN_UPDATED_EVENT));
          setView('welcome');
        }
      } catch (error) { console.error(error); }
    });
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); sub?.subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Đăng xuất', message: 'Xác nhận đăng xuất an toàn?', confirmLabel: 'Đăng xuất', variant: 'danger' });
    if (ok) { await supabase!.auth.signOut(); }
  };

  // ✅ Trả về đầy đủ các giá trị, bao gồm spread từ các hook con
  return {
    view,
    setView,
    profile,
    setProfile,
    loginPrefill,
    setLoginPrefill,
    handleLogout,
    // Weather
    ...weatherHook,
    // Calendar
    ...calendarHook,
    // Health
    ...healthHook
  };
}