import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, TrendingUp, Swords, Trophy } from 'lucide-react';
import { LeagueTierBadge } from '@/tabs/League/LeagueTierBadge';
import { getTierByWP } from '@/tabs/League/types';
import type { Profile } from '@/models';
import type { ArenaStats } from '@/hooks/useArenaData';

interface CompeteHeroProps {
  profile: Profile | null;
  arenaStats: ArenaStats;
  onShowRanking?: () => void;
}

const CompeteHero = React.memo(function CompeteHero({ profile, arenaStats, onShowRanking }: CompeteHeroProps) {
  const { t } = useTranslation();
  const nickname = profile?.nickname ?? '';
  const wp = arenaStats.wp;
  const rank = arenaStats.rank;
  const tier = getTierByWP(wp);

  const totalMatches = arenaStats.wins + arenaStats.losses + arenaStats.draws;
  const winRate = totalMatches > 0 ? Math.round((arenaStats.wins / totalMatches) * 100) : 0;

  return (
    <div className="mx-5 mb-4 p-5 rounded-[2rem] bg-slate-800/40 border border-white/5 backdrop-blur-md relative overflow-hidden">
      {/* Tier glow background */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${tier.bg} blur-3xl opacity-30 pointer-events-none`} />

      <div className="relative z-10">
        {/* Row 1: Rank + WP */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {nickname || t('common.guest', 'Khách')} · {t('league.rank', 'Hạng')} #{rank}
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
                {t('compete.ranking', 'Xếp hạng')}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Tier progress bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400/80 transition-all duration-500"
              style={{ width: `${Math.min((wp % 3000) / 30, 100)}%` }}
            />
          </div>
        </div>

        {/* Row 3: Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <TrendingUp size={16} className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{winRate}%</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.win_rate', 'Tỷ lệ thắng')}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <Zap size={16} className="text-amber-400" />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{arenaStats.winStreak}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.streak', 'Chuỗi thắng')}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <Swords size={16} className="text-cyan-400" />
            <span className="text-lg font-black text-white mt-1 tabular-nums">{totalMatches}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t('compete.total_matches', 'Tổng trận')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CompeteHero;
