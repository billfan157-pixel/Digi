import { Flame, Target, Zap, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeagueTierBadge } from './LeagueTierBadge';
import type { LeagueEntry } from './types';

interface LeaderboardRowProps {
  item: LeagueEntry;
  actualRank: number;
  gap: number;
  isPremium: boolean;
}

export const LeaderboardRow = ({ item, actualRank, gap, isPremium }: LeaderboardRowProps) => {
  const isMe = item.isMe;
  const isHotGap = gap > 0 && gap < 300; // Closer gap for rivalry pulse
  
  // Rank movement simulator (random for UI demo, in real app would come from props)
  const movement = isMe ? 'up' : actualRank % 5 === 0 ? 'down' : actualRank % 7 === 0 ? 'up' : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(actualRank * 0.02, 0.2) }}
      className={`group relative flex items-center p-4 rounded-[1.5rem] backdrop-blur-xl border transition-all duration-300 overflow-hidden active:scale-[0.98] ${
        isMe
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/60 hover:border-white/10'
      }`}
    >
      {/* Rank Section */}
      <div className="w-10 shrink-0 flex flex-col items-center gap-1 relative z-10">
        <span className={`text-sm font-black ${actualRank <= 3 ? 'text-white' : 'text-slate-500'}`}>
          {actualRank}
        </span>
        <div className="flex items-center justify-center">
          {movement === 'up' && <ChevronUp size={10} className="text-emerald-400" />}
          {movement === 'down' && <ChevronDown size={10} className="text-rose-400" />}
          {movement === 'none' && <Minus size={10} className="text-slate-700" />}
        </div>
      </div>

      {/* Avatar - High End */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black border border-white/10 shadow-2xl relative overflow-hidden ${
          isMe ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white' : 'bg-slate-800 text-slate-300'
        }`}>
           {item.name.charAt(0).toUpperCase()}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-30 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
        {isHotGap && (
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950 flex items-center justify-center animate-pulse">
              <Target size={8} className="text-white" />
           </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex-1 min-w-0 ml-4 relative z-10">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-slate-200'}`}>
            {item.name}
          </p>
          {isMe && (
            <span className="px-1.5 py-0.5 rounded-[4px] bg-cyan-400 text-slate-950 text-[8px] font-black uppercase tracking-widest">
              Bạn
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5">
           <LeagueTierBadge wp={item.wp} size="sm" />
           
           {item.streak > 0 && (
             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
               <Flame size={10} className="text-orange-400" />
               <span className="text-orange-400 text-[10px] font-black">{item.streak}</span>
             </div>
           )}
        </div>

        {/* Rivalry Pulse - Progress Bar to next rank */}
        {gap > 0 && gap < 1000 && (
          <div className="mt-2 w-full max-w-[120px]">
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.max(10, 100 - (gap / 10))}%` }}
                 className={`h-full rounded-full ${isHotGap ? 'bg-rose-500' : 'bg-slate-500'}`}
               />
            </div>
          </div>
        )}
      </div>

      {/* WP score */}
      <div className="text-right shrink-0 ml-2 relative z-10">
        <p className={`font-black text-lg tracking-tight ${isMe ? 'text-white' : 'text-white/90'}`}>
          {item.wp.toLocaleString()}
        </p>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-end gap-1">
          <Zap size={10} className="text-amber-400" /> WP
        </p>
      </div>
    </motion.div>
  );
};