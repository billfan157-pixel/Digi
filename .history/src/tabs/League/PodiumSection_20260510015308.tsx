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
            {isChampion ? (
              <Crown size={26} className="text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]" />
            ) : (
              <div className="mb-5" />
            )}

            {/* Avatar ring */}
            <div className="relative mb-2.5">
              <div
                className={`rounded-full overflow-hidden flex items-center justify-center font-black border-[2.5px] ${metal.border} bg-gradient-to-br ${metal.bg} backdrop-blur-sm ${
