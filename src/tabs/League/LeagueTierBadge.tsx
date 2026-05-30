import { Sparkles, Shield, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getTierByWP } from './types';

interface LeagueTierBadgeProps {
  wp: number;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LeagueTierBadge = ({ wp, showName = true, size = 'md' }: LeagueTierBadgeProps) => {
  const { t } = useTranslation();
  const tier = getTierByWP(wp);
  
  const getTierTranslationKey = () => {
    if (wp >= 12000) return 'league.tier_grandmaster';
    if (wp >= 8000) return 'league.tier_master';
    if (wp >= 5000) return 'league.tier_diamond';
    if (wp >= 3000) return 'league.tier_platinum';
    if (wp >= 1500) return 'league.tier_gold';
    if (wp >= 500) return 'league.tier_silver';
    return 'league.tier_bronze';
  };
  
  const getTierIcon = () => {
    if (wp >= 12000) return <Crown size={size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
    if (wp >= 5000) return <Medal size={size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
    if (wp >= 1500) return <Shield size={size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
    return <Sparkles size={size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative flex items-center justify-center rounded-[var(--theme-border-radius-inner,8px)] border ${tier.border} ${tier.bg} ${tier.glow} ${
          size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-9 h-9'
        }`}
      >
        <div className={`relative z-10 ${tier.color}`}>
          {getTierIcon()}
        </div>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-50 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
      </motion.div>
      
      {showName && (
        <span className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>
          {t(getTierTranslationKey())}
        </span>
      )}
    </div>
  );
};
