import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Crown, RefreshCw, Sparkles,
  TrendingUp, TrendingDown, CheckCircle2, Lock, Droplets,
  Activity, Zap, Calendar, ChevronRight, Award, Flame,
  Target, X
} from 'lucide-react';

interface ChartDay {
  label: string;
  intake: number;
  goal: number;
  isToday: boolean;
  fullDate?: string;
}

import type { WeeklyReport } from '@/lib/weeklyReportEngine';

type WeeklyReportWithBreakdown = WeeklyReport & {
  dailyBreakdown?: ChartDay[];
};

interface WeeklyReportCardProps {
  isPremium: boolean;
  report: WeeklyReportWithBreakdown | null;
  isLoading: boolean;
  onGenerate: () => void;
  onUpgrade: () => void;
  weeklyChartData?: Array<{ d: string; ml: number; isToday: boolean; fullDate?: string }>;
  waterGoal?: number;
  onSelectDay?: (dateStr: string, totalMl: number) => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface MiniProgressRingProps {
  percentage: number;
  colorClass?: string;
  size?: number;
  strokeWidth?: number;
}

function MiniProgressRing({ 
  percentage, 
  colorClass = 'text-cyan-400', 
  size = 32, 
  strokeWidth = 3.5 
}: MiniProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* Indicator circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          stroke="currentColor"
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-slate-300">
        {percentage}%
      </span>
    </div>
  );
}

