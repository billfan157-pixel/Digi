import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { SleepData, ActivityData, WellnessCorrelation } from '@/utils/wellnessMath';
import {
  calculateHydrationScore,
  calculateSleepScore,
  calculateActivityScore,
  calculateCorrelation,
  calculateWellnessScore,
  generateWellnessInsights,
  getWellnessTier,
} from '@/utils/wellnessMath';

interface UseWellnessDataReturn {
  wellnessScore: number;
  tier: ReturnType<typeof getWellnessTier>;
  trend: 'up' | 'down' | 'stable';
  weeklyAverage: number;
  monthlyAverage: number;
  hydrationScore: number;
  sleepScore: number;
  activityScore: number;
  moodScore: number;
  sleepData: SleepData;
  activityData: ActivityData;
  insights: WellnessCorrelation[];
}

import type { AppProfile } from '@/services/profile.service';

interface UseWellnessDataProps {
  daysBack?: number;
  profile?: AppProfile | null;
}

export function useWellnessData({ profile: externalProfile }: UseWellnessDataProps = {}): UseWellnessDataReturn {
  const internalProfile = useAppStore((state) => state.profile);
  const profile = externalProfile || internalProfile;

  const waterIntake = useAppStore((state) => state.waterIntake);
  const waterGoal = useAppStore((state) => state.waterGoal);
  const weeklyHistory = useAppStore((state) => state.weeklyHistory);

  // 1. HYDRATION SCORE
  const hydrationScore = useMemo(() => {
    if (!profile) return 0;
    return calculateHydrationScore(waterIntake, waterGoal);
  }, [waterIntake, waterGoal, profile]);

  // 2. SLEEP DATA (read directly from profile to avoid useSettings re-render loop)
  const sleepData: SleepData = useMemo(() => {
    const hours = profile?.sleep_hours || 7;
    const quality = profile?.sleep_quality || 7;
    return { hours, quality };
  }, [profile]);

  const sleepScore = useMemo(() => {
    return calculateSleepScore(sleepData.hours, sleepData.quality);
  }, [sleepData]);

  // 3. ACTIVITY DATA
  const activityData: ActivityData = useMemo(() => {
    const steps = 0; // TODO: wire to health data (e.g. Apple Health / Google Fit)
    const activeMinutes = 0; // TODO: derive from health data
    const intensity = String(profile?.activity || 'sedentary') as ActivityData['intensity'];
    return { steps, activeMinutes, intensity };
  }, [profile]);

  const activityScore = useMemo(() => {
    return calculateActivityScore(activityData.steps, activityData.activeMinutes);
  }, [activityData]);

  // 4. MOOD DATA
  const moodScore = useMemo(() => {
    // TODO: Implement mood check-in — hardcoded 60 làm cho hasVariance(mood) = false
    // nên generateWellnessInsights không thể tính tương quan hydration↔mood.
    return 60; // Neutral baseline
  }, []);

  // COMPOSITE WELLNESS SCORE
  const wellnessScore = useMemo(() => {
    return calculateWellnessScore({
      hydration: hydrationScore,
      sleep: sleepScore,
      activity: activityScore,
      mood: moodScore,
    });
  }, [hydrationScore, sleepScore, activityScore, moodScore]);

  // WELLNESS TIER
  const tier = useMemo(() => {
    return getWellnessTier(wellnessScore);
  }, [wellnessScore]);

  // TREND ANALYSIS
  const trend = useMemo((): 'up' | 'down' | 'stable' => {
    if (weeklyHistory.length < 3) return 'stable';
    const recent = weeklyHistory.slice(-3).map(d => d.ml);
    const older = weeklyHistory.slice(-6, -3).map(d => d.ml);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = avgRecent - avgOlder;
    if (diff > 100) return 'up';
    if (diff < -100) return 'down';
    return 'stable';
  }, [weeklyHistory]);

  // WEEKLY / MONTHLY AVERAGES
  const weeklyAverage = useMemo(() => {
    if (weeklyHistory.length === 0) return 0;
    return Math.round(weeklyHistory.reduce((sum, day) => sum + day.ml, 0) / weeklyHistory.length);
  }, [weeklyHistory]);

  const monthlyAverage = useMemo(() => weeklyAverage, [weeklyAverage]);

  // CORRELATION INSIGHTS
  const insights = useMemo(() => {
    const recentHydration = weeklyHistory.slice(-7);
    const history = recentHydration.map((day) => ({
      date: day.d,
      hydration: day.ml,
      sleep: sleepData.hours,
      activity: activityData.steps,
      mood: moodScore,
    }));

    const generatedInsights = generateWellnessInsights(history);
    if (generatedInsights.length > 0 || recentHydration.length < 7) {
      return generatedInsights;
    }

    const hydrationValues = recentHydration.map((day) => day.ml);
    const sleepValues = recentHydration.map(() => sleepData.hours);
    const moodValues = recentHydration.map(() => moodScore);

    return [
      {
        type: 'hydration_sleep' as const,
        strength: calculateCorrelation(hydrationValues, sleepValues),
        insight: 'Chưa đủ lịch sử giấc ngủ theo ngày để xác định tương quan thật.',
        recommendation: 'Cập nhật ngủ mỗi ngày để DigiWell tính Pearson hydration ↔ giấc ngủ chính xác hơn.',
        examples: [],
      },
      {
        type: 'hydration_mood' as const,
        strength: calculateCorrelation(hydrationValues, moodValues),
        insight: 'Chưa đủ lịch sử tâm trạng theo ngày để xác định tương quan thật.',
        recommendation: 'Bật theo dõi tâm trạng và ghi nhận đều để DigiCoach cá nhân hoá tốt hơn.',
        examples: [],
      },
    ];
  }, [weeklyHistory, sleepData.hours, activityData.steps, moodScore]);

  return {
    wellnessScore,
    tier,
    trend,
    weeklyAverage,
    monthlyAverage,
    hydrationScore,
    sleepScore,
    activityScore,
    moodScore,
    sleepData,
    activityData,
    insights,
  };
}
