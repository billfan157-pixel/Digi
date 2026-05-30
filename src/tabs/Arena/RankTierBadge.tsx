import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Star, Crown, Diamond, Sparkles, Medal } from 'lucide-react';
import { getRankTier, type RankTier } from '../../config/rankConfig';

const TIERS: Record<RankTier, { labelKey: string; color: string; border: string; bg: string; icon: React.ElementType }> = {
  bronze:     { labelKey: 'rank.bronze', color: 'text-[#cd7f32]', border: 'border-[#cd7f32]/40', bg: 'bg-[#cd7f32]/10', icon: Shield },
  silver:     { labelKey: 'rank.silver', color: 'text-[#c0c0c0]', border: 'border-[#c0c0c0]/40', bg: 'bg-[#c0c0c0]/10', icon: Shield },
  gold:       { labelKey: 'rank.gold', color: 'text-[#ffd700]', border: 'border-[#ffd700]/40', bg: 'bg-[#ffd700]/10', icon: Star },
  platinum:   { labelKey: 'rank.platinum', color: 'text-[#3eb489]', border: 'border-[#3eb489]/40', bg: 'bg-[#3eb489]/10', icon: Crown },
  diamond:    { labelKey: 'rank.diamond', color: 'text-[#b9f2ff]', border: 'border-[#b9f2ff]/40', bg: 'bg-[#b9f2ff]/10', icon: Diamond },
  master:     { labelKey: 'rank.master', color: 'text-[#a78bfa]', border: 'border-[#a78bfa]/40', bg: 'bg-[#a78bfa]/10', icon: Medal },
  grandmaster:{ labelKey: 'rank.grandmaster', color: 'text-[#ff4ecd]', border: 'border-[#ff4ecd]/40', bg: 'bg-[#ff4ecd]/10', icon: Sparkles },
};

interface RankTierBadgeProps {
  wp: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { container: 'px-2 py-0.5 rounded-lg gap-1 text-[10px]', icon: 12 },
  md: { container: 'px-2.5 py-1 rounded-xl gap-1.5 text-[11px]', icon: 14 },
  lg: { container: 'px-3 py-1.5 rounded-2xl gap-2 text-xs', icon: 16 },
};

const RankTierBadge: React.FC<RankTierBadgeProps> = ({ wp, showLabel = true, size = 'md' }) => {
  const { t } = useTranslation();
  const tier = getRankTier(wp);
  const config = TIERS[tier];
  const Icon = config.icon;
  const s = SIZE_MAP[size];
  const isHighTier = tier === 'diamond' || tier === 'master' || tier === 'grandmaster';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center font-black uppercase tracking-wider border ${config.color} ${config.border} ${config.bg} ${s.container} relative overflow-hidden`}
    >
      {isHighTier && (
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
              'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
              'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <span className="relative z-10">
        <motion.div
          animate={isHighTier ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon size={s.icon} />
        </motion.div>
      </span>
      {showLabel && <span className="relative z-10">{t(config.labelKey)}</span>}

      {tier === 'grandmaster' && (
        <>
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-pink-300 rounded-full"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
          />
        </>
      )}
    </motion.div>
  );
};

export default React.memo(RankTierBadge);
