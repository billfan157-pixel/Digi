import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Zap, Flame } from 'lucide-react';

interface ProgressSummaryProps {
  level: number;
  exp: number;
  streak: number;
  waterIntake: number;
  waterGoal: number;
  onLevelClick: () => void;
  onQuickDrink: (amount: number) => void;
}

export default function ProgressSummary({
  level, exp, streak, waterIntake, waterGoal,
  onLevelClick, onQuickDrink,
}: ProgressSummaryProps) {
  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);

  return (
    <div className="mx-6 rounded-[1.75rem] bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/[0.06] backdrop-blur-xl p-5 overflow-hidden relative">
      {/* Subtle glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        {/* Level + Streak row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onLevelClick}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={16} className="text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Level</p>
              <p className="text-sm font-black text-white">{level}</p>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Streak</p>
              <div className="flex items-center gap-1 justify-end">
                <Flame size={14} className={streak >= 7 ? 'text-orange-400' : 'text-slate-500'} />
                <span className="text-sm font-black text-white">{streak}</span>
                <span className="text-[9px] text-slate-500 font-bold">ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-400">Hôm nay</span>
            <span className="text-white font-black">{waterIntake} / {waterGoal} ml</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/60 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                progress >= 100
