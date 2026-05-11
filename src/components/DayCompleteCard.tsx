import { motion } from 'framer-motion';
import { Sparkles, Target, ChevronRight } from 'lucide-react';
import { generateEveningSummary } from '../utils/healthMath';
import StreakTierBadge from './StreakTierBadge';

interface DayCompleteCardProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isGoalReached: boolean;
  onClose?: () => void;
}

export default function DayCompleteCard({
  waterIntake,
  waterGoal,
  streak,
  isGoalReached,
  onClose,
}: DayCompleteCardProps) {
  const summary = generateEveningSummary({ waterIntake, waterGoal, streak, isGoalReached });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-2xl p-5 shadow-2xl"
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{summary.emoji}</div>
            <div>
              <h3 className="text-white font-black text-lg tracking-tight">
                {summary.title}
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Tổng kết ngày
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {summary.message}
        </p>

        {/* Streak tier */}
        <div className="mb-4">
          <StreakTierBadge streak={streak} size="sm" showNext />
        </div>

        {/* Tomorrow tip */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/5 border border-white/5">
          <Target size={16} className="text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-0.5">
              Mẹo cho ngày mai
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {summary.tomorrowTip}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}