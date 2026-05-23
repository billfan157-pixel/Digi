/**
 * Sprint 13-14: AI Personalization Engine
 * Hook quản lý weekly report
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  generateWeeklyReport,
  cacheReport,
  getCachedReport,
  formatReportForSharing,
  type WeeklyReport,
} from '../lib/weeklyReportEngine';
import { supabase } from '../lib/supabase';
import type { WaterLog } from '../models';
import { useAppStore } from '../store/useAppStore';
import { generateWeeklyReportAdvice } from '../lib/ai';

interface UseWeeklyReportProps {
  currentWeekLogs: WaterLog[];
  previousWeekLogs: WaterLog[];
  waterGoal: number;
  userId: string | null;
}

interface UseWeeklyReportResult {
  report: WeeklyReport | null;
  isLoading: boolean;
  hasNewReport: boolean;
  dismissNewReport: () => void;
  refreshReport: () => void;
  shareReport: () => void;
}

/**
 * Hook quản lý weekly report
 * Tự động generate đầu tuần mới khi user mở app
 */
export function useWeeklyReport({
  currentWeekLogs,
  previousWeekLogs,
  waterGoal,
  userId,
}: UseWeeklyReportProps): UseWeeklyReportResult {
  const profile = useAppStore((s) => s.profile);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewReport, setHasNewReport] = useState(false);
  const hasCheckedDBRef = useRef(false);

  // Generate report
  const generateReport = useCallback(
    async (force = false) => {
      if (!userId) return null;
      if (currentWeekLogs.length === 0 && !force) return null;

      setIsLoading(true);
      try {
        const generated = generateWeeklyReport({
          currentWeekLogs,
          previousWeekLogs,
          waterGoal,
        });

        // Tích hợp AI weekly report
        if (navigator.onLine) {
          try {
            // Group currentWeekLogs by date to pass as entries
            const dailyMap = new Map<string, number>();
            for (const log of currentWeekLogs) {
              const d = (log.day || log.created_at || '').slice(0, 10);
              if (d) {
                dailyMap.set(d, (dailyMap.get(d) || 0) + log.amount);
              }
            }

            // Generate daily entries for the current week (past 7 days ending at weekEnd)
            const entries = [];
            const endDate = new Date(generated.weekEnd);
            for (let i = 6; i >= 0; i--) {
              const d = new Date(endDate);
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().slice(0, 10);
              const intake = dailyMap.get(dateStr) || 0;
              entries.push({
                date: dateStr,
                waterIntake: intake,
                waterGoal,
                achieved: intake >= waterGoal,
              });
            }

            const stats = {
              goalsAchieved: generated.goalHitDays,
              totalDays: generated.totalDays || 7,
              achievementRate: Math.round((generated.goalHitDays / Math.max(generated.totalDays || 7, 1)) * 100),
            };

            const nickname = profile?.nickname || 'bạn';
            const aiResult = await generateWeeklyReportAdvice(
              stats,
              entries,
              `${generated.weekStart} đến ${generated.weekEnd}`,
              { nickname }
            );

            if (aiResult && aiResult.analysis) {
              generated.insight = aiResult.analysis;
              if (aiResult.recommendations && aiResult.recommendations.length > 0) {
                generated.tip = aiResult.recommendations.join('\n');
              }
            }
          } catch (aiErr) {
            console.warn('[useWeeklyReport] AI advice fetch failed, fallback to template:', aiErr);
          }
        }

        setReport(generated);
        cacheReport(generated);
        return generated;
      } finally {
        setIsLoading(false);
      }
    },
    [currentWeekLogs, previousWeekLogs, waterGoal, userId, profile?.nickname],
  );

  // Check DB cho report tuần này, nếu chưa có thì generate mới
  useEffect(() => {
    if (!userId || hasCheckedDBRef.current) return;
    hasCheckedDBRef.current = true;

    const weekStart = getWeekStartDate();
    const checkAndGenerate = async () => {
      // Kiểm tra cached local
      const cached = getCachedReport(weekStart);
      if (cached) {
        setReport(cached);
        return;
      }

      // Kiểm tra DB
      try {
        const { data } = await supabase
          .from('weekly_reports')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', weekStart)
          .maybeSingle();

        if (data) {
          // Chuyển từ DB record → WeeklyReport
          const dbReport: WeeklyReport = {
            weekStart: data.week_start,
            weekEnd: data.week_end,
            totalIntake: data.total_intake,
            avgDaily: Number(data.avg_daily),
            goalHitDays: data.goal_hit_days,
            totalDays: 7,
            bestDay: { date: data.best_day || '', ml: data.best_day_ml || 0 },
            worstDay: { date: data.worst_day || '', ml: data.worst_day_ml || 0 },
            trend: data.trend as WeeklyReport['trend'],
            insight: data.insight || '',
            tip: data.tip || '',
            comparisonToPreviousWeek: Number(data.comparison_to_previous_week) || 0,
            consistencyScore: data.consistency_score || 0,
          };
          setReport(dbReport);
          cacheReport(dbReport);
          return;
        }
      } catch {
        // ignore
      }

      // Chưa có → generate mới + lưu vào DB
      if (currentWeekLogs.length > 0) {
        const generated = await generateReport();
        if (generated) {
          // Lưu vào DB
          try {
            await supabase.from('weekly_reports').insert({
              user_id: userId,
              week_start: generated.weekStart,
              week_end: generated.weekEnd,
              total_intake: generated.totalIntake,
              avg_daily: generated.avgDaily,
              goal_hit_days: generated.goalHitDays,
              best_day: generated.bestDay.date,
              best_day_ml: generated.bestDay.ml,
              worst_day: generated.worstDay.date,
              worst_day_ml: generated.worstDay.ml,
              trend: generated.trend,
              insight: generated.insight,
              tip: generated.tip,
              comparison_to_previous_week: generated.comparisonToPreviousWeek,
              consistency_score: generated.consistencyScore,
            });
            setHasNewReport(true);
          } catch {
            // ignore — local cache vẫn hoạt động
          }
        }
      }
    };

    checkAndGenerate();
  }, [userId, currentWeekLogs, generateReport]);

  const dismissNewReport = useCallback(() => {
    setHasNewReport(false);
  }, []);

  const refreshReport = useCallback(() => {
    hasCheckedDBRef.current = false;
    setReport(null);
    generateReport(true);
  }, [generateReport]);

  const shareReport = useCallback(() => {
    if (!report) return;
    const text = formatReportForSharing(report);

    // Dùng Web Share API nếu available
    if (navigator.share) {
      navigator.share({ title: 'Báo cáo uống nước', text }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        toast('Đã copy báo cáo vào clipboard');
      }).catch(() => {});
    }
  }, [report]);

  return {
    report,
    isLoading,
    hasNewReport,
    dismissNewReport,
    refreshReport,
    shareReport,
  };
}

function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return toLocalISOString(monday);
}



