import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, TrendingUp, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { glassCard, activeTabClass } from '../../styles/glass';
import type { UserHydrationPattern } from '../../lib/patternEngine';
import type { WeeklyReport } from '../../lib/weeklyReportEngine';
import WeeklyReportCard from '../ui/WeeklyReportCard';
import AdvancedAnalyticsTabs from './AdvancedAnalyticsTabs';
import CalendarView from './CalendarView';
import BehaviorInsightCards from '../../tabs/Insight/BehaviorInsightCards';
import EmptyAnalyticsState from './EmptyAnalyticsState';

const HourlyHeatmap = lazy(() => import('../HourlyHeatmap'));

type TabId = 'overview' | 'history' | 'advanced';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Weekly Report', icon: BarChart2 },
  { id: 'history', label: 'Monthly History', icon: Calendar },
  { id: 'advanced', label: 'Advanced', icon: TrendingUp },
];

interface AnalyticsTabsProps {
  isPremium: boolean;
  onUpgrade: () => void;
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean }>;
  previousWeekData: Array<{ d: string; ml: number }> | null;
  waterGoal: number;
  streak: number;
  weeklyReport: WeeklyReport | null;
  isWeeklyReportLoading: boolean;
  generateWeeklyReport: () => void;
  hydrationPattern: UserHydrationPattern | null;
  patterns: Array<{ pattern: string; type: string; insight: string }>;
  calendarDate: Date;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  calendarCells: Array<{ dayNum: number | null; ml: number; isFuture: boolean; isToday: boolean; isEmptySlot: boolean; fullDate: string }>;
  currentMonthName: string;
  selectedWeekDay: { d: string; ml: number } | null;
  setSelectedWeekDay: (day: { d: string; ml: number } | null) => void;
  selectedCalendarCell: { dayNum: number; ml: number; fullDate: string } | null;
  setSelectedCalendarCell: (cell: { dayNum: number; ml: number; fullDate: string } | null) => void;
  handleDayClick: (dateStr: string, totalMl: number) => void;
  profile: { id?: string; sleep_hours?: number; sleep_quality?: number } | null;
  stats: { avg: number; completed: number };
  completionRate: number;
  daysInWeek: number;
}

export default function AnalyticsTabs(props: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      <div className="glass-control relative flex p-1 shadow-sm border border-white/5 bg-slate-900/40 rounded-[var(--theme-border-radius-inner,12px)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${
                isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="analyticsTabIndicator"
                  className={activeTabClass}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <OverviewContent {...props} />
          </motion.div>
        )}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryContent
              handlePrevMonth={props.handlePrevMonth}
              handleNextMonth={props.handleNextMonth}
              calendarCells={props.calendarCells}
              currentMonthName={props.currentMonthName}
              waterGoal={props.waterGoal}
              selectedCalendarCell={props.selectedCalendarCell}
              setSelectedCalendarCell={props.setSelectedCalendarCell}
              handleDayClick={props.handleDayClick}
            />
          </motion.div>
        )}
        {activeTab === 'advanced' && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <AdvancedContent
              weeklyChartData={props.weeklyChartData}
              previousWeekData={props.previousWeekData}
              waterGoal={props.waterGoal}
              streak={props.streak}
              userId={props.profile?.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview sub-tab ──────────────────────────────────────────

function OverviewContent({
  isPremium,
  weeklyReport,
  isWeeklyReportLoading,
  generateWeeklyReport,
  hydrationPattern,
  patterns,
  waterGoal,
  weeklyChartData,
  onUpgrade,
  handleDayClick,
}: {
  isPremium: boolean;
  weeklyReport: WeeklyReport | null;
  isWeeklyReportLoading: boolean;
  generateWeeklyReport: () => void;
  hydrationPattern: UserHydrationPattern | null;
  patterns: Array<{ pattern: string; type: string; insight: string }>;
  waterGoal: number;
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean }>;
  onUpgrade: () => void;
  handleDayClick: (dateStr: string, totalMl: number) => void;
}) {
  return (
    <>
      <WeeklyReportCard
        isPremium={isPremium}
        report={weeklyReport}
        isLoading={isWeeklyReportLoading}
        onGenerate={generateWeeklyReport}
        onUpgrade={onUpgrade}
        weeklyChartData={weeklyChartData}
        waterGoal={waterGoal}
        onSelectDay={handleDayClick}
      />

      {patterns.length > 0 && (
        <BehaviorInsightCards
          patterns={patterns.map(p => ({
            pattern: p.pattern,
            confidence: 0.8,
            recommendation: p.insight
          }))}
          hydrationPattern={hydrationPattern}
        />
      )}
    </>
  );
}

// ─── History sub-tab ──────────────────────────────────────────

function HistoryContent({
  handlePrevMonth,
  handleNextMonth,
  calendarCells,
  currentMonthName,
  waterGoal,
  selectedCalendarCell,
  setSelectedCalendarCell,
  handleDayClick,
}: {
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  calendarCells: Array<{ dayNum: number | null; ml: number; isFuture: boolean; isToday: boolean; isEmptySlot: boolean; fullDate: string }>;
  currentMonthName: string;
  waterGoal: number;
  selectedCalendarCell: { dayNum: number; ml: number; fullDate: string } | null;
  setSelectedCalendarCell: (cell: { dayNum: number; ml: number; fullDate: string } | null) => void;
  handleDayClick: (dateStr: string, totalMl: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 rounded-[var(--theme-border-radius-inner,12px)] p-1.5 border border-white/5">
        <button onClick={handlePrevMonth} className="w-9 h-9 rounded-[var(--theme-border-radius-inner,8px)] bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{currentMonthName}</span>
        <button onClick={handleNextMonth} className="w-9 h-9 rounded-[var(--theme-border-radius-inner,8px)] bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      <CalendarView
        calendarCells={calendarCells}
        currentMonthName={currentMonthName}
        waterGoal={waterGoal}
        selectedCell={selectedCalendarCell}
        onSelectCell={setSelectedCalendarCell}
        onDayClick={handleDayClick}
      />
    </div>
  );
}

// ─── Advanced sub-tab ────────────────────────────────────────────

function AdvancedContent({
  weeklyChartData,
  previousWeekData,
  waterGoal,
  streak,
  userId,
}: {
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean }>;
  previousWeekData: Array<{ d: string; ml: number }> | null;
  waterGoal: number;
  streak: number;
  userId?: string;
}) {
  if (weeklyChartData.length < 3) {
    return <EmptyAnalyticsState dataDays={weeklyChartData.length} minDays={3} />;
  }

  return (
    <div className="space-y-6">
      <AdvancedAnalyticsTabs
        weeklyChartData={weeklyChartData}
        previousWeekData={previousWeekData}
        waterGoal={waterGoal}
        currentStreak={streak}
      />

      <div className={`${glassCard} p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-cyan-400" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tần suất uống (giờ)</h4>
        </div>
        <Suspense fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading heatmap...</p>
            </div>
          </div>
        }>
          <HourlyHeatmap userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
