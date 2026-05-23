/**
 * Sprint 13-14: AI Personalization Engine
 * Weekly Report Engine — tạo báo cáo tổng kết tuần
 * Template-based fallback + AI-powered insights
 */
import type { WaterLog } from '../models';

// ─── Types ───────────────────────────────────────────────────────────

export interface WeeklyReport {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  totalIntake: number;
  avgDaily: number;
  goalHitDays: number;
  totalDays: number;
  bestDay: { date: string; ml: number };
  worstDay: { date: string; ml: number };
  trend: 'improving' | 'declining' | 'stable';
  insight: string;
  tip: string;
  comparisonToPreviousWeek: number; // % change (positive = better)
  consistencyScore: number;
}

export interface WeeklyReportInput {
  currentWeekLogs: WaterLog[]; // 7 ngày gần nhất
  previousWeekLogs: WaterLog[]; // 7 ngày trước đó (để so sánh)
  waterGoal: number;
  useAI?: boolean; // nếu false, chỉ dùng template
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDateOnly(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr.slice(0, 10) : d.toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return toLocalISOString(monday);
}

function getWeekEnd(weekStart: string): string {
  const parts = weekStart.split('-');
  const start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return toLocalISOString(end);
}

// ─── Analysis ───────────────────────────────────────────────────────

function aggregateByDay(logs: WaterLog[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const log of logs) {
    const day = getDateOnly(log.day || log.created_at);
    byDay.set(day, (byDay.get(day) || 0) + log.amount);
  }
  return byDay;
}

function getBestAndWorstDay(
  byDay: Map<string, number>,
): { bestDay: { date: string; ml: number }; worstDay: { date: string; ml: number }; totalDays: number } {
  let bestDay = { date: '', ml: 0 };
  let worstDay = { date: '', ml: Infinity };

  for (const [date, ml] of byDay) {
    if (ml > bestDay.ml) bestDay = { date, ml };
    if (ml < worstDay.ml) worstDay = { date, ml };
  }

  return {
    bestDay,
    worstDay: worstDay.ml === Infinity ? { date: '', ml: 0 } : worstDay,
    totalDays: byDay.size,
  };
}

function detectTrendFromWeeks(
  currentAvg: number,
  previousAvg: number,
): WeeklyReport['trend'] {
  if (previousAvg === 0) return 'stable';
  const change = (currentAvg - previousAvg) / previousAvg;
  if (change > 0.1) return 'improving';
  if (change < -0.1) return 'declining';
  return 'stable';
}

function calculateConsistency(byDay: Map<string, number>, totalDays: number): number {
  if (totalDays < 2) return 50;
  const amounts = Array.from(byDay.values());
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
}

// ─── Template Insights ─────────────────────────────────────────────

function generateTemplateInsight(
  goalHitDays: number,
  totalDays: number,
  trend: WeeklyReport['trend'],
  avgDaily: number,
  comparison: number,
): { insight: string; tip: string } {
  let insight: string;
  let tip: string;

  const ratio = totalDays > 0 ? goalHitDays / totalDays : 0;

  if (ratio >= 0.85) {
    insight = `Tuyệt vời! Bạn đã đạt mục tiêu ${goalHitDays}/${totalDays} ngày trong tuần này.`;
    tip = 'Hãy duy trì thói quen tốt này. Thử thách bản thân với mục tiêu cao hơn vào tuần sau!';
  } else if (ratio >= 0.5) {
    insight = `Khá tốt! Bạn đạt ${goalHitDays}/${totalDays} ngày. Trung bình ${Math.round(avgDaily)}ml/ngày.`;
    if (trend === 'improving') {
      tip = 'Đang cải thiện dần! Tuần sau cố gắng uống thêm 200ml mỗi ngày nhé.';
    } else if (trend === 'declining') {
      tip = 'Có dấu hiệu giảm nhẹ. Hãy tập trung hơn vào các khung giờ dễ quên.';
    } else {
      tip = 'Giữ vững phong độ! Thêm một ly nước mỗi bữa ăn để cải thiện.';
    }
  } else {
    insight = `Cần cố gắng hơn! Bạn mới đạt ${goalHitDays}/${totalDays} ngày. Trung bình ${Math.round(avgDaily)}ml/ngày.`;
    tip = 'Hãy đặt nhắc nhở mỗi 2 tiếng. Bắt đầu với mục tiêu nhỏ: uống 1 ly mỗi giờ.';
  }

  // Thêm so sánh với tuần trước
  if (comparison > 0) {
    insight += ` So với tuần trước, bạn đã uống nhiều hơn ${Math.round(comparison)}%. Tiến bộ rõ rệt!`;
  } else if (comparison < 0) {
    insight += ` Tuần này uống ít hơn ${Math.round(Math.abs(comparison))}% so với tuần trước.`;
  }

  return { insight, tip };
}

// ─── Main Function ───────────────────────────────────────────────────

/**
 * Tạo weekly report từ water_logs
 * Có thể dùng AI nếu `useAI = true` (caller gọi Groq sau khi có report template)
 */
export function generateWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const { currentWeekLogs, previousWeekLogs, waterGoal } = input;

