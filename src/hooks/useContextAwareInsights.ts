import { useMemo } from 'react';
import type { CalendarEventItem } from './useCalendarSync';
import { useDayPatternInsight } from './useDayPatternInsight';
import { useCalendarInsights } from './useCalendarInsights';
import { useWeatherInsights } from './useWeatherInsights';
import { useSleepInsights } from './useSleepInsights';
import { useConsistencyTrend } from './useConsistencyTrend';

export interface ContextInsight {
  id: string;
  category: 'calendar' | 'weather' | 'day_pattern' | 'sleep';
  icon: 'calendar' | 'thermometer' | 'clock' | 'moon';
  title: string;
  insight: string;
  impact: { label: string; delta: string };
  confidence: number; // 0-1
}

interface UseContextAwareInsightsOptions {
  weeklyData: { d: string; ml: number; isToday?: boolean }[];
  waterGoal: number;
  waterIntake: number;
  calendarEvents: CalendarEventItem[];
  isCalendarSynced: boolean;
  weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null;
  isWeatherSynced: boolean;
  sleepHours: number;
  sleepQuality: number;
}

export function useContextAwareInsights({
  weeklyData,
  waterGoal,
  waterIntake,
  calendarEvents,
  isCalendarSynced,
  weatherData,
  isWeatherSynced,
  sleepHours,
  sleepQuality,
}: UseContextAwareInsightsOptions) {
  const dayPatternInsights = useDayPatternInsight({ weeklyData, waterGoal });
  
  const { insights: calendarInsights, riskScore: calendarRiskScore } = useCalendarInsights({
    calendarEvents,
    isCalendarSynced,
  });

  const { insights: weatherInsights, weatherAdjustment } = useWeatherInsights({
    weatherData,
    isWeatherSynced,
    waterGoal,
    waterIntake,
  });

  const sleepInsights = useSleepInsights({ sleepHours, sleepQuality });

  const consistencyTrendInsights = useConsistencyTrend({ weeklyData });

  const insights = useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [
      ...dayPatternInsights,
      ...calendarInsights,
      ...weatherInsights,
      ...sleepInsights,
      ...consistencyTrendInsights,
    ];

    // Sort by confidence descending
    return result.sort((a, b) => b.confidence - a.confidence);
  }, [
    dayPatternInsights,
    calendarInsights,
    weatherInsights,
    sleepInsights,
    consistencyTrendInsights,
  ]);

  return { insights, calendarRiskScore, weatherAdjustment };
}
