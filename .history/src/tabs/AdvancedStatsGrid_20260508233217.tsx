import React from 'react';
import { Target, Droplets, TrendingUp, Calendar, Activity, ShieldCheck, Award, Flame, BarChart3 } from 'lucide-react';
import { Target, Droplets, TrendingUp, Calendar, Activity, ShieldCheck } from 'lucide-react';
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
  waterGoal?: number;
}

export const AdvancedStatsGrid: React.FC<AdvancedStatsGridProps> = ({
const AdvancedStatsGrid: React.FC<AdvancedStatsGridProps> = ({
  weeklyTotal,
  monthlyTotal,
  stats,
  weeklyChartData,
  profile,
  waterGoal = 2000,
  profile
}) => {
  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);
  
  const consistencyScore = weeklyChartData.length > 0 
    ? Math.round((weeklyChartData.filter(d => d.ml > 0).length / weeklyChartData.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <TrendingUp size={14} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.avg} <span className="text-xs text-slate-500 font-bold">ml</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Trung bình tuần</p>
          </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <TrendingUp size={14} className="text-cyan-400" />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Target size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{completionRate}<span className="text-xs text-slate-500 font-bold">%</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Hoàn thành</p>
          </div>
        <div>
          <p className="text-2xl font-black text-white">{stats.avg} <span className="text-xs text-slate-500 font-bold">ml</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Trung bình tuần</p>
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
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Target size={14} className="text-emerald-400" />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Calendar size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{monthlyTotal} <span className="text-xs text-slate-500 font-bold">ml</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Tổng tháng</p>
          </div>
        <div>
          <p className="text-2xl font-black text-white">{completionRate}<span className="text-xs text-slate-500 font-bold">%</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Hoàn thành</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Flame size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{consistencyScore}<span className="text-xs text-slate-500 font-bold">%</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Nhất quán</p>
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
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <BarChart3 size={14} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">--</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Tiến độ streak</p>
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
        <div className="col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-sm group hover:bg-slate-800/60 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck size={24} className="text-emerald-400" />
          </div>
          <div className="flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cấp độ hiện tại</p>
          <p className="text-lg font-black text-white">Level {profile.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Điểm sức khỏe</p>
            <p className="text-xl font-black text-emerald-400 flex items-center justify-end gap-1">
              <Activity size={16} /> {profile.wp?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
          <Award size={16} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-[9px] text-slate-400 uppercase font-bold">Ngày tốt nhất</p>
          <p className="text-sm font-black text-white">{weeklyChartData.length > 0 ? Math.max(...weeklyChartData.map((d: any) => d.ml)) : 0}ml</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
          <Droplets size={16} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-[9px] text-slate-400 uppercase font-bold">Mục tiêu/ngày</p>
          <p className="text-sm font-black text-white">{waterGoal}ml</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
          <Flame size={16} className="text-amber-400 mx-auto mb-1" />
          <p className="text-[9px] text-slate-400 uppercase font-bold">Chuỗi hiện tại</p>
          <p className="text-sm font-black text-white">-- ngày</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatsGrid;