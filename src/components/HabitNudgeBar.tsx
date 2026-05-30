import { motion } from 'framer-motion';
import { Droplets, Zap, AlertTriangle, Sparkles, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTimeBasedNudge, getNextRecommendedDrink, TINT_STYLES } from '../lib/habitEngine';
import type { UserHydrationPattern } from '../lib/patternEngine';
import { useUIStore } from '../store/useUIStore';

interface HabitNudgeBarProps {
  hour: number;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isFirstOpen: boolean;
  pattern?: UserHydrationPattern | null;
  onQuickDrink?: (amount: number) => void;
  aiNudge?: {
    title: string;
    message: string;
    actionLabel?: string;
    emoji: string;
    isLoading?: boolean;
  } | null;
}

export default function HabitNudgeBar({
  hour,
  waterIntake,
  waterGoal,
  streak,
  isFirstOpen,
  pattern,
  onQuickDrink,
  aiNudge,
}: HabitNudgeBarProps) {
  const { t } = useTranslation();
  const nudge = aiNudge
    ? { ...getTimeBasedNudge({ hour, waterIntake, waterGoal, streak, isFirstOpen }), ...aiNudge }
    : getTimeBasedNudge({ hour, waterIntake, waterGoal, streak, isFirstOpen });
  const nextDrink = getNextRecommendedDrink({ waterIntake, waterGoal, hour });
  const styles = TINT_STYLES[nudge.tint];

  // Check if current hour is approaching a blind spot
  const currentHourSlot = Math.floor(hour / 3) * 3; // Group by 3-hour slots
  const upcomingBlindSpot = pattern?.blindSpots.find(
    (bs) => {
      const slotHour = parseInt(bs.slot.split('-')[0], 10);
      return slotHour >= currentHourSlot && slotHour < currentHourSlot + 3;
    }
  );

  const setShowAiChat = useUIStore(s => s.setShowAiChat);

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
        <div className={`w-10 h-10 rounded-full ${styles.iconBg} border ${styles.border} flex items-center justify-center text-lg shrink-0 relative`}>
          {nudge.emoji}
          {aiNudge && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </div>
          )}
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

          {/* Blind spot warning */}
          {upcomingBlindSpot && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-300 font-medium">
                {t('ai.nudge.blind_spot', {
                  slot: upcomingBlindSpot.slot.replace('-', 'h - '),
                  rate: upcomingBlindSpot.completionRate < 30 ? t('ai.nudge.very_few') : t('ai.nudge.few')
                })}
              </p>
            </div>
          )}

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

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAiChat(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 shadow-lg"
            >
              <MessageSquare size={12} className="text-cyan-400" />
              {t('ai.ask_coach')}
            </motion.button>

            {nextDrink && nextDrink.urgency === 'high' && (
              <span className="inline-flex items-center gap-1 text-[9px] text-rose-400 font-bold uppercase tracking-widest">
                <Zap size={10} className="animate-pulse" />
                {t('ai.urgent')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}