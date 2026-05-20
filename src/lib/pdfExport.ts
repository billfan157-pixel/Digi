import type { Profile } from '@/models';
import { exportDetailedPDF } from './exportUtils';

type ExportHealthReportParams = {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  progress: number;
  isWatchConnected: boolean;
  watchData?: { heartRate?: number; steps?: number } | null;
};

export async function exportHealthReportPDF(params: ExportHealthReportParams) {
  const { profile, waterIntake, waterGoal, streak, isWatchConnected, watchData } = params;

  await exportDetailedPDF({
    profile,
    waterIntake,
    waterGoal,
    streak,
    weeklyChartData: [],
    waterEntries: [],
    avgWeekly: 0,
    completionRate: Math.round((waterIntake / waterGoal) * 100),
    isWatchConnected,
    watchData,
  });
}
