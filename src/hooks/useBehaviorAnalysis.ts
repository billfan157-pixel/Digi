import { useMemo, useCallback } from 'react';

export interface BehaviorPattern {
  pattern: string;
  confidence: number;
  recommendation: string;
}

interface UseBehaviorAnalysisProps {
  weeklyData: { d: string; ml: number }[];
  waterGoal: number;
}

export function useBehaviorAnalysis({ weeklyData, waterGoal }: UseBehaviorAnalysisProps) {
  // Dùng JSON.stringify để tạo chuỗi cố định, tránh infinite loop do tham chiếu array thay đổi liên tục
  const weeklyDataStr = JSON.stringify(weeklyData);

  // Analyze drinking patterns
  const patterns = useMemo((): BehaviorPattern[] => {
    const data: { d: string; ml: number }[] = JSON.parse(weeklyDataStr);
    const result: BehaviorPattern[] = [];
    
    if (data.length < 3) return result;

    // Group by actual day-of-week
    const byDow = new Map<number, { total: number; count: number }>();
    data.forEach(entry => {
      const d = new Date(entry.d);
      if (!Number.isNaN(d.getTime())) {
        const dow = d.getDay();
        const cur = byDow.get(dow) ?? { total: 0, count: 0 };
        cur.total += entry.ml;
        cur.count++;
        byDow.set(dow, cur);
      }
    });
    
    if (byDow.size >= 4) {
      const weekend = [5, 6, 0]; // Fri, Sat, Sun — so sánh Thứ 2->5 vs Thứ 6->CN
      let wdTotal = 0, wdCount = 0, weTotal = 0, weCount = 0;
      byDow.forEach((val, dow) => {
        if (weekend.includes(dow)) { weTotal += val.total; weCount += val.count; }
        else { wdTotal += val.total; wdCount += val.count; }
      });
      const wdAvg = wdCount > 0 ? wdTotal / wdCount : 0;
      const weAvg = weCount > 0 ? weTotal / weCount : 0;
      
      if (weAvg > 0 && weAvg < wdAvg * 0.5) {
        result.push({
          pattern: 'Cuối tuần giảm',
          confidence: 0.7,
          recommendation: 'Cuối tuần bạn hay uống ít hơn. Hãy đặt nhắc nhở để giữ nhịp.'
        });
      }
    }
    
    // Pattern 2: Constistency
    const completedDays = data.filter(d => d.ml >= waterGoal).length;
    const consistency = completedDays / data.length;
    
    if (consistency < 0.4) {
      result.push({
        pattern: 'Ít đều đặn',
        confidence: 0.9,
        recommendation: 'Tạo nhắc uống mỗi 2 tiếng để tăng độ đều.'
      });
    } else if (consistency > 0.8) {
      result.push({
        pattern: 'Rất đều đặn',
        confidence: 0.95,
        recommendation: 'Thói quen tốt! Hãy duy trì và chia sẻ với bạn bè.'
      });
    }
    
    return result;
  }, [weeklyDataStr, waterGoal]);
  
  // Generate adaptive recommendations
  const getAdaptiveRecommendation = useCallback((_hour: number, currentIntake: number): string => {
    const gap = waterGoal - currentIntake;
    
    for (const pattern of patterns) {
      if (pattern.pattern === 'Ít đều đặn') {
        return `Uống ${Math.min(150, Math.max(50, gap / 4))}ml ngay để bắt kịp.`;
      }
    }
    
    return `Uống ${Math.min(250, gap)}ml để duy trì tiến độ.`;
  }, [patterns, waterGoal]);
  
  return { patterns, getAdaptiveRecommendation };
}