import { useMemo } from 'react';
import type { ContextInsight } from './useContextAwareInsights';

interface UseWeatherInsightsOptions {
  weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null;
  isWeatherSynced: boolean;
  waterGoal: number;
  waterIntake: number;
}

export function useWeatherInsights({
  weatherData,
  isWeatherSynced,
  waterGoal,
  waterIntake,
}: UseWeatherInsightsOptions): { insights: ContextInsight[]; weatherAdjustment: number } {
  const weatherAdjustment = useMemo(() => {
    if (!isWeatherSynced || !weatherData || weatherData.temp === undefined) return 0;
    const { temp, humidity } = weatherData;
    if (temp >= 35 || (temp >= 32 && (humidity ?? 0) >= 75) || (humidity ?? 0) >= 85) return 500;
    if (temp >= 30 || (temp >= 28 && (humidity ?? 0) >= 75)) return 250;
    return 0;
  }, [weatherData, isWeatherSynced]);

  const insights = useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (weatherAdjustment === 0 || !weatherData || weatherData.temp === undefined) return result;

    const { temp, humidity } = weatherData;

    if (weatherAdjustment === 500) {
      const extraNeed = 500;
      const adjustedGoal = waterGoal + extraNeed;
      const deficit = Math.max(0, adjustedGoal - waterIntake);
      result.push({
        id: 'weather_hot_humid',
        category: 'weather',
        icon: 'thermometer',
        title: `Nắng nóng + ẩm cao (${Math.round(temp)}°C, ${humidity ?? 0}% ẩm)`,
        insight: `Thời tiết nắng nóng kết hợp độ ẩm cao làm cơ thể mất nước nhanh hơn bình thường. Mục tiêu thực tế hôm nay nên là ${adjustedGoal}ml (+${extraNeed}ml). Hiện tại còn thiếu ${deficit}ml.`,
        impact: { label: 'Nhu cầu thêm', delta: `+${extraNeed}ml` },
        confidence: 0.9,
      });
    } else if (weatherAdjustment === 250) {
      const extraNeed = 250;
      const adjustedGoal = waterGoal + extraNeed;
      const deficit = Math.max(0, adjustedGoal - waterIntake);
      result.push({
        id: 'weather_hot',
        category: 'weather',
        icon: 'thermometer',
        title: `Trời nóng (${Math.round(temp)}°C)`,
        insight: `Nhiệt độ cao làm tăng mất nước qua mồ hôi. Nên tăng mục tiêu lên ${adjustedGoal}ml (+${extraNeed}ml). Còn thiếu ${deficit}ml.`,
        impact: { label: 'Nhu cầu thêm', delta: `+${extraNeed}ml` },
        confidence: 0.85,
      });
    }

    return result;
  }, [weatherData, waterGoal, waterIntake, weatherAdjustment]);

  return { insights, weatherAdjustment };
}
