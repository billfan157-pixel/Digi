import { Flame, Target, Zap, ChevronUp, ChevronDown, Minus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LeagueTierBadge } from './LeagueTierBadge';
import { getTierByWP, LEAGUE_TIERS } from './types';
import type { LeagueEntry } from './types';

interface LeaderboardRowProps {
  item: LeagueEntry;
  actualRank: number;
  gap: number;
  isPremium: boolean;
}

const TIER_BORDER: Record<string, string> = {
  bronze: 'border-orange-400/15 hover:border-orange-400/30',
  silver: 'border-slate-300/15 hover:border-slate-300/30',
  gold: 'border-yellow-400/15 hover:border-yellow-400/30',
  platinum: 'border-cyan-400/15 hover:border-cyan-400/30',
  diamond: 'border-blue-400/15 hover:border-blue-400/30',
  master: 'border-purple-400/15 hover:border-purple-400/30',
  grandmaster: 'border-rose-400/15 hover:border-rose-400/30',
};

export const LeaderboardRow = ({ item, actualRank, gap }: LeaderboardRowProps) => {
  const { t } = useTranslation();
  const isMe = item.isMe;
  const isHotGap = gap > 0 && gap < 300;
  const tier = getTierByWP(item.wp);
  const tierKey = Object.keys(LEAGUE_TIERS).find(k => LEAGUE_TIERS[k] === tier) || 'bronze';
  const tierBorder = TIER_BORDER[tierKey];

  // Rank movement simulator
  const movement = isMe ? 'up' : actualRank % 5 === 0 ? 'down' : actualRank % 7 === 0 ? 'up' : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(actualRank * 0.02, 0.2) }}
      className={`group relative flex items-center p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 overflow-hidden active:scale-[0.98] ${
        isMe
          ? 'bg-gradient-to-r from-cyan-500/15 to-transparent border-cyan-500/30 shadow-[0_0_24px_rgba(34,211,238,0.1)]'
          : `bg-white/[0.02] ${tierBorder} hover:bg-white/[0.04]`
      }`}
    >
      {/* Subtle tier glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 40px ${tier.color.replace('text-', 'rgba(').replace('-300', ',0.03)').replace('-400', ',0.03)').replace('-500', ',0.03)')}` }}
      />

      {/* Rank Section */}
      <div className="w-10 shrink-0 flex flex-col items-center gap-1 relative z-10">
        <span className={`text-sm font-black ${actualRank <= 3 ? 'text-white' : 'text-slate-500'}`}>
          {actualRank}
        </span>
        <div className="flex items-center justify-center">
          {movement === 'up' && <ChevronUp size={10} className="text-emerald-400" />}
          {movement === 'down' && <ChevronDown size={10} className="text-rose-400" />}
          {movement === 'none' && <Minus size={10} className="text-slate-700" />}
        </div>
      </div>

      {/* Avatar — Tier-colored */}
      <div className="relative shrink-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black border relative overflow-hidden"
          style={{
            background: isMe ? 'linear-gradient(135deg, #22d3ee, #06b6d4)' : `${tier.color.replace('text-', '').replace('-300', '40').replace('-400', '40').replace('-500', '40')}`,
            borderColor: isMe ? 'rgba(34,211,238,0.3)' : `${tier.color.replace('text-', '').replace('-300', '30').replace('-400', '30').replace('-500', '30')}`,
            color: isMe ? '#fff' : tier.color.replace('text-', '').replace('-300', '').replace('-400', '').replace('-500', ''),
          }}
        >
          {item.name.charAt(0).toUpperCase()}
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700" />
        </div>
        {isHotGap && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950 flex items-center justify-center animate-pulse">
            <Target size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex-1 min-w-0 ml-4 relative z-10">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-slate-200'}`}>
            {item.name}
          </p>
          {isMe && (
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[8px] font-black uppercase tracking-widest border border-cyan-400/20">
              {t('league.you')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <LeagueTierBadge wp={item.wp} size="sm" />

          {item.streak > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame size={10} className="text-orange-400" />
              <span className="text-orange-400 text-[10px] font-black">{item.streak}</span>
            </div>
          )}

          {/* Gap indicator */}
          {gap > 0 && !isMe && (
            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
              <Sparkles size={9} className="text-slate-600" />
              +{gap}
            </span>
          )}
        </div>
      </div>

      {/* WP score */}
      <div className="text-right shrink-0 ml-2 relative z-10">
        <p className={`font-black text-lg tracking-tight tabular-nums ${isMe ? 'text-white' : 'text-white/90'}`}>
          {item.wp.toLocaleString()}
        </p>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-end gap-1">
          <Zap size={10} className="text-amber-400" /> WP
        </p>
      </div>
    </motion.div>
  );
};