import { useMemo } from 'react';
import { Crown, Flame, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeagueEntry } from './types';

const podiumHeights = [130, 110, 90];

const MEDAL_ICONS = [Crown, Medal, Medal];
const METALLIC = [
  { border: 'border-yellow-400/60', bg: 'from-amber-400/25 via-yellow-500/12 to-amber-600/15', glow: 'shadow-[0_-6px_25px_rgba(250,204,21,0.2)]', rankBg: 'from-yellow-300 to-amber-500', rankText: 'text-amber-950', nameColor: 'text-yellow-400', wpColor: 'text-yellow-400', iconRank: 0 },
  { border: 'border-slate-300/40', bg: 'from-slate-300/15 via-slate-400/8 to-slate-500/12', glow: 'shadow-[0_-4px_15px_rgba(203,213,225,0.1)]', rankBg: 'from-slate-200 to-slate-400', rankText: 'text-slate-800', nameColor: 'text-slate-300', wpColor: 'text-slate-300', iconRank: 1 },
  { border: 'border-orange-400/40', bg: 'from-orange-400/20 via-orange-500/8 to-orange-600/12', glow: 'shadow-[0_-4px_15px_rgba(251,146,60,0.1)]', rankBg: 'from-orange-300 to-orange-500', rankText: 'text-orange-950', nameColor: 'text-orange-400', wpColor: 'text-orange-400', iconRank: 2 },
];

interface PodiumSectionProps {
  top3: LeagueEntry[];
}

export const PodiumSection = ({ top3 }: PodiumSectionProps) => {
  const layouts = useMemo(() => [1, 0, 2], []);

  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-2.5 pt-2">
      {layouts.map((podiumIndex) => {
        const item = top3[podiumIndex];
        if (!item) return null;

        const isChampion = podiumIndex === 0;
        const metal = METALLIC[podiumIndex];
        const RankIcon = MEDAL_ICONS[podiumIndex];

        return (
          <motion.div
            key={item.id || `podium-${podiumIndex}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * podiumIndex, type: 'spring', stiffness: 120 }}
            className={`flex-1 flex flex-col items-center max-w-[110px] ${isChampion ? 'z-20' : 'z-10'}`}
          >
            {/* Crown / spacer */}
            {isChampion ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            {/* Avatar ring */}
            <div className="relative mb-2.5">
              <div
                className={`rounded-full overflow-hidden flex items-center justify-center font-black border-[2.5px] ${metal.border} bg-gradient-to-br ${metal.bg} backdrop-blur-sm ${
                  isChampion ? 'w-[60px] h-[60px] text-2xl shadow-[0_0_25px_rgba(250,204,21,0.25)]' : 'w-[46px] h-[46px] text-lg shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                }`}
              >
                <span className={metal.nameColor}>
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div
                className={`absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-black border-2 border-slate-900 bg-gradient-to-br ${metal.rankBg} ${metal.rankText} ${
                  isChampion ? 'w-7 h-7 -bottom-2 text-[11px]' : 'w-5 h-5 -bottom-1.5 text-[9px]'
                }`}
              >
                {podiumIndex + 1}
              </div>
            </div>

            {/* Pedestal card */}
            <div
              className={`w-full rounded-t-2xl border-t-[2.5px] ${metal.border} ${metal.glow} px-2 pt-3 relative overflow-hidden backdrop-blur-xl flex flex-col items-center bg-gradient-to-t ${metal.bg}`}
              style={{ height: `${podiumHeights[podiumIndex]}px` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent pointer-events-none" />
              <p className={`text-center font-bold truncate relative z-10 max-w-full px-1 ${isChampion ? 'text-sm' : 'text-xs'} ${item.isMe ? 'text-cyan-300' : 'text-white'}`}>
                {item.name}
              </p>
              <p className={`mt-1 text-center font-black relative z-10 ${isChampion ? 'text-xs' : 'text-[11px]'} ${metal.wpColor}`}>
                {item.wp.toLocaleString()} WP
              </p>
              {item.streak > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-orange-400/70 relative z-10">
                  <Flame size={9} />
                  {item.streak}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};