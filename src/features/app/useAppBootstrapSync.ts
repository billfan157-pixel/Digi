import { useEffect, useRef, useState } from 'react';
import { levelFromExp } from '@/config/questConfig';
import { readAppPreferences, writeAppPreferences } from '@/services/appPreferences.service';
import { clearCachedProfile } from '@/lib/sessionSecurity';
import { updateProfileFields } from '@/services/profile.service';

interface UseAppBootstrapSyncOptions {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  refetchProfile: () => Promise<void>;
  refetchWater: () => Promise<void>;
  setIsWeatherSynced: (value: boolean) => void;
  setIsCalendarSynced: (value: boolean) => void;
  loadReminderSettings: (profileId: string | undefined) => void;
  loadDrinkPresets: () => void;
  setShowOnboarding: (value: boolean) => void;
  setShowProfileSettings: (value: boolean) => void;
  isWatchConnected: boolean;
  isWeatherSynced: boolean;
  isCalendarSynced: boolean;
}

export function useAppBootstrapSync({
  profile,
  setProfile,
  refetchProfile,
  refetchWater,
  setIsWeatherSynced,
  setIsCalendarSynced,
  loadReminderSettings,
  loadDrinkPresets,
  setShowOnboarding,
  setShowProfileSettings,
  isWatchConnected,
  isWeatherSynced,
  isCalendarSynced,
}: UseAppBootstrapSyncOptions) {
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const lastDayRef = useRef(new Date().toDateString());



  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined') return;

    console.log('[App] Force refetching profile to sync EXP display');
    void refetchProfile();
  }, [profile?.id, refetchProfile]);

  useEffect(() => {
    const handleSmartBottleHydration = (event: Event) => {
      const customEvent = event as CustomEvent<{
        amount_ml?: number;
        new_total_exp?: number;
        new_coins?: number;
        refresh_profile?: boolean;
        refresh_water?: boolean;
      }>;

      const { amount_ml = 0, new_total_exp, new_coins, refresh_profile, refresh_water } = customEvent.detail || {};

      if (new_total_exp !== undefined || new_coins !== undefined || amount_ml > 0) {
        setProfile((prev: any) => {
          if (!prev) return prev;

          const updatedExp = new_total_exp ?? prev.total_exp;
          const updatedLevel = levelFromExp(updatedExp);

          return {
            ...prev,
            total_exp: updatedExp,
            level: updatedLevel,
            coins: new_coins !== undefined ? (prev.coins || 0) + new_coins : prev.coins,
            water_today: amount_ml > 0 ? (prev.water_today || 0) + amount_ml : prev.water_today,
            total_water: amount_ml > 0 ? (prev.total_water || 0) + amount_ml : prev.total_water,
          };
        });
      }

      if (refresh_profile !== false) {
        void refetchProfile();
      }

      if (refresh_water !== false) {
        void refetchWater();
      }
    };

    window.addEventListener('hydrationEvent', handleSmartBottleHydration);

    return () => {
      window.removeEventListener('hydrationEvent', handleSmartBottleHydration);
    };
  }, [refetchProfile, refetchWater, setProfile]);

  useEffect(() => {
    if (profile?.id && profile.id !== 'undefined') {
      const prefs = readAppPreferences(profile.id);
      setIsWeatherSynced(!!prefs.weather);
      setIsCalendarSynced(!!prefs.calendar);
      loadReminderSettings(profile.id);
      loadDrinkPresets();
      setIsPrefsLoaded(true);
      return;
    }

    setIsPrefsLoaded(false);
    setShowOnboarding(false);
    setShowProfileSettings(false);
  }, [
    profile?.id,
    loadDrinkPresets,
    loadReminderSettings,
    setIsCalendarSynced,
    setIsWeatherSynced,
    setShowOnboarding,
    setShowProfileSettings,
  ]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined') return;
    if (profile.onboarding_completed) return;

    if (profile.weight && profile.water_goal) {
      updateProfileFields(profile.id, { onboarding_completed: true })
        .then((updatedProfile) => setProfile(updatedProfile))
        .catch(() => {});
      return;
    }

    setShowOnboarding(true);
  }, [
    profile?.id,
    profile?.onboarding_completed,
    profile?.weight,
    profile?.water_goal,
    setProfile,
    setShowOnboarding,
  ]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || !isPrefsLoaded) return;

    writeAppPreferences(profile.id, {
      watch: isWatchConnected,
      weather: isWeatherSynced,
      calendar: isCalendarSynced,
    });
  }, [profile?.id, isPrefsLoaded, isWatchConnected, isWeatherSynced, isCalendarSynced]);

  useEffect(() => {
    let midnightTimer: number | undefined;

    const getDayKey = (date: Date) => date.toDateString();

    const refreshForNewDay = async () => {
      lastDayRef.current = getDayKey(new Date());
      setProfile((prev: any) => prev ? {
        ...prev,
        water_today: 0,
      } : prev);
      await Promise.allSettled([refetchProfile(), refetchWater()]);
    };

    const checkDayBoundary = () => {
      const nextDayKey = getDayKey(new Date());
      if (nextDayKey === lastDayRef.current) return;
      void refreshForNewDay();
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0);

      midnightTimer = window.setTimeout(async () => {
        await refreshForNewDay();
        scheduleNextMidnight();
      }, Math.max(nextMidnight.getTime() - now.getTime(), 1000));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkDayBoundary();
    };

    checkDayBoundary();
    scheduleNextMidnight();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (midnightTimer) window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refetchProfile, refetchWater, setProfile]);

  return {
    isPrefsLoaded,
  };
}
