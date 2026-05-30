import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Clock, Coins, Target, TrendingUp, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Battle, Profile } from '../../models';
import { glassCard } from '../../styles/glass';

interface BattleCardProps {
  battle: Battle;
  profile: Profile | null;
  now: number;
  onClick: () => void;
}

const BattleCard: React.FC<BattleCardProps> = ({ battle, profile, now, onClick }) => {
  const { t } = useTranslation();
  const isChallenger = battle.challenger_id === profile?.id;
  const me = isChallenger ? battle.challenger : battle.opponent;
  const opponent = isChallenger ? battle.opponent : battle.challenger;

  const userNickname = me?.nickname ?? t('common.you');
  const oppNickname = opponent?.nickname ?? t('common.opponent');

  const targetMl = battle.target_ml || 2000;
  const myProgress = battle.yourProgress ?? me?.water_today ?? 0;
  const oppProgress = battle.opponentProgress ?? opponent?.water_today ?? 0;

  const yourLead = myProgress >= oppProgress;
  const delta = Math.abs(myProgress - oppProgress);
  const yourPct = Math.min(100, Math.round((myProgress / Math.max(targetMl, 1)) * 100));
  const opponentPct = Math.min(100, Math.round((oppProgress / Math.max(targetMl, 1)) * 100));

  function timeLeft(deadline: string | null): string {
    if (!deadline) return '';
    const remaining = new Date(deadline).getTime() - now;
    if (remaining <= 0) return t('common.time_expired');
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    
    if (h > 0) return `${h}h ${m}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-[2rem] ${glassCard} hover:border-white/15 transition-all p-5 group relative overflow-hidden`}
    >
      {/* Soft background glow */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 blur-[60px] rounded-full pointer-events-none transition-all duration-1000 ${
        yourLead ? 'bg-cyan-500/8 group-hover:bg-cyan-500/15' : 'bg-rose-500/8 group-hover:bg-rose-500/15'
      }`} />

      {/* ── Header: LIVE + Mode + Timer ── */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/25 text-[9px] font-black uppercase tracking-wider text-rose-400">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            LIVE
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-400">
            {battle.mode_type === 'daily' ? 'Hằng Ngày' : battle.mode_type === 'quick' ? 'Đấu Nhanh' : battle.mode_type === 'tournament' ? 'Giải Đấu' : battle.mode || 'Ranked'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/5 text-[10px] font-black text-slate-300 tabular-nums">
          <Clock size={12} className="text-cyan-400" />
          {timeLeft(battle.deadline)}
        </span>
      </div>

      {/* ── Meta: Target + Stake ── */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
          <Target size={11} className="text-cyan-500/70" />
          {targetMl}ml
        </span>
        <span className="w-px h-3 bg-white/10" />
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400/80">
          <Coins size={11} className="fill-amber-400/20" />
          {battle.stake_coins} WP
        </span>
        {delta > 0 && (
          <>
            <span className="w-px h-3 bg-white/10" />
            <span className={`inline-flex items-center gap-1 text-[10px] font-black ${yourLead ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp size={10} className={yourLead ? '' : 'rotate-180'} />
              {delta}ml
            </span>
          </>
        )}
      </div>

      {/* ── Face-off ── */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between">
          {/* You */}
          <div className="flex flex-col items-center w-[35%]">
            <motion.div
              whileHover={{ scale: 1.08 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-2 mb-2 transition-all duration-500 ${
                yourLead
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 border-white/10 text-slate-400'
              }`}
            >
              {userNickname.charAt(0).toUpperCase()}
            </motion.div>
            <span className="text-xs font-bold text-slate-200 truncate w-full text-center leading-tight">
              {userNickname}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <motion.span
                key={myProgress}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-black tracking-tight ${yourLead ? 'text-cyan-400' : 'text-white'}`}
              >
                {myProgress}
              </motion.span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">ml</span>
            </div>
            {yourLead && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-[9px] font-black text-emerald-400 uppercase tracking-wider"
              >
                {t('battle.leading')}
              </motion.span>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center px-1">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-10 h-10 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 italic relative z-10 ${
                  yourLead ? 'shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                }`}
              >
                VS
              </motion.div>
              <div className={`absolute inset-0 blur-lg rounded-full ${yourLead ? 'bg-cyan-500/25' : 'bg-rose-500/25'}`} />
            </div>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center w-[35%]">
            <motion.div
              whileHover={{ scale: 1.08 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-2 mb-2 transition-all duration-500 ${
                !yourLead
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-800 border-white/10 text-slate-400'
              }`}
            >
              {oppNickname.charAt(0).toUpperCase()}
            </motion.div>
            <span className="text-xs font-bold text-slate-200 truncate w-full text-center leading-tight">
              {oppNickname}
            </span>
            <div className="mt-2 flex items-baseline gap-1 flex-row-reverse">
              <motion.span
                key={oppProgress}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-black tracking-tight ${!yourLead ? 'text-rose-400' : 'text-white'}`}
              >
                {oppProgress}
              </motion.span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">ml</span>
            </div>
            {!yourLead && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-[9px] font-black text-rose-400 uppercase tracking-wider"
              >
                {t('battle.behind')}
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Bars ── */}
      <div className="space-y-2.5 relative z-10">
        {/* User bar */}
        <div className="flex items-center gap-3">
          <Droplets size={12} className="text-cyan-400 shrink-0" />
          <div className="flex-1 h-3 bg-slate-950/50 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={false}
              animate={{ width: `${yourPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 relative"
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              style={{ width: `${yourPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
          <span className="text-[10px] font-black text-cyan-400 w-8 text-right tabular-nums">{yourPct}%</span>
        </div>

        {/* Opponent bar */}
        <div className="flex items-center gap-3">
          <Droplets size={12} className="text-rose-400 shrink-0" />
          <div className="flex-1 h-3 bg-slate-950/50 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={false}
              animate={{ width: `${opponentPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-400 relative"
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              style={{ width: `${opponentPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
          <span className="text-[10px] font-black text-rose-400 w-8 text-right tabular-nums">{opponentPct}%</span>
        </div>
      </div>

      {/* Tap hint */}
      <div className="mt-4 flex justify-center relative z-10">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Swords size={12} className="text-rose-500" /> {t('battle.tap_for_details')}
        </div>
      </div>
    </motion.button>
  );
};

export default BattleCard;
