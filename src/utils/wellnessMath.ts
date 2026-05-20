/**
 * Wellness Score System - Core Algorithm
 * Combines: Hydration (30%) + Sleep (30%) + Activity (20%) + Mood (20%)
 */

export interface WellnessData {
  wellnessScore: number;      // 0-100 (renamed from overallScore)
  hydrationScore: number;     // 0-100
  sleepScore: number;         // 0-100
  activityScore: number;      // 0-100
  moodScore: number;          // 0-100
  trend: 'up' | 'down' | 'stable';
  weeklyAverage: number;
  monthlyAverage: number;
}

export interface SleepData {
  hours: number;
  quality: number; // 1-10 scale
}

export interface ActivityData {
  steps: number;
  activeMinutes: number;
  calories?: number;
  intensity: 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
}

export interface MoodEntry {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  notes?: string;
  energyLevel?: number; // 1-10
}

export interface WellnessCorrelation {
  type: 'hydration_sleep' | 'hydration_energy' | 'hydration_mood' | 'sleep_activity';
  strength: number; // 0-1 correlation coefficient
  insight: string;
  recommendation: string;
  examples: {
    scenario: string;
    impact: string;
  }[];
}

/**
 * Calculate hydration score (0-100)
 * 100% = at or above goal, proportional below
 */
export function calculateHydrationScore(current: number, goal: number): number {
  if (!goal || goal === 0) return 0;
  const ratio = current / goal;
  return Math.min(Math.round(ratio * 100), 100);
}

/**
 * Calculate sleep score (0-100)
 * Target: 7-9 hours optimal
 */
export function calculateSleepScore(hours: number, quality: number): number {
  // Hours component (60% of sleep score)
  let hoursScore = 0;
  if (hours >= 7 && hours <= 9) {
    hoursScore = 100; // Optimal range
  } else if (hours >= 6 && hours < 7) {
    hoursScore = 80; // Slightly under
  } else if (hours >= 9 && hours <= 10) {
    hoursScore = 85; // Slightly over
  } else if (hours >= 5) {
    hoursScore = 50; // Moderate deficit
  } else {
    hoursScore = 20; // Severe deficit
  }

  // Quality component (40% of sleep score, normalized 1-10 to 0-100)
  const qualityScore = quality * 10;

  return Math.round(hoursScore * 0.6 + qualityScore * 0.4);
}

/**
 * Calculate activity score (0-100)
 * Steps target: 10,000 steps daily (WHO recommendation)
 */
export function calculateActivityScore(steps: number, activeMinutes: number): number {
  // Steps component (70% of activity score)
  const stepsScore = Math.min((steps / 10000) * 100, 100);

  // Active minutes component (WHO recommends 150 min/week → ~21/day)
  const activeMinutesTarget = 21;
  const activeScore = Math.min((activeMinutes / activeMinutesTarget) * 100, 100);

  return Math.round(stepsScore * 0.7 + activeScore * 0.3);
}

/**
 * Calculate mood score (0-100)
 * Direct conversion from 1-5 scale
 */
export function calculateMoodScore(mood: 1 | 2 | 3 | 4 | 5): number {
  return ((mood - 1) / 4) * 100; // 1→0%, 3→50%, 5→100%
}

/**
 * Calculate composite Wellness Score
 * Formula: (Hydration × 0.3) + (Sleep × 0.3) + (Activity × 0.2) + (Mood × 0.2)
 */
export function calculateWellnessScore(data: {
  hydration: number;   // 0-100
  sleep: number;       // 0-100
  activity: number;    // 0-100
  mood: number;        // 0-100
}): number {
  const { hydration, sleep, activity, mood } = data;
  return Math.round(
    hydration * 0.3 +
    sleep * 0.3 +
    activity * 0.2 +
    mood * 0.2
  );
}

/**
 * Get Wellness Tier based on score
 */
export function getWellnessTier(score: number): {
  tier: string;
  emoji: string;
  color: string;
  description: string;
} {
  if (score >= 90) return { tier: 'Platinum', emoji: '💎', color: 'text-purple-400', description: 'Xuất sắc! Bạn đang ở đỉnh cao phong độ.' };
  if (score >= 80) return { tier: 'Gold', emoji: '🏆', color: 'text-yellow-400', description: 'Rất tốt! Hãy duy trì phong độ này.' };
  if (score >= 70) return { tier: 'Silver', emoji: '🥈', color: 'text-slate-300', description: 'Tốt. Còn room để cải thiện.' };
  if (score >= 60) return { tier: 'Bronze', emoji: '🥉', color: 'text-amber-600', description: 'Khá. Bắt đầu xây dựng thói quen.' };
  if (score >= 50) return { tier: 'Starter', emoji: '🌱', color: 'text-emerald-400', description: 'Đầu tiên là bắt đầu!' };
  return { tier: 'Needs Work', emoji: '💪', color: 'text-red-400', description: 'Cần tập trung cải thiện sức khỏe.' };
}

/**
 * Generate wellness insights based on correlations
 */
function hasVariance(values: number[]): boolean {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return false;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return mean > 0 && (max - min) / mean > 0.05;
}

export function generateWellnessInsights(
  history: Array<{
    date: string;
    hydration: number;
    sleep: number;
    activity: number;
    mood: number;
  }>
): WellnessCorrelation[] {
  if (history.length < 7) return [];

  const insights: WellnessCorrelation[] = [];

  // Correlation: Hydration → Sleep Quality
  const hydrationSleepCorr = calculateCorrelation(
    history.map(h => h.hydration),
    history.map(h => h.sleep)
  );

  if (hasVariance(history.map(h => h.hydration)) && hasVariance(history.map(h => h.sleep)) && Math.abs(hydrationSleepCorr) > 0.3) {
    insights.push({
      type: 'hydration_sleep',
      strength: hydrationSleepCorr,
      insight: hydrationSleepCorr > 0
        ? 'Uống đủ nước giúp cải thiện chất lượng giấc ngủ'
        : 'Uống thiếu nước ảnh hưởng tiêu cực đến giấc ngủ',
      recommendation: hydrationSleepCorr > 0
        ? 'Uống ít nhất 250ml trước khi ngủ để cải thiện sleep score'
        : 'Tránh uống quá nhiều gần đêm để ngủ ngon hơn',
      examples: [
        { scenario: 'Ngày uống 2000ml+, ngủ 8h (quality 8/10)', impact: '+0.6h deep sleep' },
        { scenario: 'Ngày uống 1000ml-, ngủ 6h (quality 5/10)', impact: '-2h total sleep' }
      ]
    });
  }

  // Correlation: Morning Hydration → Mood
  const morningHydration = history.map(h => h.hydration); // simplified
  const moodCorr = calculateCorrelation(morningHydration, history.map(h => h.mood));

  if (hasVariance(history.map(h => h.hydration)) && hasVariance(history.map(h => h.mood)) && Math.abs(moodCorr) > 0.25) {
    insights.push({
      type: 'hydration_mood',
      strength: moodCorr,
      insight: moodCorr > 0
        ? 'Hydration buổi sáng là chìa khóa cho tâm trạng tốt'
        : 'Thiếu nước buổi sáng ảnh hưởng đến tâm trạng',
      recommendation: 'Uống 300ml ngay khi thức dậy để khởi ngày với năng lượng tích cực',
      examples: [
        { scenario: 'Uống 300ml trong 30 phút đầu khởi động', impact: '+25% mood score' },
        { scenario: 'Bỏ qua buổi sáng, cảm giác mệt mỏi', impact: '-0.5 avg mood' }
      ]
    });
  }

  return insights;
}

/**
 * Pearson correlation coefficient
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}
