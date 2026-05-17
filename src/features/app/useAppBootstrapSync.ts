import { useEffect, useRef, useState } from 'react';
import { levelFromExp } from '@/config/questConfig';
import { readAppPreferences, writeAppPreferences } from '@/services/appPreferences.service';
import { updateProfileFields } from '@/services/profile.service';
import { AppStorage } from '@/lib/storage';
import type { AppProfile } from '@/services/profile.service';

const WEATHER_SYNCED_KEY = 'digiwell_weather_synced_flag';

interface UseAppBootstrapSyncOptions {
  profile: AppProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<AppProfile | null>>;
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
        setProfile((prev) => {
          if (!prev) return prev;

          const updatedExp = new_total_exp ?? (Number(prev.total_exp) || 0);
          const updatedLevel = levelFromExp(updatedExp);

          return {
            ...prev,
            total_exp: updatedExp,
            level: updatedLevel,
            coins: new_coins !== undefined ? (Number(prev.coins) || 0) + new_coins : prev.coins,
            water_today: amount_ml > 0 ? (Number(prev.water_today) || 0) + amount_ml : prev.water_today,
            total_water: amount_ml > 0 ? (Number(prev.total_water) || 0) + amount_ml : prev.total_water,
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
      const prefs = readAppPreferences(profile.id as string);
      const weatherFlag = AppStorage.getItem(WEATHER_SYNCED_KEY);
      setIsWeatherSynced(weatherFlag === 'true');
      setIsCalendarSynced(!!prefs.calendar);
      loadReminderSettings(profile.id as string);
      loadDrinkPresets();
      setTimeout(() => setIsPrefsLoaded(true), 0);
      return;
    }

    setTimeout(() => {
      setIsPrefsLoaded(false);
      setShowOnboarding(false);
      setShowProfileSettings(false);
    }, 0);
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
      updateProfileFields(profile.id as string, { onboarding_completed: true })
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

    writeAppPreferences(profile.id as string, {
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
      setProfile((prev) => prev ? {
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
