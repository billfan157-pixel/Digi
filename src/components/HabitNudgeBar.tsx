import { motion } from 'framer-motion';
import { Droplets, Zap } from 'lucide-react';
import { getTimeBasedNudge, getNextRecommendedDrink, TINT_STYLES } from '../lib/habitEngine';

interface HabitNudgeBarProps {
  hour: number;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isFirstOpen: boolean;
  onQuickDrink?: (amount: number) => void;
}

export default function HabitNudgeBar({
  hour,
  waterIntake,
  waterGoal,
  streak,
  isFirstOpen,
  onQuickDrink,
}: HabitNudgeBarProps) {
  const nudge = getTimeBasedNudge({ hour, waterIntake, waterGoal, streak, isFirstOpen });
  const nextDrink = getNextRecommendedDrink({ waterIntake, waterGoal, hour });
  const styles = TINT_STYLES[nudge.tint];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative overflow-hidden rounded-[20px] border ${styles.border} bg-gradient-to-br ${styles.gradient} backdrop-blur-xl p-4 mx-5`}
    >
      {/* Ambient glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-3xl ${styles.iconBg} opacity-40 pointer-events-none`} />

      <div className="relative z-10 flex items-start gap-3">
        {/* Emoji avatar */}
        <div className={`w-10 h-10 rounded-full ${styles.iconBg} border ${styles.border} flex items-center justify-center text-lg shrink-0`}>
          {nudge.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-black ${styles.accent}`}>
              {nudge.title}
            </h4>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
              {nudge.tint}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {nudge.message}
          </p>

          {/* Action row */}
          <div className="flex items-center gap-2 mt-3">
            {nudge.actionLabel && onQuickDrink && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Parse amount from actionLabel, e.g. "Uống 250ml" -> 250
                  const match = nudge.actionLabel?.match(/(\d+)/);
                  const amount = match ? parseInt(match[1], 10) : 250;
                  onQuickDrink(amount);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.iconBg} ${styles.accent} border ${styles.border} shadow-lg`}
              >
                <Droplets size={12} />
                {nudge.actionLabel}
              </motion.button>
            )}

            {nextDrink && nextDrink.urgency === 'high' && (
              <span className="inline-flex items-center gap-1 text-[9px] text-rose-400 font-bold uppercase tracking-widest">
                <Zap size={10} className="animate-pulse" />
                Gấp!
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}