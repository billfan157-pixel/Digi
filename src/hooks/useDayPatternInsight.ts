import { useMemo } from 'react';
import { DAY_NAMES, getLocalDateKey } from './insight/insightHelpers';
import type { ContextInsight } from './useContextAwareInsights';

interface UseDayPatternInsightOptions {
  weeklyData: { d: string; ml: number; isToday?: boolean; fullDate?: string }[];
  waterGoal: number;
}

export function useDayPatternInsight({
  weeklyData,
  waterGoal,
}: UseDayPatternInsightOptions): ContextInsight[] {
  return useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (weeklyData.length < 3) return result;

    const todayKey = getLocalDateKey(new Date());

    // Day-of-week pattern analysis
    const dayOfWeekMap = new Map<number, { total: number; count: number }>();
    weeklyData.forEach(entry => {
      let dow = -1;
      if (entry.fullDate) {
        const d = new Date(entry.fullDate);
        if (!Number.isNaN(d.getTime())) {
          dow = d.getDay();
        }
      }
      if (dow === -1) {
        if (entry.d === 'HN') {
          dow = new Date().getDay();
        } else {
          const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          dow = labels.indexOf(entry.d);
        }
      }

      if (dow >= 0 && dow <= 6) {
        const existing = dayOfWeekMap.get(dow) || { total: 0, count: 0 };
        existing.total += entry.ml;
        existing.count += 1;
        dayOfWeekMap.set(dow, existing);
      }
    });

    if (dayOfWeekMap.size >= 3) {
      const dayAvgs = Array.from(dayOfWeekMap.entries()).map(
        ([dow, { total, count }]) => ({ dow, avg: count > 0 ? total / count : 0, count, name: DAY_NAMES[dow] })
      );
      dayAvgs.sort((a, b) => a.avg - b.avg);

      const worst = dayAvgs[0];
      const best = dayAvgs[dayAvgs.length - 1];
      const spread = best.avg - worst.avg;

      if (spread > waterGoal * 0.15 && worst.count >= 1) {
        const pctDrop = best.avg > 0 ? Math.round((1 - worst.avg / best.avg) * 100) : 0;
        const isTodayWorst = new Date(todayKey).getDay() === worst.dow;
        result.push({
          id: 'day_pattern',
          category: 'day_pattern',
          icon: 'clock',
          title: isTodayWorst ? `Hôm nay là ngày yếu của bạn` : `${worst.name} — ngày dễ quên uống nước`,
          insight: isTodayWorst
            ? `Trung bình ${worst.name} bạn chỉ uống ${Math.round(worst.avg)}ml, thấp hơn ${pctDrop}% so với ngày tốt nhất (${best.name}: ${Math.round(best.avg)}ml). Hãy đặt nhắc nhở hôm nay!`
            : `Dữ liệu cho thấy ${worst.name} bạn uống ít nhất (${Math.round(worst.avg)}ml), thấp hơn ${pctDrop}% so với ${best.name} (${Math.round(best.avg)}ml).`,
          impact: { label: 'Chênh lệch ngày', delta: `-${pctDrop}%` },
          confidence: Math.min(0.95, 0.5 + worst.count * 0.15),
        });
      }
    }

    return result;
  }, [weeklyData, waterGoal]);
}
