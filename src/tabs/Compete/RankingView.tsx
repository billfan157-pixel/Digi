import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, UserPlus, Search, X, TrendingUp, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Profile } from '@/models';
import type { LeagueEntry, LeagueView } from '@/tabs/League/types';
import { PodiumSection } from '@/tabs/League/PodiumSection';
import { LeaderboardRow } from '@/tabs/League/LeaderboardRow';
import { EmptyState } from '@/tabs/League/EmptyState';
import { LeagueTierBadge } from '@/tabs/League/LeagueTierBadge';
import { getTierByWP } from '@/tabs/League/types';
import { glassControl, activeTabClass, glassInner } from '@/styles/glass';

interface RankingViewProps {
  leagueMode: 'public' | 'friends';
  setLeagueMode: (mode: 'public' | 'friends') => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
  profile?: Profile | null;
  onBack?: () => void;
}

const MODE_META: Record<'public' | 'friends', { labelKey: string; accent: string; icon: React.ComponentType<{ size?: number }> }> = {
  public: { labelKey: 'league.mode_public', accent: 'text-cyan-300', icon: Trophy },
  friends: { labelKey: 'league.mode_friends', accent: 'text-emerald-300', icon: Users },
};

const RankingView = React.memo(function RankingView({
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  getLeagueData,
  profile,
  onBack,
}: RankingViewProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueView, setLeagueView] = useState<LeagueView>('all');

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearchQuery(''); setLeagueView('all'); }, 0);
    return () => window.clearTimeout(timer);
  }, [leagueMode]);

  const leagueData = useMemo(() => getLeagueData(), [getLeagueData]);

  const sortedData = useMemo(
    () => [...leagueData].sort((left, right) => right.wp - left.wp),
    [leagueData],
  );

  const currentUserIndex = sortedData.findIndex((item) => item.isMe);

  const searchedData = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return sortedData;
    return sortedData.filter((item) =>
      item.name.toLowerCase().includes(keyword) || item.dept.toLowerCase().includes(keyword),
    );
  }, [searchQuery, sortedData]);

  const displayData = useMemo(() => {
    if (leagueView === 'top10') return searchedData.slice(0, 10);
    if (leagueView === 'around' && currentUserIndex >= 0) {
      const start = Math.max(0, currentUserIndex - 2);
      const end = Math.min(searchedData.length, currentUserIndex + 3);
      return searchedData.slice(start, end);
    }
    return searchedData;
  }, [leagueView, searchedData, currentUserIndex]);

  const top3 = searchedData.slice(0, 3);
  const leaderboardRows = displayData.filter(
    (item) => !top3.some((topItem) => topItem.id === item.id && topItem.name === item.name),
  );

  const myRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const myEntry = myRank ? sortedData[currentUserIndex] : null;
  const myWP = myEntry?.wp ?? 0;
  const myTier = getTierByWP(myWP);
  const nextUser = myRank && myRank > 1 ? sortedData[currentUserIndex - 1] : null;
  const gap = nextUser ? Math.max(nextUser.wp - myWP, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col">
      {/* ===== LUXURY HEADER ===== */}
      <div className="relative overflow-hidden border-b border-[var(--theme-border-glass,rgba(34,211,238,0.06))]">
        {/* Aurora background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
        {/* Floating particles */}
        <div className="absolute top-1/4 left-[10%] w-1 h-1 bg-cyan-400/30 rounded-full blur-[1px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-3/4 left-[85%] w-1.5 h-1.5 bg-amber-400/20 rounded-full blur-[1px]" style={{ animation: 'pulse 3.5s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-[45%] w-0.5 h-0.5 bg-purple-400/25 rounded-full" style={{ animation: 'pulse 5s ease-in-out infinite 1s' }} />

        <div className="relative flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="relative"
            >
              <Trophy size={24} className="text-yellow-400 relative z-10" />
              <div className="absolute inset-0 blur-md bg-yellow-400/40 rounded-full" />
            </motion.div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {t('compete.ranking')}
              </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('compete.top_players', 'Top Players')}
                </p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-[var(--theme-surface-glass,rgba(34,211,238,0.03))] backdrop-blur-[var(--theme-blur,40px)] border border-[var(--theme-border-glass,rgba(34,211,238,0.1))] flex items-center justify-center active:scale-95 transition-all hover:bg-[var(--theme-surface-glass,rgba(34,211,238,0.06))] hover:border-[var(--theme-border-glass,rgba(34,211,238,0.15))]"
            >
              <X size={18} className="text-slate-300" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== MY RANK SPOTLIGHT CARD ===== */}
        {myRank && myEntry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mt-5 mb-4 relative overflow-hidden rounded-[var(--theme-border-radius,28px)] p-5 border backdrop-blur-[var(--theme-blur,40px)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]"
            style={{
              background: `linear-gradient(135deg, ${myTier.color}15 0%, transparent 60%)`,
              borderColor: `${myTier.color}30`,
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
              style={{ background: `${myTier.color}20` }}
            />
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
            </motion.div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-yellow-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t('compete.your_rank', 'Your Rank')}
                  </span>
                </div>
                <span className="text-2xl font-black text-white tabular-nums">
                  #{myRank}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black border"
                    style={{
                      background: `${myTier.color}20`,
                      borderColor: `${myTier.color}40`,
                      color: myTier.color,
                    }}
                  >
                    {myEntry.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{myEntry.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <LeagueTierBadge wp={myWP} showName size="sm" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-lg font-black text-white tabular-nums">{myWP.toLocaleString()}</span>
                  </div>
                  {gap > 0 && (
                    <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-rose-400">
                      <TrendingUp size={10} />
                      {t('compete.gap_above', { gap: gap.toLocaleString() })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="px-5 py-6 space-y-6">
          {/* Mode filter: public / friends — Premium Pills */}
      <div className={glassControl}>
        {(['public', 'friends'] as const).map((mode) => {
          const meta = MODE_META[mode];
          const Icon = meta.icon;
          const isActive = leagueMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setLeagueMode(mode)}
              className={`flex-1 py-3 text-xs font-black rounded-[var(--theme-border-radius-inner,8px)] transition-all relative overflow-hidden ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="rankingModePill"
                  className={activeTabClass}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                <span className={isActive ? meta.accent : ''}><Icon size={14} /></span>
                {t(meta.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Privacy warning */}
      {profile?.leaderboard_opt_in === false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-sm"
        >
          <div className="flex-1">
            <p className="text-xs font-bold text-yellow-400">{t('league.ranking_hidden')}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t('league.ranking_hidden_desc')}</p>
          </div>
          <button
            onClick={async () => {
              const { toast } = await import('sonner');
              const toastId = toast.loading(t('league.enabling_ranking'));
              try {
                const { supabase } = await import('@/lib/supabase');
                const { error } = await supabase
                  .from('profiles')
                  .update({ leaderboard_opt_in: true })
                  .eq('id', profile.id);
                if (error) throw error;

                const { useAppStore } = await import('@/store/useAppStore');
                const currentProfile = useAppStore.getState().profile;
                if (currentProfile) {
                  useAppStore.getState().setAppState({
                    profile: { ...currentProfile, leaderboard_opt_in: true }
                  });
                }

                toast.success(t('league.ranking_enabled'), { id: toastId });
                window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
              } catch {
                toast.error(t('league.ranking_error'), { id: toastId });
              }
            }}
            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-yellow-500/30 whitespace-nowrap active:scale-95 transition-all"
          >
            {t('league.show_account')}
          </button>
        </motion.div>
      )}

      {/* Search + Quick Filters — Refined */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <div className={`flex items-center gap-3 ${glassInner} px-4 py-3.5 transition-all duration-300 focus-within:border-cyan-500/40 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.1)]`}>
            <Search size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('league.search_placeholder')}
              className="bg-transparent text-xs text-white placeholder:italic placeholder:text-slate-600 outline-none w-full font-bold"
            />
          </div>
        </div>

        <div className={`${glassControl} overflow-x-auto scrollbar-hide`}>
          {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
            <button
              key={view}
              onClick={() => setLeagueView(view)}
              className={`px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-[var(--theme-border-radius-inner,8px)] ${
                leagueView === view
                  ? 'text-white border border-[var(--theme-border-glass,rgba(34,211,238,0.15))] bg-[var(--theme-surface-glass,rgba(34,211,238,0.06))] shadow-[0_0_12px_var(--theme-glow-color,rgba(34,211,238,0.1))]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {view === 'all' ? t('league.view_all') : view === 'top10' ? t('league.view_top10') : t('league.view_nearby')}
            </button>
          ))}
        </div>
      </div>

      {/* Data display */}
      {searchedData.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          leagueMode={leagueMode}
          onReset={() => { setSearchQuery(''); setLeagueView('all'); }}
          onAddFriend={() => setShowAddFriend(true)}
        />
      ) : (
        <>
          {top3.length > 0 && leagueView !== 'around' && (
            <PodiumSection top3={top3} />
          )}

          {leaderboardRows.length > 0 && (
            <div className="space-y-3">
              {leaderboardRows.map((item) => {
                const actualRank = sortedData.findIndex(
                  (entry) => entry.id === item.id && entry.name === item.name,
                ) + 1;
                const previousUser = actualRank > 1 ? sortedData[actualRank - 2] : null;
                const gap = previousUser ? Math.max(previousUser.wp - item.wp, 0) : 0;

                return (
                  <LeaderboardRow
                    key={item.id || `row-${actualRank}`}
                    item={item}
                    actualRank={actualRank}
                    gap={gap}
                    isPremium={false}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add friend button */}
      {leagueMode === 'friends' && (
        <button
          onClick={() => setShowAddFriend(true)}
          className="w-full py-4 rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/50"
        >
          <UserPlus size={18} />
          {t('league.challenge_friends')}
        </button>
      )}
      </div>
    </div>
  </div>
);
});

export default RankingView;
