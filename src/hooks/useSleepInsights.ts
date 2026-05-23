import { useMemo } from 'react';
import type { ContextInsight } from './useContextAwareInsights';

interface UseSleepInsightsOptions {
  sleepHours: number;
  sleepQuality: number;
}

export function useSleepInsights({
  sleepHours,
  sleepQuality,
}: UseSleepInsightsOptions): ContextInsight[] {
  return useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (sleepHours <= 0 || sleepQuality <= 0) return result;

    const sleepDeficit = sleepHours < 7;
    const poorQuality = sleepQuality < 5;

    if (sleepDeficit || poorQuality) {
      const extraWater = sleepDeficit ? 300 : 150;
      const reason = sleepDeficit && poorQuality
        ? `Ngủ ít (${sleepHours}h) và chất lượng thấp (${sleepQuality}/10)`
        : sleepDeficit
          ? `Ngủ ít (${sleepHours}h, mục tiêu 7-8h)`
          : `Chất lượng giấc ngủ thấp (${sleepQuality}/10)`;
      
      result.push({
        id: 'sleep_impact',
        category: 'sleep',
        icon: 'moon',
        title: `Giấc ngủ ảnh hưởng đến hydrat hóa`,
        insight: `${reason} làm cơ thể mất cân bằng điện giải. Uống thêm ${extraWater}ml sáng nay để bù đắp. Thiếu ngủ + thiếu nước = giảm tập trung nghiêm trọng.`,
        impact: { label: 'Bù đắp', delta: `+${extraWater}ml` },
        confidence: sleepDeficit && poorQuality ? 0.8 : 0.65,
      });
    }

    return result;
  }, [sleepHours, sleepQuality]);
}
