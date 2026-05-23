import { motion } from 'framer-motion';
import { BarChart2, Flame, TrendingUp } from 'lucide-react';
import type { UserHydrationPattern } from '../../lib/patternEngine';
import type { WeeklyReport } from '../../lib/weeklyReportEngine';
import AnalyticsTabs from '../../components/insight/AnalyticsTabs';
import EmptyAnalyticsState from '../../components/insight/EmptyAnalyticsState';
import PremiumGate from '../../components/ui/PremiumGate';
import { glassMetric } from '../../styles/glass';
import { useBehaviorAnalysis } from '@/hooks/useBehaviorAnalysis';

interface AnalyticsSectionProps {
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
  calendarDate: Date;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  calendarCells: Array<{ dayNum: number | null; ml: number; isFuture: boolean; isToday: boolean; isEmptySlot: boolean; fullDate: string }>;
  currentMonthName: string;
  waterGoal: number;
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean }>;
  previousWeekData: Array<{ d: string; ml: number }> | null;
  selectedWeekDay: { d: string; ml: number } | null;
  setSelectedWeekDay: (day: { d: string; ml: number } | null) => void;
  selectedCalendarCell: { dayNum: number; ml: number; fullDate: string } | null;
  setSelectedCalendarCell: (cell: { dayNum: number; ml: number; fullDate: string } | null) => void;
  handleDayClick: (dateStr: string, totalMl: number) => void;
  stats: { avg: number; completed: number };
  profile: { id?: string; sleep_hours?: number; sleep_quality?: number } | null;
  streak: number;
  completionRate: number;
  weeklyReport: WeeklyReport | null;
  isWeeklyReportLoading: boolean;
  generateWeeklyReport: () => void;
  hydrationPattern?: UserHydrationPattern | null;
}

export default function AnalyticsSection({
  isPremium,
  setShowPremiumModal,
  calendarDate,
  handlePrevMonth,
  handleNextMonth,
  calendarCells,
  currentMonthName,
  waterGoal,
  weeklyChartData,
  previousWeekData,
  selectedWeekDay,
  setSelectedWeekDay,
  selectedCalendarCell,
  setSelectedCalendarCell,
  handleDayClick,
  stats,
  profile,
  streak,
  completionRate,
  weeklyReport,
  isWeeklyReportLoading,
  generateWeeklyReport,
  hydrationPattern,
}: AnalyticsSectionProps) {
  const daysInWeek = weeklyChartData.length || 7;
  const { patterns } = useBehaviorAnalysis({ weeklyData: weeklyChartData, waterGoal });
  const hasData = weeklyChartData.some(d => d.ml > 0);
  return (
    <div className="mb-20 mt-2 space-y-4 pb-10">
      {/* Header & Range Picker */}
      <div className="px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <BarChart2 size={16} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight leading-none">Phân tích</h3>
            {/* Quick Stats inline subtext */}
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-[10px] font-bold text-orange-400 flex items-center gap-0.5">
                <Flame size={10} /> {streak} ngày
              </span>
              <span className="text-[10px] font-bold text-violet-400 flex items-center gap-0.5">
                <TrendingUp size={10} /> {completionRate}% đạt
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Empty state for new users */}
      {!hasData && (
        <section className="px-6">
          <EmptyAnalyticsState dataDays={weeklyChartData.filter(d => d.ml > 0).length} />
        </section>
      )}

      {/* Premium-gated analytics content */}
      <section className="px-6">
        <PremiumGate
          isPremium={isPremium}
          onUpgrade={() => setShowPremiumModal(true)}
          title="Phân tích chuyên sâu"
          description="Khám phá thói quen, xu hướng và biểu đồ chi tiết về sức khỏe của bạn."
        >
          <AnalyticsTabs
            isPremium={isPremium}
            onUpgrade={() => setShowPremiumModal(true)}
            profile={profile}
            weeklyChartData={weeklyChartData}
            previousWeekData={previousWeekData}
            waterGoal={waterGoal}
            streak={streak}
            weeklyReport={weeklyReport}
            isWeeklyReportLoading={isWeeklyReportLoading}
            generateWeeklyReport={generateWeeklyReport}
            hydrationPattern={hydrationPattern || null}
            patterns={patterns.map(p => ({
              pattern: p.pattern,
              type: 'insight',
              insight: p.recommendation
            }))}
            calendarDate={calendarDate}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            calendarCells={calendarCells}
            currentMonthName={currentMonthName}
            selectedWeekDay={selectedWeekDay}
            setSelectedWeekDay={setSelectedWeekDay}
            selectedCalendarCell={selectedCalendarCell}
            setSelectedCalendarCell={setSelectedCalendarCell}
            handleDayClick={handleDayClick}
            stats={stats}
            completionRate={completionRate}
            daysInWeek={daysInWeek}
          />
        </PremiumGate>
      </section>
    </div>
  );
}
