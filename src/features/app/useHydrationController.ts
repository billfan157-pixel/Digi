import i18n from '@/i18n';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppBootstrapSync } from '@/features/app/useAppBootstrapSync';
import { useFastingAndReports } from '@/features/fasting/useFastingAndReports';
import { useHydrationNotifications } from '@/features/hydration/useHydrationNotifications';
import { useWeeklyHistory } from '@/features/hydration/useWeeklyHistory';
import { usePremiumGamification } from '@/features/premium/usePremiumGamification';
import { useProfileSync } from '@/features/profile/useProfileSync';
import { useSmartBottle } from '@/hooks/useSmartBottle';
import { useStreak } from '@/hooks/useStreak';
import { useWaterData } from '@/hooks/useWaterData';
import { calculateWaterIntake, type ActivityLevel, type Climate, type Gender } from '@/lib/HydrationEngine';
import { normalizeActivity, normalizeClimate } from '@/lib/profileNormalization';
import { isSupabaseConfigured } from '@/lib/supabase';
import { updateWidgetCache } from '@/lib/widgetService';
import { logWaterToHealth } from '@/lib/healthIntegration';
import type { AppProfile } from '@/services/profile.service';

interface UseHydrationControllerOptions {
  profile: AppProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<AppProfile | null>>;
  view: string;
  weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string; location?: string } | null | undefined;
  isWeatherSynced: boolean;
  setIsWeatherSynced: (value: boolean) => void;
  isCalendarSynced: boolean;
  setIsCalendarSynced: (value: boolean) => void;
  isWatchConnected: boolean;
  watchData: { steps?: number; heartRate?: number } | null | undefined;
  setShowOnboarding: (value: boolean) => void;
  setShowProfileSettings: (value: boolean) => void;
  setShowPremiumModal: (value: boolean) => void;
  loadReminderSettings: (profileId: string | undefined) => void;
  loadDrinkPresets: () => void;
}

