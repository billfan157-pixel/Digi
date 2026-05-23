import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Clock, Coins, Zap } from 'lucide-react';
import type { Battle, Profile } from '../../models';
import { glassCard } from '../../styles/glass';

interface BattleCardProps {
  battle: Battle;
  profile: Profile | null;
  now: number;
  onClick: () => void;
}

const BattleCard: React.FC<BattleCardProps> = ({ battle, profile, now, onClick }) => {
  const isChallenger = battle.challenger_id === profile?.id;
  const me = isChallenger ? battle.challenger : battle.opponent;
  const opponent = isChallenger ? battle.opponent : battle.challenger;
  
  const userNickname = me?.nickname ?? 'Bạn';
  const oppNickname = opponent?.nickname ?? 'Đối thủ';

  const myProgress = battle.yourProgress ?? me?.water_today ?? 0;
  const oppProgress = battle.opponentProgress ?? opponent?.water_today ?? 0;
  
  const yourLead = myProgress >= oppProgress;
  const delta = Math.abs(myProgress - oppProgress);
  const totalProgress = myProgress + oppProgress;
  const yourPct = totalProgress > 0 ? (myProgress / totalProgress) * 100 : 50;

  const endsAt = new Date();
  endsAt.setHours(23, 59, 59, 999);
  const timeLeft = Math.max(0, endsAt.getTime() - now);
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-[2.5rem] ${glassCard} hover:border-white/15 transition-all p-6 group relative overflow-hidden`}
    >
      {/* Background Aura */}
      <div className={`absolute -right-20 -top-20 w-60 h-60 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${
        yourLead ? 'bg-cyan-500/10 group-hover:bg-cyan-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'
      }`} />

      {/* Mode & Wager Badge */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-white/5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-300 glass-badge">
            {battle.mode === 'daily' ? 'Hằng ngày' : battle.mode === 'quick' ? 'Tức thời' : 'Giải đấu'}
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5 glass-badge">
            <Coins size={12} className="fill-amber-400/20" /> {battle.stake_coins} WP
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-black bg-slate-800/40 px-3 py-1 rounded-xl border border-white/5 glass-badge">
          <Clock size={14} className="text-cyan-400" />
          <span className="tabular-nums">{hoursLeft}h {minsLeft}m</span>
        </div>
      </div>

      {/* Combat Face-off */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        {/* User Stats */}
        <div className="flex flex-col items-start w-2/5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black border transition-all duration-500 ${
              yourLead ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-800 border-white/5 text-slate-400'
            }`}>
              {userNickname.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">{userNickname}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter ${yourLead ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'text-white'}`}>
              {myProgress}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">ml</span>
          </div>
        </div>

        {/* VS Spark */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 italic shadow-2xl relative z-10">
               VS
             </div>
             {/* Dynamic Glow */}
             <div className={`absolute inset-0 blur-xl rounded-full animate-pulse ${yourLead ? 'bg-cyan-500/30' : 'bg-rose-500/30'}`} />
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-[10px] font-black mt-2 px-3 py-1 rounded-lg border flex items-center gap-1 ${
              yourLead ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}
          >
            {yourLead ? <Zap size={10} className="fill-current" /> : null}
            {yourLead ? `Dẫn +${delta}` : `Kém ${delta}`}
          </motion.div>
        </div>

        {/* Opponent Stats */}
        <div className="flex flex-col items-end w-2/5">
          <div className="flex items-center gap-2 mb-2 flex-row-reverse">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black border transition-all duration-500 ${
              !yourLead ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-slate-800 border-white/5 text-slate-400'
            }`}>
              {oppNickname.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">{oppNickname}</span>
          </div>
          <div className="flex items-baseline gap-1 flex-row-reverse">
            <span className={`text-3xl font-black tracking-tighter ${!yourLead ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'text-white'}`}>
              {oppProgress}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">ml</span>
          </div>
        </div>
      </div>

      {/* Tug of War HUD Bar */}
      <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
        <motion.div 
          initial={{ width: '50%' }} 
          animate={{ width: `${yourPct}%` }} 
          className="bg-gradient-to-r from-cyan-600 to-cyan-400 relative overflow-hidden"
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer -skew-x-12" />
          {/* Spark Indicator at the edge */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_#fff] z-20" />
        </motion.div>
        <motion.div 
          initial={{ width: '50%' }} 
          animate={{ width: `${100 - yourPct}%` }} 
          className="bg-gradient-to-l from-rose-600 to-rose-400"
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
        
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 z-10 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
      </div>

      {/* Interactive Hint */}
      <div className="mt-4 flex justify-center">
         <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Swords size={12} className="text-red-500" /> Nhấn để xem chi tiết đấu trường
         </div>
      </div>
    </motion.button>
  );
};

export default BattleCard;
