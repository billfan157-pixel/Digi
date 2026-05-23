import { useCallback, useEffect, useRef } from 'react';

import type { AppShellProps } from '@/app/AppShell';
import { useAppTabProps } from '@/app/useAppTabProps';
import type { TabType } from '@/components/layout/BottomNav';
import { useAiSocialOrchestration } from '@/features/app/useAiSocialOrchestration';
import { useAppUiState } from '@/features/app/useAppUiState';
import { useHydrationController } from '@/features/app/useHydrationController';
import { useLeagueController } from '@/features/app/useLeagueController';
import { updateProfileFields } from '@/services/profile.service';
import { useAppSystem } from '@/hooks/useAppSystem';
import { useNetworkState } from '@/hooks/useNetworkState';
import { countQueue } from '@/lib/offlineQueue';
import { useReminderStore } from '@/store/useReminderStore';
import { useDrinkPresetStore } from '@/store/useDrinkPresetStore';
import { useAppStore } from '@/store/useAppStore';
import type { AppProfile } from '@/services/profile.service';
import { getRankInfo } from '@/utils/healthMath';

export function useAppShellController(): AppShellProps {
  const {
    view = 'welcome',
    setView = () => { },
    profile = null,
    setProfile = () => { },
    loginPrefill = '',
    setLoginPrefill = () => { },
    handleLogout = async () => { },
    isWeatherSynced = false,
    setIsWeatherSynced = () => { },
    weatherData,
    syncWeather = async () => false,
    isCalendarSynced = false,
    setIsCalendarSynced = () => { },
    calendarEvents = [],
    syncCalendar = async () => false,
    isWatchConnected = false,
    watchData,
  } = useAppSystem() || {};

  const {
    activeTab,
    setActiveTab,
    setShowOnboarding,
    setShowPremiumModal,
    setShowProfileSettings,
    setShowAddFriend,
    setShowShopModal,
  } = useAppUiState();

  const { loadReminderSettings } = useReminderStore();
  const { loadDrinkPresets } = useDrinkPresetStore();
  const setAppState = useAppStore((state) => state.setAppState);
  const setAppActions = useAppStore((state) => state.setActions);
  const weatherSyncAttemptedRef = useRef(false);
  const prevProfileIdRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (prevProfileIdRef.current !== profile?.id) {
      weatherSyncAttemptedRef.current = false;
      prevProfileIdRef.current = profile?.id;
    }
  }, [profile?.id]);

  const hydration = useHydrationController({
    profile,
    setProfile,
    view,
    weatherData,
    isWeatherSynced,
    setIsWeatherSynced,
    isCalendarSynced,
    setIsCalendarSynced,
    isWatchConnected,
    watchData,
    setShowOnboarding,
    setShowProfileSettings,
    setShowPremiumModal,
    loadReminderSettings,
    loadDrinkPresets,
  });

  const { isOnline } = useNetworkState();

  const offlineSyncProps = profile?.id && typeof profile.id === 'string'
    ? {
        pendingCount: countQueue(profile.id),
        isOnline,
        isSyncing: hydration.isSyncing,
        onSyncNow: hydration.syncOfflineLogs,
      }
    : undefined;

  const league = useLeagueController({
    profile,
    activeTab: activeTab as TabType,
    streak: hydration.streak,
    setShowAddFriend,
  });

  const {
    socialProps,
    geminiProps,
    posts,
    openSocialComposer,
  } = useAiSocialOrchestration();

  const stableOpenSocialComposer = useCallback(
    (kind: 'status' | 'progress' | 'story' | 'challenge') => openSocialComposer(kind),
    [openSocialComposer]
  );



  // ── Sync hydration data to Zustand store ──
  useEffect(() => {
    setAppState({
      profile,
      waterIntake: hydration.waterIntake,
      waterGoal: hydration.waterGoal,
      streak: hydration.streak,
      waterEntries: hydration.waterEntries,
      weeklyHistory: hydration.weeklyHistory,
      watchData,
      isWatchConnected,
      isSyncing: hydration.isSyncing,
      hasPendingCloudSync: hydration.hasPendingCloudSync,
      hydrationResult: hydration.hydrationResult,
      isPremium: hydration.isPremium,
      weatherData,
      isWeatherSynced,
      isCalendarSynced,
      calendarEvents,
      fastingState: {
        isFastingMode: hydration.isFastingMode,
        fastingPlanHours: hydration.fastingPlanHours,
        fastingTotalMs: hydration.fastingTotalMs,
        fastingStartTime: hydration.fastingStartTime,
      }
    });
  }, [
    hydration.hydrationResult,
    hydration.isPremium,
    hydration.streak,
    hydration.waterEntries,
    hydration.waterGoal,
    hydration.waterIntake,
    hydration.weeklyHistory,
    hydration.isSyncing,
    hydration.hasPendingCloudSync,
    hydration.isFastingMode,
    hydration.fastingPlanHours,
    hydration.fastingTotalMs,
    hydration.fastingStartTime,
    isWatchConnected,
    profile,
    setAppState,
    watchData,
    weatherData,
    isWeatherSynced,
    isCalendarSynced,
    calendarEvents,
  ]);

  useEffect(() => {
    if (!profile?.id || weatherSyncAttemptedRef.current) return;
    if (!weatherData) {
      weatherSyncAttemptedRef.current = true;
      const timer = setTimeout(() => {
        syncWeather().then((ok) => {
          if (!ok) weatherSyncAttemptedRef.current = false;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile?.id, weatherData, syncWeather]);

  // Keep refs to latest function references to avoid stale closures in Zustand
  const handleAddWaterRef = useRef(hydration.handleAddWater);
  const handleDeleteEntryRef = useRef(hydration.handleDeleteEntry);
  const handleEditEntryRef = useRef(hydration.handleEditEntry);
  const handleLogoutRef = useRef(handleLogout);
  const startFastingRef = useRef(hydration.startFasting);
  const stopFastingRef = useRef(hydration.stopFasting);

  useEffect(() => { handleAddWaterRef.current = hydration.handleAddWater; }, [hydration.handleAddWater]);
  useEffect(() => { handleDeleteEntryRef.current = hydration.handleDeleteEntry; }, [hydration.handleDeleteEntry]);
  useEffect(() => { handleEditEntryRef.current = hydration.handleEditEntry; }, [hydration.handleEditEntry]);
  useEffect(() => { handleLogoutRef.current = handleLogout; }, [handleLogout]);
  useEffect(() => { startFastingRef.current = hydration.startFasting; }, [hydration.startFasting]);
  useEffect(() => { stopFastingRef.current = hydration.stopFasting; }, [hydration.stopFasting]);

  // Set stable store actions once — they always call the latest function via refs
  useEffect(() => {
    setAppActions({
      handleAddWater: (...args) => handleAddWaterRef.current(...args),
      handleDeleteEntry: (...args) => handleDeleteEntryRef.current(...args),
      handleEditEntry: (...args) => handleEditEntryRef.current(...args),
      handleLogout: (...args) => handleLogoutRef.current(...args),
      openSocialComposer: stableOpenSocialComposer,
      startFasting: (...args) => startFastingRef.current(...args),
      stopFasting: (...args) => stopFastingRef.current(...args),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // ── Auto-navigate to home if bottle disconnects while on bottle tab ──
  useEffect(() => {
    const { isConnected, isSyncing } = hydration.smartBottle || {};
    if (activeTab === 'insight' && !isConnected && !isSyncing) {
      // Bottle demo redirect — show insight/coach instead
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hydration.smartBottle?.isConnected, hydration.smartBottle?.isSyncing, setActiveTab]);

  // ── Sync tab props ──
  const tabProps = useAppTabProps({
    profile,
    smartBottle: hydration.smartBottle,
    isExportingPDF: hydration.isExportingPDF,
    handleExportPDF: hydration.handleExportPDF,
    handleExportJSON: hydration.handleExportJSON,
    handleExportCSV: hydration.handleExportCSV,
    geminiProps,
    weatherData,
    isWeatherSynced,
    watchData,
    isWatchConnected,
    leagueMode: league.leagueMode,
    setLeagueMode: league.setLeagueMode,
    setShowAddFriend,
    setShowShopModal,
    getLeagueData: league.getLeagueData,
    getRankInfo: (wp: number) => getRankInfo(wp),
    socialProps,
    openSocialComposer: () => openSocialComposer(),
    streakFreezes: hydration.streakFreezes,
    needsFreeze: hydration.needsFreeze,
    useStreakFreeze: hydration.useStreakFreeze,
    posts,
    setActiveTab,
    calendarEvents,
    syncCalendar,
  });

  return {
    view,
    setView,
    loginPrefill,
    handleRegisterSuccess: (email: string) => {
      setLoginPrefill(email);
      setView('login');
    },
    profile,
    handleLogout,
    quickDropCameraProps: {
      isOpen: !!socialProps.showQuickDropCamera,
      isPublishing: !!socialProps.isPublishingQuickDrop,
      onCapture: socialProps.handleQuickDropCapture || (async () => {}),
      onClose: socialProps.closeQuickDropCamera || (() => {}),
    },
    onboardingProps: profile && !profile.onboarding_completed ? {
      profile,
      onComplete: async (weight: number, onboardingWaterGoal: number, name: string) => {
        setProfile((prev: AppProfile | null) => {
          if (!prev) return prev;
          return {
            ...prev,
            weight,
            water_goal: onboardingWaterGoal,
            nickname: name,
            onboarding_completed: true,
          };
        });
        await updateProfileFields(profile.id as string, {
          nickname: name.trim(),
          onboarding_completed: true,
          water_goal: onboardingWaterGoal,
          weight,
        });
      },
    } : null,
    activeTab: activeTab as TabType,
    setActiveTab,
    homeTabProps: tabProps.homeTabProps,
    insightTabProps: tabProps.insightTabProps,
    bottleTabProps: tabProps.bottleTabProps as unknown as AppShellProps['bottleTabProps'],
    leagueTabProps: tabProps.leagueTabProps,
    feedTabProps: tabProps.feedTabProps,
    profileTabProps: tabProps.profileTabProps,
    devSyncProps: {
      visible: import.meta.env.DEV && !!profile?.id && profile.id !== 'undefined',
      onClick: hydration.syncProfileData,
    },
    offlineSyncProps,
  };
}
