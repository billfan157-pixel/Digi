import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { AppShellProps } from '@/app/AppShell';
import { useAppTabProps } from '@/app/useAppTabProps';
import type { TabType } from '@/components/layout/BottomNav';
import { useAiSocialOrchestration } from '@/features/app/useAiSocialOrchestration';
import { useAppUiState } from '@/features/app/useAppUiState';
import { useHydrationController } from '@/features/app/useHydrationController';
import { useLeagueController } from '@/features/app/useLeagueController';
import { updateProfileFields } from '@/services/profile.service';
import { useAppSystem } from '@/hooks/useAppSystem';
import { useReminderStore } from '@/store/useReminderStore';
import { useDrinkPresetStore } from '@/store/useDrinkPresetStore';
import { useAppStore } from '@/store/useAppStore';
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
    isCalendarSynced = false,
    setIsCalendarSynced = () => { },
    isWatchConnected = false,
    watchData,
  } = useAppSystem() || {};

  const {
    activeTab,
    setActiveTab,
    setShowOnboarding,
    setShowAiChat,
    setShowPremiumModal,
    setShowProfileSettings,
    setShowAddFriend,
    setShowShopModal,
  } = useAppUiState();

  const { loadReminderSettings } = useReminderStore();
  const { loadDrinkPresets } = useDrinkPresetStore();
  const setAppState = useAppStore((state: any) => state.setAppState);
  const setAppActions = useAppStore((state: any) => state.setActions);

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
    fileInputRef,
    handleScan,
    processImageScan,
    openSocialComposer,
  } = useAiSocialOrchestration();

  // ── Sync hydration data to Zustand store ──
  useEffect(() => {
    setAppState({
      profile,
      waterIntake: hydration.waterIntake,
      waterGoal: hydration.waterGoal,
      streak: hydration.streak,
      waterEntries: hydration.waterEntries as any,
      weeklyHistory: hydration.weeklyHistory,
      weatherData: weatherData as any,
      watchData,
      isWeatherSynced,
      isWatchConnected,
      isSyncing: hydration.isSyncing,
      hasPendingCloudSync: hydration.hasPendingCloudSync,
      hydrationResult: hydration.hydrationResult,
      isPremium: hydration.isPremium,
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
    isWatchConnected,
    isWeatherSynced,
    profile,
    setAppState,
    watchData,
    weatherData,
  ]);

  // ── Sync actions to Zustand store ──
  useEffect(() => {
    setAppActions({
      handleAddWater: hydration.handleAddWater,
      handleDeleteEntry: hydration.handleDeleteEntry,
      handleEditEntry: hydration.handleEditEntry,
      handleScan,
      handleLogout,
      openSocialComposer: openSocialComposer as any,
      startFasting: hydration.startFasting,
      stopFasting: hydration.stopFasting,
    });
  }, [
    handleLogout,
    handleScan,
    hydration.handleAddWater,
    hydration.handleDeleteEntry,
    hydration.handleEditEntry,
    hydration.startFasting,
    hydration.stopFasting,
    openSocialComposer,
    setAppActions,
  ]);

  // ── Auto-navigate to home if bottle disconnects while on bottle tab ──
  useEffect(() => {
    const { isConnected, isSyncing } = hydration.smartBottle || {};
    if (activeTab === 'insight' && !isConnected && !isSyncing) {
      // Bottle demo redirect — show insight/coach instead
    }
  }, [activeTab, hydration.smartBottle?.isConnected, hydration.smartBottle?.isSyncing, setActiveTab]);

  // ── Sync tab props ──
  const tabProps = useAppTabProps({
    profile,
    smartBottle: hydration.smartBottle,
    isExportingPDF: hydration.isExportingPDF,
    handleExportPDF: hydration.handleExportPDF,
    handleExportCSV: hydration.handleExportCSV,
    geminiProps,
    weeklyReport: hydration.weeklyReport,
    isWeeklyReportLoading: hydration.isWeeklyReportLoading,
    handleGenerateWeeklyReport: hydration.handleGenerateWeeklyReport,
    weatherData,
    isWeatherSynced,
    watchData,
    isWatchConnected,
    leagueMode: league.leagueMode,
    setLeagueMode: league.setLeagueMode,
    setShowAddFriend,
    setShowShopModal,
    getLeagueData: league.getLeagueData,
    getRankInfo,
    socialProps,
    openSocialComposer,
    streakFreezes: hydration.streakFreezes,
    needsFreeze: hydration.needsFreeze,
    useStreakFreeze: hydration.useStreakFreeze,
    posts,
    setActiveTab,
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
    fileInputProps: {
      type: 'file',
      accept: 'image/*',
      capture: 'environment',
      ref: fileInputRef,
      className: 'hidden',
      onChange: processImageScan,
    },
    onboardingProps: profile && !profile.onboarding_completed ? {
      profile,
      onComplete: async (weight: number, onboardingWaterGoal: number, name: string) => {
        setProfile((prev: any) => ({
          ...prev,
          weight,
          water_goal: onboardingWaterGoal,
          nickname: name,
          onboarding_completed: true,
        }));
        await updateProfileFields(profile.id, {
          nickname: name.trim(),
          onboarding_completed: true,
          water_goal: onboardingWaterGoal,
          weight,
        });
      },
    } : null,
    activeTab: activeTab as TabType,
    setActiveTab: setActiveTab as any,
    homeTabProps: tabProps.homeTabProps,
    insightTabProps: tabProps.insightTabProps,
    bottleTabProps: null,
    leagueTabProps: tabProps.leagueTabProps,
    feedTabProps: tabProps.feedTabProps,
    profileTabProps: tabProps.profileTabProps,
    devSyncProps: {
      visible: import.meta.env.DEV && !!profile?.id && profile.id !== 'undefined',
      onClick: hydration.syncProfileData,
    },
  };
}