export function useHydrationController({
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
}: UseHydrationControllerOptions) {
  const [isPremium, setIsPremium] = useState(false);

  const {
    isFastingMode,
    fastingPlanHours,
    showFastingModal,
    fastingStartTime,
    isExportingPDF,
    fastingTotalMs,
    setShowFastingModal,
    exportReportPdf,
    exportReportCsv,
    exportReportJson,
    toggleFastingMode,
    startFasting,
    stopFasting,
  } = useFastingAndReports({
    userId: profile?.id as string | undefined,
    isPremium,
    setShowPremiumModal,
  });

  const hydrationResult = useMemo(() => {
    if (!profile) return null;

    const genderMap: Record<string, Gender> = { Nam: 'male', Nữ: 'female' };
    const mappedGender = genderMap[profile.gender] || 'other';
    const mappedActivity = normalizeActivity(profile.activity) as ActivityLevel;
    const mappedClimate = normalizeClimate(profile.climate) as Climate;

    return calculateWaterIntake({
      weightKg: profile.weight || 60,
      heightCm: profile.height || 170,
      ageYears: profile.age || 20,
      gender: mappedGender,
      activityLevel: mappedActivity,
      climate: mappedClimate,
      healthCondition: 'none',
      dietFactors: [],
      currentTempC: isWeatherSynced ? weatherData?.temp : undefined,
      currentHumidity: isWeatherSynced ? weatherData?.humidity : undefined,
      exerciseMinutes: isWatchConnected ? Math.round((Number(watchData?.steps) || 0) / 120) : 0,
      isFasting: isFastingMode,
      wakeUpTime: profile.wakeUp || '07:00',
      bedTime: profile.bedTime || '23:00',
      avgHeartRate: isWatchConnected ? Number(watchData?.heartRate) : 0,
    });
  }, [profile, weatherData, isWeatherSynced, watchData, isWatchConnected, isFastingMode]);

  const waterGoal = hydrationResult?.goalMl || 2000;
  const smartBottle = useSmartBottle(profile?.id as string | undefined, 'DW-PRO-1', 750);

  const {
    refetchProfile,
    syncProfileData,
    handleWaterSync,
    handleSpendCoins,
  } = useProfileSync({
    profile,
    setProfile,
    isEnabled: isSupabaseConfigured,
  });

  const {
    waterIntake = 0,
    waterEntries = [],
    handleAddWater: originalHandleAddWater = async () => {},
    handleDeleteEntry = async () => {},
    handleEditEntry = async () => {},
    hasPendingCloudSync = false,
    isSyncing = false,
    refetchWater = async () => {},
    syncOfflineLogs = async () => {},
  } = useWaterData(profile, handleWaterSync, {
    tempC: isWeatherSynced ? weatherData?.temp : undefined,
    exerciseMins: isWatchConnected ? Math.round((watchData?.steps || 0) / 120) : 0,
    isFasting: isFastingMode,
  }) || {};

  useAppBootstrapSync({
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
  });

  const handleAddWater = useCallback(async (amount: number, factor: number, name: string) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const waterInLastHour = waterEntries
      .filter((entry: { created_at?: string; timestamp?: string; amount?: number }) => {
        const dateStr = entry.created_at || entry.timestamp;
        if (!dateStr) return false;
        return new Date(dateStr).getTime() > oneHourAgo;
      })
      .reduce((sum: number, entry: { amount?: number }) => sum + (entry.amount || 0), 0);

    if (waterInLastHour + amount > 800) {
      toast.error(i18n.t('water.hourly_limit_exceeded', { limit: 800, current: waterInLastHour }), { duration: 6000 });
      return;
    }

    const result = await originalHandleAddWater(amount, factor, name);
    if (profile?.id) {
      updateWidgetCache(profile.id).catch(() => {});
    }
    logWaterToHealth(amount).catch(() => {});
    return result;
  }, [waterEntries, originalHandleAddWater, profile?.id]);

  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const { weeklyHistory, weeklyLogCount } = useWeeklyHistory({
    profile,
    waterIntake,
    waterEntriesCount: waterEntries.length,
  });

  const { streak, streakFreezes, needsFreeze, useStreakFreeze } = useStreak(
    profile?.id as string | undefined,
    waterGoal,
    waterIntake,
    isPremium,
  );

  const {
    showLevelUp,
    setShowLevelUp,
    levelUpInfo,
  } = usePremiumGamification({
    profile,
    setProfile,
    isPremium,
    setIsPremium,
    waterIntake,
    waterGoal,
    streak,
    waterEntries,
    weeklyHistory,
    weeklyLogCount,
    watchData,
    setShowPremiumModal,
  });

  useHydrationNotifications({
    profile,
    view,
    waterGoal,
    handleAddWater,
    refetchProfile,
  });

  const handleExportPDF = useCallback(async (dateRange?: { start: string; end: string } | null) => {
    await exportReportPdf({
      profile,
      waterIntake,
      waterGoal,
      streak,
      progress,
      isWatchConnected,
      watchData: watchData ?? null,
      weeklyChartData: weeklyHistory,
      waterEntries,
      avgWeekly: weeklyHistory.length > 0 
        ? Math.round(weeklyHistory.reduce((s: number, d: { ml: number }) => s + d.ml, 0) / weeklyHistory.length) 
        : 0,
      completionRate: weeklyHistory.length > 0 
        ? Math.round((weeklyHistory.filter((d: { ml: number }) => d.ml >= waterGoal).length / weeklyHistory.length) * 100) 
        : 0,
      dateRange,
    });
  }, [exportReportPdf, isWatchConnected, profile, progress, streak, watchData, waterGoal, waterIntake, weeklyHistory, waterEntries]);

  const handleExportCSV = useCallback((dateRange?: { start: string; end: string } | null) => {
    exportReportCsv({
      profile,
      waterIntake,
      waterGoal,
      streak,
      weeklyChartData: weeklyHistory,
      waterEntries,
      dateRange,
    });
  }, [exportReportCsv, profile, waterIntake, waterGoal, streak, weeklyHistory, waterEntries]);

  const handleExportJSON = useCallback((dateRange?: { start: string; end: string } | null) => {
    exportReportJson({
      profile,
      waterIntake,
      waterGoal,
      streak,
      weeklyChartData: weeklyHistory,
      waterEntries,
      dateRange,
    });
  }, [exportReportJson, profile, waterIntake, waterGoal, streak, weeklyHistory, waterEntries]);

  return {
    isPremium,
    hydrationResult,
    waterGoal,
    smartBottle,
    refetchProfile,
    syncProfileData,
    handleSpendCoins,
    waterIntake,
    waterEntries,
    handleAddWater,
    handleDeleteEntry,
    handleEditEntry,
    hasPendingCloudSync,
    isSyncing,
    syncOfflineLogs,
    weeklyHistory,
    weeklyLogCount,
    streak,
    streakFreezes,
    needsFreeze,
    useStreakFreeze,
    showLevelUp,
    setShowLevelUp,
    levelUpInfo,
    isFastingMode,
    fastingPlanHours,
    showFastingModal,
    fastingStartTime,
    isExportingPDF,
    fastingTotalMs,
    setShowFastingModal,
    toggleFastingMode,
    startFasting,
    stopFasting,
    handleExportPDF,
    handleExportCSV,
    handleExportJSON,
  };
}
