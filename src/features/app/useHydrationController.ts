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

interface UseHydrationControllerOptions {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  view: string;
  weatherData: { temp?: number } | null | undefined;
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
    toggleFastingMode,
    startFasting,
    stopFasting,
  } = useFastingAndReports({
    userId: profile?.id,
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
      exerciseMinutes: isWatchConnected ? Math.round((watchData?.steps || 0) / 120) : 0,
      isFasting: isFastingMode,
      wakeUpTime: profile.wakeUp || '07:00',
      bedTime: profile.bedTime || '23:00',
      avgHeartRate: isWatchConnected ? watchData?.heartRate : 0,
    });
  }, [profile, weatherData, isWeatherSynced, watchData, isWatchConnected, isFastingMode]);

  const waterGoal = hydrationResult?.goalMl || 2000;
  const smartBottle = useSmartBottle(profile?.id, 'DW-PRO-1', 750);

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
      .filter((entry: any) => new Date(entry.created_at || entry.timestamp).getTime() > oneHourAgo)
      .reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);

    if (waterInLastHour + amount > 1000) {
      toast.error(`Cảnh báo: Bạn đã uống ${waterInLastHour}ml trong 1 giờ qua. Tránh nạp quá 1000ml/giờ để không gây ngộ độc nước (hạ natri máu)!`, { duration: 6000 });
      return;
    }

    return originalHandleAddWater(amount, factor, name);
  }, [waterEntries, originalHandleAddWater]);

  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const { weeklyHistory, weeklyLogCount } = useWeeklyHistory({
    profile,
    waterIntake,
    waterEntriesCount: waterEntries.length,
  });

  const { streak, streakFreezes, needsFreeze, useStreakFreeze } = useStreak(
    profile?.id,
    waterGoal,
    waterIntake,
    isPremium,
  );

  const {
    showLevelUp,
    setShowLevelUp,
    levelUpInfo,
    weeklyReport,
    isWeeklyReportLoading,
    handleGenerateWeeklyReport,
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

  const handleExportPDF = useCallback(async () => {
    await exportReportPdf({
      profile,
      waterIntake,
      waterGoal,
      streak,
      progress,
      isWatchConnected,
      watchData,
      weeklyChartData: weeklyHistory,
      waterEntries,
      avgWeekly: weeklyHistory.length > 0 
        ? Math.round(weeklyHistory.reduce((s: number, d: any) => s + d.ml, 0) / weeklyHistory.length) 
        : 0,
      completionRate: weeklyHistory.length > 0 
        ? Math.round((weeklyHistory.filter((d: any) => d.ml >= waterGoal).length / weeklyHistory.length) * 100) 
        : 0,
    });
  }, [exportReportPdf, isWatchConnected, profile, progress, streak, watchData, waterGoal, waterIntake, weeklyHistory, waterEntries]);

  const handleExportCSV = useCallback(() => {
    exportReportCsv({
      profile,
      waterIntake,
      waterGoal,
      streak,
      weeklyChartData: weeklyHistory,
      waterEntries,
    });
  }, [exportReportCsv, profile, waterIntake, waterGoal, streak, weeklyHistory, waterEntries]);

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
    weeklyHistory,
    weeklyLogCount,
    streak,
    streakFreezes,
    needsFreeze,
    useStreakFreeze,
    showLevelUp,
    setShowLevelUp,
    levelUpInfo,
    weeklyReport,
    isWeeklyReportLoading,
    handleGenerateWeeklyReport,
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
  };
}
