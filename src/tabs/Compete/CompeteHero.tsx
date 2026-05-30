import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Swords, Trophy } from 'lucide-react';
import { LeagueTierBadge } from '@/tabs/League/LeagueTierBadge';
import { getTierByWP } from '@/tabs/League/types';
import type { Profile } from '@/models';
import type { ArenaStats } from '@/hooks/useArenaData';
import { glassCard, glassInner } from '@/styles/glass';

interface CompeteHeroProps {
  profile: Profile | null;
  arenaStats: ArenaStats;
  onShowRanking?: () => void;
}

const TIER_BG: Record<string, string> = {
  bronze: 'from-orange-700/10 to-orange-600/10',
  silver: 'from-slate-400/10 to-slate-300/10',
  gold: 'from-amber-500/10 to-yellow-500/10',
  platinum: 'from-emerald-500/10 to-teal-500/10',
  diamond: 'from-blue-500/10 to-cyan-500/10',
  master: 'from-purple-500/10 to-violet-500/10',
  grandmaster: 'from-pink-500/10 to-purple-500/10',
};

const TIER_GLOW: Record<string, string> = {
  bronze: 'bg-orange-500/15',
  silver: 'bg-slate-300/15',
  gold: 'bg-amber-500/15',
  platinum: 'bg-emerald-500/15',
  diamond: 'bg-cyan-500/15',
  master: 'bg-purple-500/15',
  grandmaster: 'bg-pink-500/15',
};

function FloatingParticle({ color, size, top, left, delay, duration }: { color: string; size: number; top: string; left: string; delay: number; duration: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[1px] pointer-events-none ${color}`}
      style={{ width: size, height: size, top, left }}
      animate={{
        y: [0, -12, 0, 8, 0],
        x: [0, 6, -4, 2, 0],
        opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

const TIER_KEY_MAP: Record<string, string> = {
  bronze: 'bronze', silver: 'silver', gold: 'gold',
  platinum: 'platinum', diamond: 'diamond', master: 'master', grandmaster: 'grandmaster',
};

const CompeteHero = React.memo(function CompeteHero({ profile, arenaStats, onShowRanking }: CompeteHeroProps) {
  const { t } = useTranslation();
  const nickname = profile?.nickname ?? '';
  const wp = arenaStats.wp;
  const rank = arenaStats.rank;
  const tier = getTierByWP(wp);
  const tierKey = TIER_KEY_MAP[tier.name.toLowerCase()] || 'bronze';
  const tierBg = TIER_BG[tierKey] || TIER_BG.bronze;
  const tierGlow = TIER_GLOW[tierKey] || TIER_GLOW.bronze;

  const totalMatches = arenaStats.wins + arenaStats.losses + arenaStats.draws;
  const winRate = totalMatches > 0 ? Math.round((arenaStats.wins / totalMatches) * 100) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`mx-5 mb-4 ${glassCard} rounded-[2rem] p-5 relative overflow-hidden group cursor-default bg-gradient-to-br ${tierBg}`}
    >
      <div className={`absolute -right-10 -top-10 w-36 h-36 ${tierGlow} blur-[60px] rounded-full group-hover:opacity-100 transition-all duration-700 pointer-events-none`} />
      <FloatingParticle color="bg-amber-400/20" size={3} top="20%" left="75%" delay={0.5} duration={5.5} />
      <FloatingParticle color={`${tierGlow.replace('/15', '/20')}`} size={2} top="70%" left="15%" delay={1.8} duration={6.2} />

      <div className="relative z-10">
        {/* Row 1: Rank + WP */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {nickname || t('common.guest', 'Guest')} · {t('league.rank', 'Rank')} #{rank}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <LeagueTierBadge wp={wp} showName size="sm" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('league.wp', 'WP')}</span>
            <div className="flex items-center gap-1">
              <Zap size={16} className="text-amber-400" />
              <span className="text-xl font-black text-white tabular-nums">{wp.toLocaleString()}</span>
            </div>
            {onShowRanking && (
              <button
                onClick={onShowRanking}
                className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 active:scale-95 transition-all"
              >
                <Trophy size={12} />
                {t('compete.ranking', 'Ranking')}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Tier progress bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min((wp % 3000) / 30, 100)}%` }}
            />
          </div>
        </div>

        {/* Row 3: Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`flex flex-col items-center p-3 ${glassInner}`}>
            <TrendingUp size={16} className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{winRate}%</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.win_rate', 'Win Rate')}</span>
          </div>
          <div className={`flex flex-col items-center p-3 ${glassInner}`}>
            <Zap size={16} className="text-amber-400" />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{arenaStats.winStreak}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.streak', 'Streak')}</span>
          </div>
          <div className={`flex flex-col items-center p-3 ${glassInner}`}>
            <Swords size={16} className="text-cyan-400" />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{totalMatches}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.total_matches', 'Matches')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default CompeteHero;
