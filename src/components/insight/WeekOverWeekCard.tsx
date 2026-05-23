import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Droplets, Target, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { glassCard, glassInner } from '../../styles/glass';

interface WeekOverWeekCardProps {
  currentWeek: { d: string; ml: number }[];
  previousWeek: { d: string; ml: number }[];
  waterGoal: number;
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-slate-500 text-xs font-bold">—</span>;
  const isPositive = value > 0;
  return (
    <span className={`text-xs font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
}

export const WeekOverWeekCard = memo(function WeekOverWeekCard({
  currentWeek,
  previousWeek,
  waterGoal,
}: WeekOverWeekCardProps) {
  const comparison = useMemo(() => {
    const curTotal = currentWeek.reduce((s, d) => s + d.ml, 0);
    const prevTotal = previousWeek.reduce((s, d) => s + d.ml, 0);
    const curAvg = currentWeek.length > 0 ? Math.round(curTotal / currentWeek.length) : 0;
    const prevAvg = previousWeek.length > 0 ? Math.round(prevTotal / previousWeek.length) : 0;
    const avgDelta = prevAvg > 0 ? Math.round(((curAvg - prevAvg) / prevAvg) * 100) : 0;

    const curCompleted = currentWeek.filter(d => d.ml >= waterGoal).length;
    const prevCompleted = previousWeek.filter(d => d.ml >= waterGoal).length;
    const completedDelta = curCompleted - prevCompleted;

    const curBestDay = currentWeek.reduce((max, d) => d.ml > max ? d.ml : max, 0);
    const prevBestDay = previousWeek.reduce((max, d) => d.ml > max ? d.ml : max, 0);
    const bestDayDelta = prevBestDay > 0 ? Math.round(((curBestDay - prevBestDay) / prevBestDay) * 100) : 0;

    const trend: 'up' | 'down' | 'stable' = avgDelta > 5 ? 'up' : avgDelta < -5 ? 'down' : 'stable';

    return { curAvg, prevAvg, avgDelta, curCompleted, prevCompleted, completedDelta, curBestDay, prevBestDay, bestDayDelta, trend };
  }, [currentWeek, previousWeek, waterGoal]);

  if (previousWeek.length === 0) return null;

  const TrendIcon = comparison.trend === 'up' ? TrendingUp : comparison.trend === 'down' ? TrendingDown : Minus;
  const trendColor = comparison.trend === 'up' ? 'text-emerald-400' : comparison.trend === 'down' ? 'text-rose-400' : 'text-slate-400';
  const trendBg = comparison.trend === 'up' ? 'bg-emerald-500/10 border-emerald-500/20' : comparison.trend === 'down' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${glassCard} p-5`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${trendBg} border flex items-center justify-center`}>
            <TrendIcon size={16} className={trendColor} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            So với tuần trước
          </span>
        </div>
        <DeltaBadge value={comparison.avgDelta} suffix="%" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`${glassInner} p-3 text-center`}>
          <Droplets size={14} className="text-cyan-400 mx-auto mb-1.5" />
          <p className="text-white font-black text-sm">{comparison.curAvg.toLocaleString('vi-VN')}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">TB/ngày</p>
          <DeltaBadge value={comparison.avgDelta} suffix="%" />
        </div>
        <div className={`${glassInner} p-3 text-center`}>
          <Target size={14} className="text-violet-400 mx-auto mb-1.5" />
          <p className="text-white font-black text-sm">{comparison.curCompleted}/{currentWeek.length}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Đạt mục tiêu</p>
          <DeltaBadge value={comparison.completedDelta} suffix=" ngày" />
        </div>
        <div className={`${glassInner} p-3 text-center`}>
          <Flame size={14} className="text-amber-400 mx-auto mb-1.5" />
          <p className="text-white font-black text-sm">{comparison.curBestDay.toLocaleString('vi-VN')}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Ngày cao nhất</p>
          <DeltaBadge value={comparison.bestDayDelta} suffix="%" />
        </div>
      </div>
    </motion.div>
  );
});
