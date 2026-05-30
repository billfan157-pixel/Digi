import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Flame, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTierByWP } from './types';
import type { LeagueEntry } from './types';
import { glassCard } from '@/styles/glass';

const podiumHeights = [160, 130, 110];

const METALLIC = [
  { 
    border: 'border-yellow-400/40', 
    bg: 'from-amber-400/20 via-yellow-500/5 to-amber-600/10', 
    aura: 'from-yellow-400/20 to-transparent',
    glow: 'shadow-[0_0_50px_rgba(250,204,21,0.3)]',
    color: 'text-yellow-400'
  },
  { 
    border: 'border-slate-300/30', 
    bg: 'from-slate-300/10 via-slate-400/5 to-slate-500/10', 
    aura: 'from-slate-300/15 to-transparent',
    glow: 'shadow-[0_0_30px_rgba(203,213,225,0.15)]',
    color: 'text-slate-300'
  },
  { 
    border: 'border-orange-400/30', 
    bg: 'from-orange-400/15 via-orange-500/5 to-orange-600/10', 
    aura: 'from-orange-400/15 to-transparent',
    glow: 'shadow-[0_0_30px_rgba(251,146,60,0.15)]',
    color: 'text-orange-400'
  },
];

interface PodiumSectionProps {
  top3: LeagueEntry[];
}

export const PodiumSection = ({ top3 }: PodiumSectionProps) => {
  const { t } = useTranslation();
  const layouts = useMemo(() => [1, 0, 2], []);

  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 pt-12 pb-6 relative overflow-visible">
      {/* Global Background Glow for the winner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--theme-glow-color,rgba(250,204,21,0.15))] blur-[100px] rounded-full pointer-events-none animate-pulse" />

      {layouts.map((podiumIndex) => {
        const item = top3[podiumIndex];
        if (!item) return null;

        const isChampion = podiumIndex === 0;
        const metal = METALLIC[podiumIndex];
        const tier = getTierByWP(item.wp);

        return (
          <motion.div
            key={item.id || `podium-${podiumIndex}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * podiumIndex, type: 'spring', stiffness: 100 }}
            className={`flex-1 flex flex-col items-center max-w-[120px] ${isChampion ? 'z-20 scale-110' : 'z-10'}`}
          >
            {/* Crown / Rank Icon */}
            <div className="relative mb-6">
               <AnimatePresence>
                 {isChampion && (
                   <motion.div
                     initial={{ y: 20, opacity: 0, scale: 0.5 }}
                     animate={{ y: 0, opacity: 1, scale: 1 }}
                     className="absolute -top-10 left-1/2 -translate-x-1/2"
                   >
                     <Crown size={32} className="text-yellow-400 drop-shadow-[0_0_15px_var(--theme-glow-color,rgba(250,204,21,0.8))] animate-bounce" />
                   </motion.div>
                 )}
               </AnimatePresence>
               
               {/* Avatar Ring with Aura */}
               <div className="relative">
                  <div className={`absolute inset-[-12px] bg-gradient-to-b ${metal.aura} rounded-full blur-xl opacity-60`} />
                  <div className={`w-14 h-14 rounded-[var(--theme-border-radius-inner,16px)] bg-slate-900 border-2 ${metal.border} flex items-center justify-center relative overflow-hidden shadow-2xl`}>
                    <span className={`text-xl font-black ${metal.color}`}>
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-30 animate-[shimmer_3s_infinite]" />
                  </div>
                  
                  {/* Rank Badge Floating */}
                  <div className={`absolute -bottom-2 -right-1 w-6 h-6 rounded-full border-2 border-slate-950 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-[10px] font-black ${metal.color}`}>
                    {podiumIndex + 1}
                  </div>
               </div>
            </div>

            {/* Pedestal - Premium Glass */}
            <div
              className={`w-full ${glassCard} rounded-t-[var(--theme-border-radius,2.5rem)] border-t-2 border-x-2 ${metal.border} relative flex flex-col items-center pt-6 px-2 text-center overflow-hidden`}
              style={{ height: `${podiumHeights[podiumIndex]}px` }}
            >
              {/* Internal Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-1">
                <p className={`text-[11px] font-black uppercase truncate w-full px-2 ${isChampion ? 'text-white' : 'text-slate-300'}`}>
                  {item.name}
                </p>
                <div className="flex items-center justify-center gap-1">
                   <Zap size={10} className="text-amber-400" />
                   <span className={`text-sm font-black ${metal.color}`}>
                     {item.wp.toLocaleString()}
                   </span>
                </div>
                {item.streak > 0 && (
                   <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-orange-400/80">
                      <Flame size={9} />
                      {t('league.streak_days', { count: item.streak })}
                   </div>
                )}
              </div>

              {/* Tier Micro-Badge at bottom */}
              <div className="absolute bottom-4">
                 <div className={`px-2 py-0.5 rounded-full border ${tier.border} ${tier.bg} text-[7px] font-black uppercase tracking-widest ${tier.color}`}>
                    {tier.name}
                 </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};