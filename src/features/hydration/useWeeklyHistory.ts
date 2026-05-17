import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { AppStorage } from '@/lib/storage';

export interface WeeklyHistoryPoint {
  d: string;
  ml: number;
  isToday: boolean;
}

interface UseWeeklyHistoryOptions {
  profile: Record<string, unknown> | null;
  waterIntake: number;
  waterEntriesCount: number;
}

export function useWeeklyHistory({
  profile,
  waterIntake,
  waterEntriesCount,
}: UseWeeklyHistoryOptions) {
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryPoint[]>([]);
  const [weeklyLogCount, setWeeklyLogCount] = useState(0);

  useEffect(() => {
    const fetchWeeklyHistory = async () => {
      const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const today = new Date();
      const dateList: { date: Date; dayStr: string }[] = [];

      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        dateList.push({ date, dayStr: localDateStr });
      }

      if (!profile?.id || profile.id === 'undefined') {
        setWeeklyHistory(dateList.map((dateItem, index) => ({
          d: index === 6 ? 'HN' : dayLabels[dateItem.date.getDay()],
          ml: 0,
          isToday: index === 6,
        })));
        setWeeklyLogCount(0);
        return;
      }

      const startDayStr = dateList[0].dayStr;
      const endDayStr = dateList[6].dayStr;

      try {
        const cacheKey = `digiwell_weekly_history_${profile.id}`;
        const cached = AppStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            if (Array.isArray(parsedCache) && parsedCache.length > 6) {
              parsedCache[6].ml = waterIntake;
              setWeeklyHistory(parsedCache);
            }
          } catch (e) { console.error('Failed to parse cache:', e); }
        }

        const { data: cloudData, error } = await supabase
          .from('water_logs')
          .select('id, day, amount')
          .eq('user_id', profile.id)
          .gte('day', startDayStr)
          .lte('day', endDayStr);

        if (error) throw error;

        const dataMap = new Map<string, number>();
        const logCountMap = new Map<string, number>();

        cloudData?.forEach((row: { day: string; amount: number }) => {
          if (!row.day) return;
          dataMap.set(row.day, (dataMap.get(row.day) || 0) + (row.amount || 0));
          logCountMap.set(row.day, (logCountMap.get(row.day) || 0) + 1);
        });

        const history = dateList.map((dateItem, index) => ({
          d: index === 6 ? 'HN' : dayLabels[dateItem.date.getDay()],
          ml: index === 6 ? waterIntake : (dataMap.get(dateItem.dayStr) || 0),
          isToday: index === 6,
        }));

        const nextWeeklyLogCount = dateList.reduce((sum, dateItem, index) => (
          sum + (index === 6 ? waterEntriesCount : (logCountMap.get(dateItem.dayStr) || 0))
        ), 0);

        setWeeklyHistory(history);
        setWeeklyLogCount(nextWeeklyLogCount);
        AppStorage.setItem(cacheKey, JSON.stringify(history));
      } catch (error) {
        console.error('Lỗi tải lịch sử tuần:', error);
      }
    };

    void fetchWeeklyHistory();
  }, [profile?.id, waterEntriesCount, waterIntake]);

  return {
    weeklyHistory,
    weeklyLogCount,
  };
}
