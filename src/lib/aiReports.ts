/// <reference types="vite/client" />

// ============================================================
// DigiWell — AI Weekly/Monthly Health Report (Premium Version)
// ============================================================

import { supabase } from './supabase';
import { invokeAiGateway } from './aiGateway';

export type DailyEntry = {
  date:        string;
  waterIntake: number;
  waterGoal:   number;
  achieved:    boolean;
};

export type HealthReport = {
  period:           string;
  totalIntake:      number;
  avgDaily:         number;
  goalsAchieved:    number;
  totalDays:        number;
  achievementRate:  number;
  bestDay:          string;
  worstDay:         string;
  trend:            'improving' | 'declining' | 'stable';
  
  aiAnalysis:       string;
  recommendations:  string[];
  generatedAt:      string;
};

export type ReportPeriod = 'weekly' | 'monthly';

async function fetchWaterEntries(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('day, amount')
    .eq('user_id', userId)
    .gte('day', fromDate)
    .lte('day', toDate)
    .order('day', { ascending: true });

  if (error || !data) return [];

  const byDate = new Map<string, { intake: number; goal: number }>();

  for (const row of data) {
    const date = row.day;
    const existing = byDate.get(date) ?? { intake: 0, goal: 2000 };
    byDate.set(date, { intake: existing.intake + (row.amount ?? 0), goal: existing.goal });
  }

  return Array.from(byDate.entries()).map(([date, { intake, goal }]) => ({
    date,
    waterIntake: intake,
    waterGoal: goal,
    achieved: intake >= goal,
  }));
}

function calculateStats(entries: DailyEntry[]) {
  if (entries.length === 0) return null;

  const totalIntake     = entries.reduce((s, e) => s + e.waterIntake, 0);
  const avgDaily        = Math.round(totalIntake / entries.length);
  const goalsAchieved   = entries.filter(e => e.achieved).length;
  const achievementRate = Math.round((goalsAchieved / entries.length) * 100);

  const sorted         = [...entries].sort((a, b) => b.waterIntake - a.waterIntake);
  const bestDay        = sorted[0]?.date  ?? '';
  const worstDay       = sorted[sorted.length - 1]?.date ?? '';

  const mid    = Math.floor(entries.length / 2);
  const firstHalf  = entries.slice(0, mid).reduce((s, e) => s + e.waterIntake, 0) / (mid || 1);
  const secondHalf = entries.slice(mid).reduce((s, e) => s + e.waterIntake, 0) / (entries.length - mid || 1);
  const diff = secondHalf - firstHalf;
  const trend: HealthReport['trend'] =
    diff > 50 ? 'improving' : diff < -50 ? 'declining' : 'stable';

  return { totalIntake, avgDaily, goalsAchieved, totalDays: entries.length,
           achievementRate, bestDay, worstDay, trend };
}

const normalizeReport = (value: unknown): HealthReport | null => {
  if (!value) return null;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return null;
    const report = parsed as Partial<HealthReport>;

    return {
      period: report.period ?? '',
      totalIntake: report.totalIntake ?? 0,
      avgDaily: report.avgDaily ?? 0,
      goalsAchieved: report.goalsAchieved ?? 0,
      totalDays: report.totalDays ?? 0,
      achievementRate: report.achievementRate ?? 0,
      bestDay: report.bestDay ?? '',
      worstDay: report.worstDay ?? '',
      trend: report.trend ?? 'stable',
      aiAnalysis: report.aiAnalysis ?? '',
      recommendations: report.recommendations ?? [],
      generatedAt: report.generatedAt ?? '',
    };
  } catch (err) {
    console.error('[normalizeReport]', err);
    return null;
  }
};

export async function getLatestHealthReport(
  userId: string,
  reportType: ReportPeriod,
): Promise<HealthReport | null> {
  const { data, error } = await supabase
    .from('ai_reports')
    .select('content')
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeReport(data.content);
}

async function generateAiAnalysis(
  stats: unknown,
  entries: DailyEntry[],
  periodLabel: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<{ analysis: string; recommendations: string[] }> {
  if (!stats) return { analysis: 'Không đủ dữ liệu.', recommendations: [] };

  try {
    const response = await invokeAiGateway<{ analysis?: string; recommendations?: string[] }>('report-analysis', {
      stats,
      entries,
      periodLabel,
      profile: profile || {},
    });

    return {
      analysis: response.analysis || '',
      recommendations: response.recommendations || [],
    };
  } catch (err) {
    console.error('[generateAiAnalysis]', err);
    return { analysis: 'Lỗi xử lý AI', recommendations: [] };
  }
}

export async function generateWeeklyReport(
  userId: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<HealthReport> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const fromDate = weekAgo.toISOString().split('T')[0];
  const toDate   = today.toISOString().split('T')[0];
  const periodLabel = `${formatDate(weekAgo)} – ${formatDate(today)}`;

  const entries = await fetchWaterEntries(userId, fromDate, toDate);
  const stats   = calculateStats(entries);
  const aiRes   = await generateAiAnalysis(stats, entries, periodLabel, profile);

  const report: HealthReport = {
    period:          periodLabel,
    totalIntake:      stats?.totalIntake      ?? 0,
    avgDaily:         stats?.avgDaily         ?? 0,
    goalsAchieved:    stats?.goalsAchieved    ?? 0,
    totalDays:        stats?.totalDays        ?? 0,
    achievementRate: stats?.achievementRate ?? 0,
    bestDay:          stats?.bestDay          ?? '',
    worstDay:         stats?.worstDay         ?? '',
    trend:            stats?.trend            ?? 'stable',
    aiAnalysis:       aiRes.analysis,
    recommendations:  aiRes.recommendations,
    generatedAt:      new Date().toISOString(),
  };

  await supabase.from('ai_reports').insert({
    user_id:      userId,
    report_type:  'weekly',
    content:      JSON.stringify(report),
    period_start: fromDate,
    period_end:   toDate,
  });

  return report;
}

export async function generateMonthlyReport(
  userId: string,
  profile?: { nickname?: string; goal?: string; activity?: string; avgHeartRate?: number },
): Promise<HealthReport> {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  const fromDate = monthAgo.toISOString().split('T')[0];
  const toDate   = today.toISOString().split('T')[0];
  const periodLabel = `${formatDate(monthAgo)} – ${formatDate(today)}`;

  const entries = await fetchWaterEntries(userId, fromDate, toDate);
  const stats   = calculateStats(entries);
  const aiRes   = await generateAiAnalysis(stats, entries, periodLabel, profile);

  const report: HealthReport = {
    period:          periodLabel,
    totalIntake:      stats?.totalIntake      ?? 0,
    avgDaily:         stats?.avgDaily         ?? 0,
    goalsAchieved:    stats?.goalsAchieved    ?? 0,
    totalDays:        stats?.totalDays        ?? 0,
    achievementRate: stats?.achievementRate ?? 0,
    bestDay:          stats?.bestDay          ?? '',
    worstDay:         stats?.worstDay         ?? '',
    trend:            stats?.trend            ?? 'stable',
    aiAnalysis:       aiRes.analysis,
    recommendations:  aiRes.recommendations,
    generatedAt:      new Date().toISOString(),
  };

  await supabase.from('ai_reports').insert({
    user_id:      userId,
    report_type:  'monthly',
    content:      JSON.stringify(report),
    period_start: fromDate,
    period_end:   toDate,
  });

  return report;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d);
}
