import React from 'react';
import { Target, Droplets, TrendingUp, Calendar } from 'lucide-react';

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

export const AdvancedStatsGrid: React.FC<AdvancedStatsGridProps> = ({
  weeklyTotal,
  monthlyTotal,
  stats,
  weeklyChartData
}) => {
  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 px-6 mt-6">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <TrendingUp size={14} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{stats.avg} <span className="text-xs text-slate-500 font-bold">ml</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Trung bình tuần</p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Target size={14} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{completionRate}<span className="text-xs text-slate-500 font-bold">%</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Hoàn thành</p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Droplets size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{weeklyTotal} <span className="text-xs text-slate-500 font-bold">ml</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Tổng tuần</p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
          <Calendar size={14} className="text-purple-400" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{monthlyTotal} <span className="text-xs text-slate-500 font-bold">ml</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Tổng tháng</p>
        </div>
      </div>
    </div>
  );
};