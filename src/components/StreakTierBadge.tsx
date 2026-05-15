import { motion } from 'framer-motion';
import { getStreakTier, getNextStreakTier } from '../utils/healthMath';

interface StreakTierBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showNext?: boolean;
}

const sizeStyles = {
  sm: { container: 'px-2 py-1 text-[9px]', icon: 'text-xs', name: 'text-[8px]' },
  md: { container: 'px-3 py-1.5 text-[10px]', icon: 'text-sm', name: 'text-[9px]' },
  lg: { container: 'px-4 py-2 text-xs', icon: 'text-base', name: 'text-[10px]' },
};

export default function StreakTierBadge({ streak, size = 'md', showNext = false }: StreakTierBadgeProps) {
  const tier = getStreakTier(streak);
  const nextTier = showNext ? getNextStreakTier(streak) : null;
  const s = sizeStyles[size];

  return (
    <div className="flex flex-col items-start gap-1">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`inline-flex items-center gap-1.5 rounded-full ${tier.bg} ${tier.border} border ${tier.color} ${s.container} font-black uppercase tracking-widest shadow-lg`}
      >
        <span className={s.icon}>{tier.emoji}</span>
        <span className={s.name}>{tier.name}</span>
        <span className={`opacity-60 ${s.name}`}>· {streak} ngày</span>
      </motion.div>

      {nextTier && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[8px] text-slate-500 font-bold uppercase tracking-widest ml-1"
        >
          Còn {nextTier.minStreak - streak} ngày để lên {nextTier.emoji} {nextTier.name}
        </motion.p>
      )}
    </div>
  );
}