export default function WeeklyReportCardUltimate({
  isPremium,
  report,
  isLoading,
  onGenerate,
  onUpgrade,
  weeklyChartData,
  waterGoal,
  onSelectDay,
}: WeeklyReportCardProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [modalTab, setModalTab] = useState<'insight' | 'tips'>('insight');
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  const handleOpenInsightModal = () => {
    setModalTab('insight');
    setShowInsightModal(true);
  };

  const getTrendDisplay = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': 
        return { 
          text: 'Cải thiện', 
          color: 'text-emerald-400', 
          bgColor: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10', 
          borderColor: 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
          icon: TrendingUp 
        };
      case 'declining': 
        return { 
          text: 'Sụt giảm', 
          color: 'text-orange-400', 
          bgColor: 'bg-gradient-to-r from-orange-500/10 to-amber-500/10', 
          borderColor: 'border-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
          icon: TrendingDown 
        };
      default: 
        return { 
          text: 'Ổn định', 
          color: 'text-cyan-400', 
          bgColor: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10', 
          borderColor: 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]',
          icon: Activity 
        };
    }
  };

  const trendDisplay = report ? getTrendDisplay(report.trend) : null;

  const chartData = useMemo<ChartDay[]>(() => {
    if (report?.dailyBreakdown && report.dailyBreakdown.length > 0) {
      return report.dailyBreakdown;
    }
    if (weeklyChartData && weeklyChartData.length > 0) {
      return weeklyChartData.map((item) => ({
        label: item.d,
        intake: item.ml,
        goal: waterGoal || 2000,
        isToday: item.isToday,
        fullDate: item.fullDate,
      }));
    }
    return [];
  }, [report, weeklyChartData, waterGoal]);

  const peakDayIndex = useMemo(() => {
    if (chartData.length === 0) return -1;
    let maxVal = -1;
    let maxIdx = -1;
    chartData.forEach((day, idx) => {
      if (day.intake > maxVal) {
        maxVal = day.intake;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [chartData]);

  const totalDays = report?.totalDays || 7;
  const goalHitPercentage = totalDays > 0 ? Math.round(((report?.goalHitDays || 0) / totalDays) * 100) : 0;
  
  const totalGoal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.goal, 0) || (waterGoal ? waterGoal * 7 : 14000);
  }, [chartData, waterGoal]);

  const totalPercentage = useMemo(() => {
    if (totalGoal === 0) return 0;
    return Math.min(Math.round(((report?.totalIntake || 0) / totalGoal) * 100), 100);
  }, [report?.totalIntake, totalGoal]);

  // ==========================================
  // LOCKED STATE (NON-PREMIUM)
  // ==========================================
  if (!isPremium) {
    return (
      <div className="glass-card min-h-[420px] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

        {/* Blurred teaser background */}
        <div className="absolute inset-0 z-0 select-none opacity-10 blur-2xl pointer-events-none" aria-hidden="true">
          <div className="p-6 space-y-4">
            <div className="h-8 w-1/3 rounded-xl bg-white/20" />
            <div className="h-32 w-full rounded-2xl bg-white/10" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 rounded-2xl bg-white/10" />
              <div className="h-28 rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>

        {/* Lock overlay content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 min-h-[420px]">
          
          {/* Lock icon with glow */}
          <div className="relative mb-6">
            <div className="absolute -inset-6 rounded-full bg-amber-500/20 blur-2xl animate-pulse" aria-hidden="true" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl glass-card-strong">
              <Lock size={32} className="text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]" aria-hidden="true" />
            </div>
          </div>
          
          {/* Premium badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
            <Crown size={12} className="text-amber-400" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Premium Only
            </span>
          </div>
          
          {/* Title & description */}
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
            Báo cáo tuần AI
          </h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-medium mb-8">
            Phân tích thói quen uống nước 7 ngày, xu hướng thể trạng và lộ trình cá nhân hóa từ AI Coach.
          </p>

          {/* Features list */}
          <div className="space-y-2.5 mb-8 w-full max-w-xs">
            {[
              { icon: BarChart3, text: 'Biểu đồ tiến độ 7 ngày' },
              { icon: Sparkles, text: 'Phân tích AI thông minh' },
              { icon: Target, text: 'Gợi ý cải thiện cá nhân' },
              { icon: Award, text: 'So sánh với tuần trước' }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-cyan-400" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* CTA button */}
          <motion.button
            type="button"
            onClick={onUpgrade}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-xs relative overflow-hidden rounded-xl p-[1px] group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            
            {/* Shimmer effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
            />

            <div className="relative flex h-12 items-center justify-center gap-2 rounded-[11px] bg-slate-950/90 backdrop-blur-md z-20">
              <Crown size={18} className="text-amber-400" aria-hidden="true" />
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-sm font-black uppercase tracking-wider text-transparent">
                Nâng cấp Premium
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PREMIUM STATE (UNLOCKED)
  // ==========================================
  return (
    <div className="glass-card relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="relative p-5 space-y-3">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-cyan-400" aria-hidden="true" />
              <h3 className="text-lg font-black text-white tracking-tight">
                Báo cáo tuần
              </h3>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {report ? `${formatDate(report.weekStart)} — ${formatDate(report.weekEnd)}` : 'Chưa có dữ liệu'}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-control flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
            aria-label="Refresh weekly report"
          >
            <RefreshCw 
              size={16} 
              className={`${isLoading ? 'animate-spin text-cyan-400' : 'text-white'}`}
              aria-hidden="true"
            />
          </motion.button>
        </div>

        {report ? (
          <>
            {/* Hero stats */}
            <div className="glass-stat p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Trung bình/ngày
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
                    {Math.round(report.avgDaily).toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-400">ml</span>
                </div>
              </div>

              {/* Trend badge */}
              {trendDisplay && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${trendDisplay.bgColor} ${trendDisplay.borderColor}`}>
                  <trendDisplay.icon size={16} className={trendDisplay.color} aria-hidden="true" />
                  <span className={`text-xs font-black uppercase tracking-wider ${trendDisplay.color}`}>
                    {trendDisplay.text}
                  </span>
                </div>
              )}
            </div>

            {/* Daily breakdown - 7 bars */}
            <div className="glass-card-strong p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-cyan-400" aria-hidden="true" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Tiến độ 7 ngày qua
                  </p>
                </div>
                {onSelectDay && (
                  <span className="text-[9px] text-slate-500 font-medium">
                    Chạm để xem nhật ký
                  </span>
                )}
              </div>
              
              <div className="w-full">
                {/* Bars Row */}
                <div className="relative h-32 flex items-end justify-between gap-3 px-1 mb-1">
                  {/* Glowing Target Line */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-cyan-500/25 z-10 pointer-events-none transition-all duration-300"
                    style={{ bottom: '80%' }}
                  >
                    <span className="absolute right-1 -top-2 text-[7px] font-bold bg-slate-950/80 text-cyan-400/80 px-1 py-0.5 rounded border border-cyan-500/10">
                      CHỈ TIÊU
                    </span>
                  </div>

                  {chartData.map((day, i) => {
                    const maxDisplayPercent = 125;
                    const percentage = (day.intake / day.goal) * 100;
                    const displayPercentage = Math.min(percentage, maxDisplayPercent);
                    const barHeightPercent = (displayPercentage / maxDisplayPercent) * 100;
                    const isGoalMet = percentage >= 100;
                    const isPeakDay = i === peakDayIndex;
                    const isToday = day.isToday;
                    
                    return (
                      <div 
                        key={i} 
                        className="flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer group"
                        onMouseEnter={() => setActiveTooltipIndex(i)}
                        onMouseLeave={() => setActiveTooltipIndex(null)}
                        onTouchStart={() => setActiveTooltipIndex(i)}
                        onTouchEnd={() => setActiveTooltipIndex(null)}
                        onClick={() => {
                          if (onSelectDay && day.fullDate) {
                            onSelectDay(day.fullDate, day.intake);
                          }
                        }}
                      >
                        {/* Background track capsule */}
                        <div className="absolute inset-x-0.5 top-0 bottom-0 bg-slate-950/40 border border-white/5 rounded-full pointer-events-none group-hover:bg-slate-950/60 transition-colors" />

                        {/* Bar fill */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(barHeightPercent, 6)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                          className={`absolute inset-x-0.5 bottom-0 rounded-full border border-white/5 transition-all duration-300 ${
                            isPeakDay
                              ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                              : isToday
                              ? 'bg-gradient-to-t from-cyan-600 via-sky-500 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                              : isGoalMet 
                              ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400' 
                              : 'bg-gradient-to-t from-slate-700 to-slate-600'
                          } group-hover:brightness-110`}
                        />

                        {/* Award Trophy Badge for Peak Day */}
                        {isPeakDay && (
                          <div className="absolute -top-3.5 z-10 pointer-events-none transition-transform group-hover:scale-110">
                            <Award 
                              size={12} 
                              className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-bounce"
                              style={{ animationDuration: '3s' }}
                              aria-hidden="true"
                            />
                          </div>
                        )}

                        {/* Custom Tooltip */}
                        <AnimatePresence>
                          {activeTooltipIndex === i && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 2, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-30 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-slate-950/95 border border-white/10 text-white p-2 rounded-xl text-[10px] shadow-2xl flex flex-col items-center gap-0.5 pointer-events-none backdrop-blur-md min-w-[80px]"
                            >
                              <span className="font-bold text-slate-400">
                                {isToday ? 'Hôm nay' : `Thứ ${day.label === 'CN' ? 'Nhật' : day.label.replace('T', '')}`}
                              </span>
                              <span className="font-black text-cyan-300">
                                {day.intake.toLocaleString()} ml
                              </span>
                              <span className="text-[8px] text-slate-500 font-bold">
                                Đạt {Math.round(percentage)}%
                              </span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-slate-950" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Labels Row */}
                <div className="flex justify-between gap-3 mt-3 w-full px-1">
                  {chartData.map((day, i) => {
                    const isToday = day.isToday;
                    const isPeak = i === peakDayIndex;
                    return (
                      <span 
                        key={i} 
                        className={`flex-1 text-center text-[10px] font-bold ${
                          isToday ? 'text-cyan-400' : isPeak ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {day.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick metrics grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Goal hit rate */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-stat p-3 cursor-pointer flex items-center justify-between gap-1"
                onClick={() => setExpandedMetric(expandedMetric === 'goal' ? null : 'goal')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Target size={10} className="text-emerald-400" aria-hidden="true" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Mục tiêu
                    </p>
                  </div>
                  <p className="text-xl font-black text-white leading-none">
                    {report?.goalHitDays || 0}
                    <span className="text-[10px] text-slate-500 font-bold ml-0.5">/{totalDays}</span>
                  </p>
                </div>
                <MiniProgressRing 
                  percentage={goalHitPercentage} 
                  colorClass="text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]" 
                />
              </motion.div>

              {/* Consistency */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-stat p-3 cursor-pointer flex items-center justify-between gap-1"
                onClick={() => setExpandedMetric(expandedMetric === 'consistency' ? null : 'consistency')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Flame size={10} className={(report?.consistencyScore || 0) >= 80 ? 'text-orange-400' : 'text-slate-400'} aria-hidden="true" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Đều đặn
                    </p>
                  </div>
                  <p className="text-xl font-black text-white leading-none">
                    {report?.consistencyScore || 0}
                    <span className="text-[10px] text-slate-500 font-bold ml-0.5">%</span>
                  </p>
                </div>
                <MiniProgressRing 
                  percentage={report?.consistencyScore || 0} 
                  colorClass={(report?.consistencyScore || 0) >= 80 ? 'text-orange-400 drop-shadow-[0_0_4px_rgba(249,115,22,0.3)]' : 'text-slate-400'} 
                />
              </motion.div>

              {/* Total volume */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-stat p-3 cursor-pointer flex items-center justify-between gap-1"
                onClick={() => setExpandedMetric(expandedMetric === 'total' ? null : 'total')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Droplets size={10} className="text-cyan-400" aria-hidden="true" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Tổng nạp
                    </p>
                  </div>
                  <p className="text-xl font-black text-white leading-none">
                    {((report?.totalIntake || 0) / 1000).toFixed(1)}
                    <span className="text-[10px] text-slate-500 font-bold ml-0.5">L</span>
                  </p>
                </div>
                <MiniProgressRing 
                  percentage={totalPercentage} 
                  colorClass="text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]" 
                />
              </motion.div>
            </div>

            {/* Comparison with previous week */}
            {report.comparisonToPreviousWeek !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  report.comparisonToPreviousWeek > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {report.comparisonToPreviousWeek > 0 ? (
                    <TrendingUp size={16} className="text-emerald-400" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={16} className="text-orange-400" aria-hidden="true" />
                  )}
                  <span className={`text-sm font-bold ${
                    report.comparisonToPreviousWeek > 0 ? 'text-emerald-400' : 'text-orange-400'
                  }`}>
                    {report.comparisonToPreviousWeek > 0 ? 'Tăng' : 'Giảm'}{' '}
                    {Math.abs(report.comparisonToPreviousWeek)}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    so với tuần trước
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
              </motion.div>
            )}

            {/* AI Insight - Compact with View Details button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={handleOpenInsightModal}
              className="glass-card-strong relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" aria-hidden="true" />

              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Sparkles size={18} className="text-cyan-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={12} className="text-cyan-400 animate-pulse" aria-hidden="true" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                        AI Coach
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {report.insight}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
              </div>
            </motion.div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl glass-card-strong flex items-center justify-center mb-4"
            >
              <BarChart3 size={28} className="text-slate-400" aria-hidden="true" />
            </motion.div>
            <h4 className="text-lg font-black text-white mb-2">
              Chưa có dữ liệu
            </h4>
            <p className="text-sm text-slate-400 max-w-[220px] leading-relaxed mb-6">
              Uống nước đều đặn trong tuần để DigiCoach tạo báo cáo cho bạn.
            </p>
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="glass-control px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
              <span className="text-sm font-bold">
                {isLoading ? 'Đang tạo...' : 'Tạo báo cáo'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Insight Modal */}
      <AnimatePresence>
        {showInsightModal && report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInsightModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card-strong max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowInsightModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg glass-control flex items-center justify-center"
                aria-label="Close"
              >
                <X size={16} className="text-slate-400" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Sparkles size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Phân tích AI Coach</h3>
                  <p className="text-xs text-slate-400">
                    {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
                  </p>
                </div>
              </div>

              {/* Tab Selector if report.tip exists */}
              {report.tip && (
                <div className="flex p-0.5 bg-slate-950/60 rounded-xl mb-4 border border-white/5">
                  <button
                    onClick={() => setModalTab('insight')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      modalTab === 'insight'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Nhận định
                  </button>
                  <button
                    onClick={() => setModalTab('tips')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      modalTab === 'tips'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Khuyến nghị
                  </button>
                </div>
              )}

              {/* Insight content */}
              <div className="space-y-4">
                {(!report.tip || modalTab === 'insight') ? (
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 relative overflow-hidden min-h-[140px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Sparkles size={100} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Zap size={14} className="text-cyan-400 animate-pulse" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                        Nhận định tuần qua
                      </h4>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed relative z-10 font-medium">
                      {report.insight}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={14} className="text-emerald-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        Khuyến nghị từ Coach
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {report.tip.split('. ').map((sentence: string, idx: number) => {
                        const clean = sentence.trim();
                        if (!clean) return null;
                        return (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                              <CheckCircle2 size={8} />
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">{clean}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowInsightModal(false)}
                  className="w-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 active:scale-95 transition-all py-3 rounded-xl font-bold text-sm"
                >
                  Đã hiểu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}