  const byDay = aggregateByDay(currentWeekLogs);
  const prevByDay = aggregateByDay(previousWeekLogs);

  const { bestDay, worstDay, totalDays } = getBestAndWorstDay(byDay);

  // Tính goal hit days với waterGoal
  let goalHitDays = 0;
  for (const [, ml] of byDay) {
    if (ml >= waterGoal) goalHitDays++;
  }

  const totalIntake = currentWeekLogs.reduce((s, l) => s + l.amount, 0);
  const avgDaily = totalDays > 0 ? totalIntake / totalDays : 0;

  const previousAvg = prevByDay.size > 0
    ? Array.from(prevByDay.values()).reduce((s, v) => s + v, 0) / prevByDay.size
    : 0;

  const trend = detectTrendFromWeeks(avgDaily, previousAvg);
  const consistencyScore = calculateConsistency(byDay, totalDays);

  // So sánh với tuần trước
  const previousTotal = Array.from(prevByDay.values()).reduce((s, v) => s + v, 0);
  const comparisonToPreviousWeek = previousTotal > 0
    ? Math.round(((totalIntake - previousTotal) / previousTotal) * 100)
    : 0;

  const { insight, tip } = generateTemplateInsight(
    goalHitDays,
    totalDays,
    trend,
    avgDaily,
    comparisonToPreviousWeek,
  );

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  return {
    weekStart,
    weekEnd,
    totalIntake,
    avgDaily: Math.round(avgDaily * 10) / 10,
    goalHitDays,
    totalDays,
    bestDay,
    worstDay,
    trend,
    insight,
    tip,
    comparisonToPreviousWeek,
    consistencyScore,
  };
}

/**
 * Cache report vào localStorage
 */
export function cacheReport(report: WeeklyReport): void {
  try {
    const key = `digiwell_weekly_report_${report.weekStart}`;
    localStorage.setItem(key, JSON.stringify({ report, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

/**
 * Lấy cached report
 */
export function getCachedReport(weekStart?: string): WeeklyReport | null {
  try {
    const ws = weekStart || getWeekStart();
    const raw = localStorage.getItem(`digiwell_weekly_report_${ws}`);
    if (!raw) return null;
    const { report } = JSON.parse(raw);
    return report as WeeklyReport;
  } catch {
    return null;
  }
}

/**
 * Tạo text summary để user chia sẻ
 */
export function formatReportForSharing(report: WeeklyReport): string {
  const lines = [
    '📊 *Báo cáo uống nước tuần này*',
    '',
    `📅 ${report.weekStart} → ${report.weekEnd}`,
    `🥤 Tổng: ${report.totalIntake}ml (TB ${report.avgDaily}ml/ngày)`,
    `🎯 Đạt mục tiêu: ${report.goalHitDays}/${report.totalDays} ngày`,
    '',
    report.insight,
    '',
    `💡 ${report.tip}`,
    '',
    '— DigiWell',
  ];
  return lines.join('\n');
}