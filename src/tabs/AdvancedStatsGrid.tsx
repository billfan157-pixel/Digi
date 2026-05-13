import React from 'react';
import { Target, Droplets, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  avg: number;
  completed: number;
}

interface AdvancedStatsGridProps {
  weeklyTotal: number;
  monthlyTotal: number;
  stats: Stats;
  weeklyChartData: any[];
}

const AdvancedStatsGrid: React.FC<AdvancedStatsGridProps> = ({
  weeklyTotal,
  monthlyTotal,
  stats,
  weeklyChartData,
}) => {
  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  const metrics = [
    {
      label: 'Trung bình',
      value: stats.avg,
      unit: 'ml',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      label: 'Hoàn thành',
      value: completionRate,
      unit: '%',
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Tuần này',
      value: (weeklyTotal / 1000).toFixed(1),
      unit: 'L',
      icon: Droplets,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Tháng này',
      value: (monthlyTotal / 1000).toFixed(1),
      unit: 'L',
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 -mx-1">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="flex-1 min-w-[85px] glass-card p-3 flex flex-col items-center justify-center text-center border border-white/5"
        >
          <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
            <m.icon size={14} className={m.color} />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-black text-white tabular-nums tracking-tight">{m.value}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase">{m.unit}</span>
          </div>
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mt-0.5 whitespace-nowrap">
            {m.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default AdvancedStatsGrid;
