import { Sparkles, Shield, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTierByWP } from './types';

interface LeagueTierBadgeProps {
  wp: number;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LeagueTierBadge = ({ wp, showName = true, size = 'md' }: LeagueTierBadgeProps) => {
  const tier = getTierByWP(wp);
  
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
        className={`relative flex items-center justify-center rounded-lg border ${tier.border} ${tier.bg} ${tier.glow} ${
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
          {tier.name}
        </span>
      )}
    </div>
  );
};
