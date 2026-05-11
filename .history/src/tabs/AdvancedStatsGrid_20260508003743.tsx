import React from 'react';
import { Target, Droplets, TrendingUp, Calendar, Zap, Medal } from 'lucide-react';
import type { Profile } from '../models';

interface Stats {
  avg: number;
  completed: number;
}

interface AdvancedStatsGridProps {
  weeklyTotal: number;
  monthlyTotal: number;
  stats: Stats;
  weeklyChartData: any[];
  profile?: Profile | null;
}

export const AdvancedStatsGrid: React.FC<AdvancedStatsGridProps> = ({
  weeklyTotal,
  monthlyTotal,
  stats,
  weeklyChartData,
  profile
}) => {
  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  return (
    <div className="grid grid-cols-2 gap-3">
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

      {profile && (
        <div className="col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
            <Medal size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Cấp độ & Thành tích</p>
            <p className="text-lg font-black text-white">Level {profile.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wellness Points</p>
            <p className="text-xl font-black text-amber-400 flex items-center justify-end gap-1">
              <Zap size={14} /> {profile.total_wp?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};