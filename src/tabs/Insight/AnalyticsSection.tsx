import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart2, Lock, Crown, Sparkles, Target, CheckCircle2, Flame, Droplets, TrendingUp, HeartPulse, Moon } from 'lucide-react';
import CalendarView from '../../components/insight/CalendarView';
import HourlyHeatmap from '../../components/HourlyHeatmap';
import WeeklyChart from '../../components/WeeklyChart';
import BehaviorInsightCards from './BehaviorInsightCards';
import ContextInsightCard from '../../components/insight/ContextInsightCard';
import { useBehaviorAnalysis } from '@/hooks/useBehaviorAnalysis';
import { useContextAwareInsights } from '@/hooks/useContextAwareInsights';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { CalendarEventItem } from '@/hooks/useCalendarSync';

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
  stats: { avg: number; completed: number };
  profile: { id?: string; sleep_hours?: number; sleep_quality?: number } | null;
  streak: number;
  completionRate: number;
  calendarEvents: CalendarEventItem[];
  weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null | undefined;
  isWeatherSynced: boolean;
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
  stats,
  profile,
  streak,
  completionRate,
  calendarEvents,
  weatherData,
  isWeatherSynced,
}: AnalyticsSectionProps) {
  const daysInWeek = weeklyChartData.length || 7;
  const waterIntake = weeklyChartData.length > 0 ? weeklyChartData[weeklyChartData.length - 1].ml : 0;

  const { patterns } = useBehaviorAnalysis({ weeklyData: weeklyChartData, waterGoal });

  const { insights: correlationInsights } = useWellnessData();

  const { insights: contextInsights, calendarRiskScore, weatherAdjustment } = useContextAwareInsights({
    weeklyData: weeklyChartData,
    waterGoal,
    waterIntake,
    calendarEvents,
    isCalendarSynced: calendarEvents.length > 0,
    weatherData: weatherData ?? null,
    isWeatherSynced,
    sleepHours: profile?.sleep_hours ?? 0,
    sleepQuality: profile?.sleep_quality ?? 0,
  });

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
      
      {/* Context-Aware Insights */}
      {contextInsights.length > 0 && (
        <section className="px-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-cyan-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Insight theo ngữ cảnh
            </h4>
            {(calendarRiskScore > 0.5 || weatherAdjustment > 0) && (
              <div className="ml-auto flex gap-1.5">
                {calendarRiskScore > 0.5 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    Lịch bận
                  </span>
                )}
                {weatherAdjustment > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    +{weatherAdjustment}ml
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2.5">
            {contextInsights.slice(0, 4).map((insight, i) => (
              <ContextInsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </div>
        </section>
      )}
      
      {/* Correlation Insights */}
      {correlationInsights.length > 0 && (
        <section className="px-6">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={14} className="text-rose-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Tương quan sức khỏe
            </h4>
          </div>
          <div className="space-y-2.5">
            {correlationInsights.map((corr, i) => {
              const isSleep = corr.type === 'hydration_sleep';
              const colors = isSleep
                ? { bg: 'bg-indigo-500/8', border: 'border-indigo-500/20', text: 'text-indigo-400', iconBg: 'bg-indigo-500/15' }
                : { bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/15' };
              const strength = Math.abs(corr.strength);
              const strengthLabel = strength > 0.7 ? 'Mạnh' : strength > 0.5 ? 'TB' : 'Yếu';
              const Icon = isSleep ? Moon : Sparkles;

              return (
                <motion.div
                  key={corr.type}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={colors.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>
                          {isSleep ? 'Hydration ↔ Giấc ngủ' : 'Hydration ↔ Tâm trạng'}
                        </span>
                        <span className={`text-[9px] font-bold ${strength > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          r = {corr.strength.toFixed(2)} ({strengthLabel})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{corr.insight}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 italic">{corr.recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
      
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
          <div className="space-y-3">
            {/* Summary Card - free user sees this */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Target size={14} className="text-cyan-400" />
                </div>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Tổng quan tuần này</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-lg font-black text-white">{stats.completed}/{daysInWeek}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ngày đạt mục tiêu</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <Flame size={18} className="text-orange-400 shrink-0" />
                  <div>
                    <p className="text-lg font-black text-white">{streak}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Streak hiện tại</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <Droplets size={18} className="text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-lg font-black text-white">{stats.avg.toLocaleString('vi-VN')}ml</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Trung bình / ngày</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <TrendingUp size={18} className="text-violet-400 shrink-0" />
                  <div>
                    <p className="text-lg font-black text-white">{completionRate}%</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tỉ lệ hoàn thành</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart placeholder - premium upsell */}
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
          </div>
        )}
      </section>

      {/* Behavior Insights Section */}
      {patterns.length > 0 && (
        <section className="px-6">
          {isPremium ? (
            <BehaviorInsightCards patterns={patterns} />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50">
              <div className="opacity-30 blur-[2px] pointer-events-none p-6 flex items-center justify-center h-48 bg-slate-900/60">
                <BehaviorInsightCards patterns={patterns} />
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
