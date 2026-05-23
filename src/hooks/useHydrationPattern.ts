/**
 * Sprint 13-14: AI Personalization Engine
 * Hook phân tích pattern uống nước
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { analyzePattern, cachePattern, getCachedPattern, type UserHydrationPattern, type WeatherSnapshot } from '../lib/patternEngine';
import { supabase } from '../lib/supabase';
import type { WaterLog } from '../models';

interface UseHydrationPatternProps {
  waterLogs: WaterLog[]; // 7-14 ngày gần nhất
  waterGoal: number;
  userId: string | null;
  weatherHistory: WeatherSnapshot[];
}

interface UseHydrationPatternResult {
  pattern: UserHydrationPattern | null;
  isLoading: boolean;
  hasEnoughData: boolean;
  refreshPattern: () => void;
}

/**
 * Hook phân tích pattern uống nước
 * Tính toán local + sync lên Supabase 1 lần/ngày
 */
export function useHydrationPattern({
  waterLogs,
  waterGoal,
  userId,
  weatherHistory,
}: UseHydrationPatternProps): UseHydrationPatternResult {
  const hasSyncedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  // Phân tích pattern từ water_logs + weather, fallback về cached pattern
  const pattern = useMemo(() => {
    if (!userId) return null;

    if (waterLogs.length >= 3) {
      const result = analyzePattern({
        waterLogs,
        waterGoal,
        weatherHistory,
      });
      if (result) return result;
    }

    // Chưa đủ data → fallback về cached pattern
    return getCachedPattern(userId);
  }, [waterLogs, waterGoal, weatherHistory, userId]);

  const hasEnoughData = waterLogs.length >= 3;

  // Cache local
  useEffect(() => {
    if (pattern && userId) {
      cachePattern(userId, pattern);
    }
  }, [pattern, userId]);

  // Sync lên Supabase 1 lần/ngày (fire-and-forget to avoid blocking)
  const syncPatternToDB = useCallback(() => {
    if (!userId || !pattern || hasSyncedRef.current) return;

    const today = new Date().toISOString().slice(0, 10);

    // Fire-and-forget sync to avoid blocking UI
    void (async () => {
      try {
        // Check đã sync hôm nay chưa
        const { data: existing } = await supabase
          .from('user_hydration_patterns')
          .select('id')
          .eq('user_id', userId)
          .eq('snapshot_date', today)
          .maybeSingle();

        if (existing) {
          hasSyncedRef.current = true;
          return; // đã sync hôm nay
        }

        await supabase
          .from('user_hydration_patterns')
          .insert({
            user_id: userId,
            snapshot_date: today,
            blind_spots: pattern.blindSpots,
            peak_hours: pattern.peakHours,
            weather_factor: pattern.weatherFactor,
            consistency_score: pattern.consistencyScore,
            trend: pattern.trend,
            weekly_avg_completion: pattern.weeklyAvgCompletion,
            best_day_of_week: pattern.bestDayOfWeek,
            worst_day_of_week: pattern.worstDayOfWeek,
            raw_data: waterLogs.slice(-14).map((l) => ({
              day: (l.day || l.created_at).slice(0, 10),
              amount: l.amount,
            })),
          });

        hasSyncedRef.current = true;
      } catch (err) {
        console.warn('[useHydrationPattern] Sync failed:', err);
      }
    })();
  }, [pattern, userId, waterLogs]);

  // Sync pattern to DB when pattern changes
  useEffect(() => {
    if (pattern && userId) {
      syncPatternToDB();
      setIsLoading(false);
    }
  }, [pattern, userId, syncPatternToDB, manualRefreshKey]);

  const refreshPattern = useCallback(() => {
    hasSyncedRef.current = false;
    setManualRefreshKey((k) => k + 1);
  }, []);

  return { pattern, isLoading, hasEnoughData, refreshPattern };
}