import { useMemo } from 'react';
import type { ContextInsight } from './useContextAwareInsights';

interface UseConsistencyTrendOptions {
  weeklyData: { d: string; ml: number; isToday?: boolean }[];
}

export function useConsistencyTrend({
  weeklyData,
}: UseConsistencyTrendOptions): ContextInsight[] {
  return useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (weeklyData.length < 5) return result;

    const firstHalf = weeklyData.slice(0, Math.floor(weeklyData.length / 2));
    const secondHalf = weeklyData.slice(Math.floor(weeklyData.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.ml, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.ml, 0) / secondHalf.length : 0;
    const trendPct = firstAvg > 0 && Number.isFinite(firstAvg) ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

    if (Math.abs(trendPct) >= 10) {
      const direction = trendPct > 0 ? 'tăng' : 'giảm';
      const emoji = trendPct > 0 ? '📈' : '📉';
      result.push({
        id: 'consistency_trend',
        category: 'day_pattern',
        icon: 'clock',
        title: `Xu hướng tuần này: ${direction} ${Math.abs(trendPct)}%`,
        insight: trendPct > 0
          ? `${emoji} Phong độ đang lên! Nửa sau tuần uống trung bình ${Math.round(secondAvg)}ml so với ${Math.round(firstAvg)}ml nửa đầu. Duy trì nhịp này là sẽ đạt streak mới.`
          : `${emoji} Cảnh báo: nửa sau tuần uống giảm còn ${Math.round(secondAvg)}ml so với ${Math.round(firstAvg)}ml nửa đầu. Cần lấy lại nhịp trước khi cuối tuần.`,
        impact: { label: 'Xu hướng', delta: `${trendPct > 0 ? '+' : ''}${trendPct}%` },
        confidence: 0.75,
      });
    }

    return result;
  }, [weeklyData]);
}
