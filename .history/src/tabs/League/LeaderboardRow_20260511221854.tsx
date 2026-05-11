import { Crown, Flame, Sparkles, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import StreakTierBadge from '../../components/StreakTierBadge';
import type { LeagueEntry, RankInfo } from './types';

interface LeaderboardRowProps {
  item: LeagueEntry;
  actualRank: number;
  rankInfo: RankInfo;
  gap: number;
  isPremium: boolean;
}

export const LeaderboardRow = ({ item, actualRank, rankInfo, gap, isPremium }: LeaderboardRowProps) => {
  const isMe = item.isMe;
  const isHotGap = gap > 0 && gap < 500;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(actualRank * 0.02, 0.2) }}
      className={`group relative flex items-center p-3.5 rounded-2xl backdrop-blur-md border transition-all duration-300 overflow-hidden min-h-[72px] active:scale-[0.99] ${
        isMe
          ? isPremium
            ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
            : 'bg-gradient-to-r from-cyan-900/40 to-blue-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/50'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {/* Rank number */}
      <div className="w-10 shrink-0 text-center relative z-10">
        {actualRank <= 3 ? (
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
            actualRank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.15)]' :
            actualRank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
            'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {actualRank}
          </div>
        ) : (
          <span className="text-sm font-black text-slate-500">{actualRank}</span>
        )}
      </div>

      {/* Avatar circle */}
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-base font-black shrink-0 shadow-inner relative z-10 ${
        isMe && isPremium
          ? 'bg-gradient-to-br from-amber-700 to-orange-800 border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
          : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300'
      }`}>
        {item.name.charAt(0).toUpperCase()}
      </div>

      {/* Info section */}
      <div className="flex-1 min-w-0 ml-3 relative z-10">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm truncate ${isMe ? (isPremium ? 'text-amber-300' : 'text-cyan-300') : 'text-slate-100'}`}>
            {item.name}
          </p>
          {isMe && (
            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border shrink-0 ${
              isPremium ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              Bạn
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {/* Rank tier badge */}
          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${rankInfo.bg} ${rankInfo.color} ${rankInfo.border}`}>
            {rankInfo.name}
          </div>

          {/* Streak */}
          {item.streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/8 px-1.5 py-0.5 rounded border border-orange-500/15">
              <Flame size={8} className="text-orange-500" />
              <span className="text-orange-500 text-[10px] font-black">{item.streak}</span>
            </div>
          )}

          {isHotGap && (
            <div className="flex items-center gap-1 bg-emerald-500/8 px-1.5 py-0.5 rounded border border-emerald-500/15">
              <Target size={8} className="text-emerald-400" />
              <span className="text-emerald-400 text-[8px] font-bold">Đối thủ gần</span>
            </div>
          )}

          {actualRank <= 10 && (
            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              <Sparkles size={8} className="text-cyan-300" />
              <span className="text-cyan-300 text-[8px] font-black">Top 10</span>
            </div>
          )}
        </div>

        {/* Gap bar */}
        {gap > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-600 to-transparent"
                style={{ width: `${Math.min(100, (gap / 2000) * 100)}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-600 font-bold whitespace-nowrap">
              {gap.toLocaleString()} WP
            </span>
          </div>
        )}
      </div>

      {/* WP score */}
      <div className="text-right shrink-0 ml-2 relative z-10">
        <p className={`font-black text-base tracking-tight ${isMe ? 'text-cyan-400' : 'text-white'}`}>
          {item.wp.toLocaleString()}
        </p>
        <p className="text-slate-500 text-[8px] uppercase font-bold tracking-widest flex items-center justify-end gap-0.5 mt-0.5">
          <Zap size={8} className="text-amber-400" /> WP
        </p>
      </div>
    </motion.div>
  );
};