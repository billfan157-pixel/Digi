import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart2, Lock, Crown } from 'lucide-react';
import CalendarView from '../../components/insight/CalendarView';
import HourlyHeatmap from '../../components/HourlyHeatmap';
import AdvancedStatsGrid from '../AdvancedStatsGrid';
import WeeklyChart from '../../components/WeeklyChart';
import BehaviorInsightCards from './BehaviorInsightCards';

interface AnalyticsSectionProps {
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
  timeRange: 'week' | 'month';
  setTimeRange: (range: 'week' | 'month') => void;
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
  monthlyTotal: number;
  stats: { avg: number; completed: number };
  profile: { id?: string } | null;
  weeklyTotal: number;
  patterns: Array<Record<string, unknown>>;
}

export default function AnalyticsSection({
  isPremium,
  setShowPremiumModal,
  timeRange,
  setTimeRange,
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
  monthlyTotal,
  stats,
  profile,
  weeklyTotal,
  patterns,
}: AnalyticsSectionProps) {
  return (
    <div className="mb-20 mt-2 space-y-8 pb-10">
      {/* Header & Range Picker */}
      <div className="px-6 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <BarChart2 size={16} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Hành trình</h3>
        </div>
        
        <div className="glass-control relative flex p-1 shadow-sm border border-white/5 bg-slate-900/40">
          {(['week', 'month'] as const).map((t) => {
            const isActive = timeRange === t;
            return (
              <button 
                key={t}
                onClick={() => setTimeRange(t)}
                className={`relative px-5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${isActive ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="timeRangeIndicator"
                    className="absolute inset-0 active-treatment rounded-lg -z-10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                {t === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chart Section */}
      <section className="px-6">
        {timeRange === 'month' && (
          <div className="flex justify-between items-center mb-4 bg-slate-900/40 rounded-2xl p-1.5 border border-white/5">
            <button onClick={handlePrevMonth} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{currentMonthName}</span>
            <button onClick={handleNextMonth} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {isPremium ? (
          <AnimatePresence mode="wait">
            {timeRange === 'week' ? (
              <motion.div
                key="week-chart"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <WeeklyChart 
                  weeklyChartData={weeklyChartData}
                  waterGoal={waterGoal}
                  selectedWeekDay={selectedWeekDay}
                  onSelectDay={setSelectedWeekDay}
                  previousWeekData={previousWeekData as import('@/features/hydration/useWeeklyHistory').WeeklyHistoryPoint[] | undefined}
                />
              </motion.div>
            ) : (
              <motion.div
                key="month-chart"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <CalendarView 
                  calendarCells={calendarCells}
                  currentMonthName={currentMonthName}
                  waterGoal={waterGoal}
                  selectedCell={selectedCalendarCell}
                  onSelectCell={setSelectedCalendarCell}
                  onDayClick={handleDayClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="opacity-30 blur-[2px] pointer-events-none p-6 flex items-center justify-center h-48 bg-slate-900/60">
              <BarChart2 size={48} className="text-slate-600" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Lock size={20} className="text-amber-400" />
              <span className="text-xs font-bold text-slate-400">Biểu đồ chi tiết dành cho Premium</span>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 active:scale-95 transition-all"
              >
                <Crown size={14} />
                Nâng cấp ngay
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Behavior Insights Section */}
      {patterns.length > 0 && (
        <section className="px-6">
          {isPremium ? (
            <BehaviorInsightCards patterns={patterns as unknown as import('@/hooks/useBehaviorAnalysis').BehaviorPattern[]} />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
              <div className="opacity-30 blur-[2px] pointer-events-none">
                <BehaviorInsightCards patterns={patterns as unknown as import('@/hooks/useBehaviorAnalysis').BehaviorPattern[]} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Lock size={20} className="text-amber-400" />
                <span className="text-xs font-bold text-slate-400">Phân tích thói quen chỉ dành cho Premium</span>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 active:scale-95 transition-all"
                >
                  <Crown size={14} />
                  Nâng cấp ngay
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Quick Stats Section */}
      <section className="px-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={14} className="text-cyan-400" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tổng quan nhanh</h4>
        </div>
        <AdvancedStatsGrid 
          weeklyTotal={weeklyTotal}
          monthlyTotal={monthlyTotal}
          stats={stats}
          weeklyChartData={weeklyChartData}
        />
      </section>

      {/* Heatmap Section */}
      <section className="px-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} className="text-cyan-400" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tần suất uống (giờ)</h4>
        </div>
        {isPremium ? (
          <HourlyHeatmap userId={profile?.id} />
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="opacity-30 blur-[2px] pointer-events-none p-6 flex items-center justify-center h-32 bg-slate-900/60">
              <BarChart2 size={36} className="text-slate-600" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Lock size={20} className="text-amber-400" />
              <span className="text-xs font-bold text-slate-400">Heatmap chỉ dành cho Premium</span>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 active:scale-95 transition-all"
              >
                <Crown size={14} />
                Nâng cấp ngay
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
