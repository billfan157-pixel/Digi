import { useMemo, useCallback } from 'react';

interface WaterLog {
  day: string;
  amount: number;
  created_at?: string;
}

interface BehaviorPattern {
  pattern: string;
  confidence: number;
  recommendation: string;
}

interface UseBehaviorAnalysisProps {
  weeklyData: { d: string; ml: number }[];
  waterLogs: WaterLog[];
  waterGoal: number;
}

export function useBehaviorAnalysis({ weeklyData, waterLogs, waterGoal }: UseBehaviorAnalysisProps) {
  // Dùng JSON.stringify để tạo chuỗi cố định, tránh infinite loop do tham chiếu array thay đổi liên tục
  const weeklyDataStr = JSON.stringify(weeklyData);

  // Analyze drinking patterns
  const patterns = useMemo((): BehaviorPattern[] => {
    const data: { d: string; ml: number }[] = JSON.parse(weeklyDataStr);
    const result: BehaviorPattern[] = [];
    
    if (data.length < 3) return result;
    
    // Pattern 1: Morning vs Evening preference
    const morningAvg = data
      .filter((_, i) => i < 4) // Mon-Thu
      .reduce((s, d) => s + d.ml, 0) / Math.min(4, data.length);
    const eveningAvg = data
      .filter((_, i) => i >= 4) // Fri-Sun
      .reduce((s, d) => s + d.ml, 0) / Math.max(1, data.length - 4);
    
    if (morningAvg > eveningAvg * 1.3) {
      result.push({
        pattern: 'Sáng tối',
        confidence: 0.8,
        recommendation: 'Bạn uống nhiều vào buổi sáng. Hãy duy trì và thêm 200ml vào buổi chiều.'
      });
    } else if (eveningAvg > morningAvg * 1.3) {
      result.push({
        pattern: 'Chiều tối',
        confidence: 0.75,
        recommendation: 'Bạn uống nhiều vào buổi chiều/tối. Nên bắt đầu ngày với 250ml để cân bằng.'
      });
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
    
    // Pattern 3: Weekend vs Weekday
    const weekdays = data.slice(0, 5);
    const weekends = data.slice(5);
    const weekdayAvg = weekdays.reduce((s, d) => s + d.ml, 0) / Math.max(1, weekdays.length);
    const weekendAvg = weekends.reduce((s, d) => s + d.ml, 0) / Math.max(1, weekends.length);
    
    if (weekendAvg < weekdayAvg * 0.5 && weekendAvg > 0) {
      result.push({
        pattern: 'Cuối tuần giảm',
        confidence: 0.7,
        recommendation: 'Weekend bạn ít uống. Đặt nhắc nhở để không bỏ lỡ.'
      });
    }
    
    return result;
  }, [weeklyDataStr, waterGoal]);
  
  // Generate adaptive recommendations
  const getAdaptiveRecommendation = useCallback((hour: number, currentIntake: number): string => {
    const gap = waterGoal - currentIntake;
    
    for (const pattern of patterns) {
      if (pattern.pattern === 'Sáng tối' && hour < 12 && gap > 500) {
        return 'Bắt đầu ngày với 300ml để cân bằng năng lượng.';
      }
      if (pattern.pattern === 'Chiều tối' && hour >= 12 && gap > 500) {
        return 'Nên giảm portion và tăng tần suất uống vào buổi sáng.';
      }
      if (pattern.pattern === 'Ít đều đặn') {
        return `Uống ${Math.min(150, Math.max(50, gap / 4))}ml ngay để bắt kịp.`;
      }
    }
    
    return `Uống ${Math.min(250, gap)}ml để duy trì tiến độ.`;
  }, [patterns, waterGoal]);
  
  return { patterns, getAdaptiveRecommendation };
}