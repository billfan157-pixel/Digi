import React from 'react';
import { Activity, Trophy, Flame } from 'lucide-react';
import CountUp from '../../components/CountUp';

interface ArenaStatsHeroProps {
  winRate: number;
  wins: number;
  losses: number;
  rank: number;
  rating: number;
}

const ArenaStatsHero: React.FC<ArenaStatsHeroProps> = ({ winRate, wins, losses, rank, rating }) => {
  return (
    <div className="px-5 mb-8 grid grid-cols-2 gap-4">
      {/* Win Rate Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl group hover:border-cyan-500/30 transition-all duration-500">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-700" />
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-inner">
            <Activity size={20} className="text-cyan-400" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Tỉ lệ thắng</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white tracking-tighter">
            <CountUp value={winRate} />
          </span>
          <span className="text-lg font-bold text-cyan-400/80">%</span>
        </div>
        <div className="flex gap-2 mt-4 text-[10px] font-black uppercase tracking-wider">
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {wins} Thắng
          </span>
          <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
            {losses} Bại
          </span>
        </div>
      </div>

      {/* Rank/Elo Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl group hover:border-amber-500/30 transition-all duration-500">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all duration-700" />
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <Trophy size={20} className="text-amber-400" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Hạng / Elo</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-600 tracking-tighter">#</span>
          <span className="text-4xl font-black text-white tracking-tighter">
            <CountUp value={rank} />
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <Flame size={14} className="fill-amber-400/20" />
            <CountUp value={rating} /> ELO
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaStatsHero;
