import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, UserPlus, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Profile } from '@/models';
import type { LeagueEntry, LeagueView } from '@/tabs/League/types';
import { PodiumSection } from '@/tabs/League/PodiumSection';
import { LeaderboardRow } from '@/tabs/League/LeaderboardRow';
import { EmptyState } from '@/tabs/League/EmptyState';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            {t('compete.ranking', 'Xếp hạng')}
          </h2>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-800/60 border border-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-slate-700/60"
          >
            <X size={16} className="text-slate-300" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Mode filter: public / friends */}
      <div className="relative flex p-1 shadow-sm border border-white/5 bg-slate-950/20 rounded-xl backdrop-blur-sm">
        {(['public', 'friends'] as const).map((mode) => {
          const meta = MODE_META[mode];
          const Icon = meta.icon;
          return (
            <button
              key={mode}
              onClick={() => setLeagueMode(mode)}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all relative ${
                leagueMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {leagueMode === mode && (
                <motion.div
                  layoutId="rankingModePill"
                  className="absolute inset-0 rounded-lg bg-slate-800/60 border border-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px]">
                <Icon size={12} />
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

      {/* Search + Quick Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <div className="flex items-center gap-3 bg-slate-900/30 rounded-xl px-4 py-3 border border-white/5 focus-within:border-cyan-500/50 transition-all">
            <Search size={16} className="text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('league.search_placeholder')}
              className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none w-full font-bold"
            />
          </div>
        </div>

        <div className="relative flex p-1 shadow-sm border border-white/5 bg-slate-950/20 rounded-xl overflow-x-auto scrollbar-hide">
          {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
            <button
              key={view}
              onClick={() => setLeagueView(view)}
              className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                leagueView === view
                  ? 'bg-slate-800/60 text-white border border-white/10'
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
  );
});

export default RankingView;
