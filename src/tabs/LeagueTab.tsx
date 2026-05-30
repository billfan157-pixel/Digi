import React, { memo, useMemo, useState, useEffect, Suspense } from 'react';
import { Trophy, UserPlus, Zap, Users, Search, Target, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TabHeader from '../components/layout/TabHeader';
import ClubsView from '../components/ClubsView';
import type { Profile } from '../models';
import { useUIStore } from '../store/useUIStore';
import { useIsPremium } from '../hooks/useIsPremium';
import { PodiumSection } from './League/PodiumSection';
import { LeaderboardRow } from './League/LeaderboardRow';
import { EmptyState } from './League/EmptyState';
import { LeagueTierBadge } from './League/LeagueTierBadge';
import { getTierByWP } from './League/types';
import type { LeagueEntry, LeagueMode, LeagueView } from './League/types';

const ArenaTab = React.lazy(() => import('./ArenaTab'));

interface LeagueTabProps {
  leagueMode: LeagueMode;
  setLeagueMode: (mode: LeagueMode) => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
  profile?: Profile | null;
}

const LeagueTab = memo(function LeagueTab({
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  getLeagueData,
  profile,
}: LeagueTabProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueView, setLeagueView] = useState<LeagueView>('all');
  const competeView = useUIStore(s => s.leagueCompeteView);
  const setCompeteView = (view: 'ranking' | 'arena') => useUIStore.getState().setLeagueCompeteView(view);
  const isPremium = useIsPremium();

  const MODE_META: Record<LeagueMode, { label: string; accent: string; icon: React.ComponentType<{ size?: number }> }> = useMemo(() => ({
    public: { label: t('league.mode_public'), accent: 'text-cyan-300', icon: Trophy },
    friends: { label: t('league.mode_friends'), accent: 'text-emerald-300', icon: Users },
    clubs: { label: t('league.mode_clubs'), accent: 'text-purple-300', icon: Users },
  }), [t]);

  useEffect(() => { const t = window.setTimeout(() => { setSearchQuery(''); setLeagueView('all'); }, 0); return () => window.clearTimeout(t); }, [leagueMode]);

  const leagueData = useMemo(() => getLeagueData(), [getLeagueData]);

  const sortedData = useMemo(
    () => [...leagueData].sort((left, right) => right.wp - left.wp),
    [leagueData],
  );

  const currentUserIndex = sortedData.findIndex((item) => item.isMe);
  const currentUser = currentUserIndex >= 0 ? sortedData[currentUserIndex] : undefined;
  const currentRankPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null;
  const nextTarget = currentUserIndex > 0 ? sortedData[currentUserIndex - 1] : null;
  const wpNeeded = nextTarget ? nextTarget.wp - (currentUser?.wp || 0) : 0;

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

  const podiumSource = leagueView === 'all' ? searchedData : sortedData;
  const top3 = podiumSource.slice(0, 3);
  const leaderboardRows = displayData.filter(
    (item) => !top3.some((topItem) => topItem.id === item.id && topItem.name === item.name),
  );

  const myTier = currentUser ? getTierByWP(currentUser.wp) : null;

  return (
    <div className="animate-in slide-in-from-right duration-300 relative pb-12">
      {/* Dynamic Glow based on Tier */}
      <div className={`fixed top-0 left-0 right-0 h-96 bg-gradient-to-b ${myTier ? myTier.bg.replace('bg-', 'from-').replace('/10', '/20') : 'from-cyan-500/10'} to-transparent pointer-events-none blur-[100px] z-[-1] transition-colors duration-1000`} />

      <div className="mb-4">
        <TabHeader
          label={competeView === 'ranking' ? t('league.ranking') : 'Võ Đài'}
          title={
            <span className="flex items-center gap-2">
              {competeView === 'ranking' ? t('league.ranking') : 'Võ Đài'}
              {competeView === 'ranking' ? <Trophy size={22} className="text-yellow-400" /> : <Swords size={22} className="text-rose-500" />}
            </span>
          }
          profile={profile}
          actionIcon={competeView === 'ranking' ? <Target size={18} /> : undefined}
          onActionClick={competeView === 'ranking' ? () => useUIStore.getState().setShowChallengeModal(true) : undefined}
          onAvatarClick={() => useUIStore.getState().setShowMainMenu(true)}
        />
      </div>

      {/* ── Compete view toggle ── */}
      <div className="px-6 mb-4">
        <div className="relative flex p-1 shadow-sm border-[var(--theme-border-width,1px)] border-[var(--theme-border-glass,rgba(255,255,255,0.08))] bg-slate-950/20 rounded-[var(--theme-border-radius-inner,12px)] backdrop-blur-[var(--theme-blur,40px)]">
          {(['ranking', 'arena'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCompeteView(view)}
              className={`flex-1 py-2.5 text-xs font-black rounded-[calc(var(--theme-border-radius-inner,12px)-4px)] transition-all relative ${
                competeView === view ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {competeView === view && (
                <motion.div
                  layoutId="competePill"
                  className="absolute inset-0 rounded-[calc(var(--theme-border-radius-inner,12px)-4px)] bg-slate-800/60 border border-[var(--theme-border-glass,rgba(255,255,255,0.1))] shadow-[0_0_12px_var(--theme-glow-color,rgba(34,211,238,0.15))]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px]">
                {view === 'ranking' ? <Trophy size={12} /> : <Swords size={12} />}
                {view === 'ranking' ? 'Xếp hạng' : 'Võ đài'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {competeView === 'arena' && (
        <Suspense fallback={<div className="h-40 rounded-3xl bg-slate-900/40 border border-white/5 animate-pulse" />}>
          <ArenaTab profile={profile ?? null} />
        </Suspense>
      )}

      {competeView === 'ranking' && (
        <>
      {/* ── Mode pills ── */}
      <div className="px-6 mb-6">
        <div className="relative flex p-1 shadow-sm border-[var(--theme-border-width,1px)] border-[var(--theme-border-glass,rgba(255,255,255,0.08))] bg-slate-950/20 rounded-[var(--theme-border-radius-inner,12px)] backdrop-blur-[var(--theme-blur,40px)]">
          {(['public', 'friends', 'clubs'] as LeagueMode[]).map((mode) => {
            const meta = MODE_META[mode];
            return (
              <button
                key={mode}
                onClick={() => setLeagueMode(mode)}
                className={`flex-1 py-2.5 text-xs font-black rounded-[calc(var(--theme-border-radius-inner,12px)-4px)] transition-all relative ${
                  leagueMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {leagueMode === mode && (
                  <motion.div
                    layoutId="leaguePill"
                    className="absolute inset-0 rounded-[calc(var(--theme-border-radius-inner,12px)-4px)] bg-slate-800/60 border border-[var(--theme-border-glass,rgba(255,255,255,0.1))] shadow-[0_0_12px_var(--theme-glow-color,rgba(34,211,238,0.15))]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px]">
                  <meta.icon size={12} />
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {leagueMode === 'clubs' ? (
          currentUser?.id ? (
            <ClubsView userId={currentUser.id} />
          ) : (
             <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-[var(--theme-border-glass,rgba(255,255,255,0.1))] rounded-[var(--theme-border-radius,24px)]">
                <Users size={32} className="opacity-20" />
                <p className="text-xs font-bold">{t('league.join_club_to_compete')}</p>
             </div>
          )
        ) : (
          <div className="space-y-6">
            {/* ── Leaderboard Privacy Warning Banner ── */}
            {profile?.leaderboard_opt_in === false && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-[var(--theme-border-radius,16px)] p-4 flex items-center justify-between gap-4 backdrop-blur-[var(--theme-blur,40px)]"
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
                      // Dispatch event to reload league data
                      window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
                    } catch {
                      toast.error(t('league.ranking_error'), { id: toastId });
                    }
                  }}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-[var(--theme-border-radius-inner,12px)] text-[10px] font-black uppercase tracking-wider border border-yellow-500/30 whitespace-nowrap active:scale-95 transition-all"
                >
                  {t('league.show_account')}
                </button>
              </motion.div>
            )}

            {/* ── Hero Profile (Spotlight) ── */}
            {currentUser && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`relative overflow-hidden rounded-[var(--theme-border-radius,24px)] border-2 ${myTier?.border || 'border-[var(--theme-border-glass)]'} bg-slate-900/50 backdrop-blur-[var(--theme-blur,40px)] p-6 shadow-2xl shadow-[var(--theme-glow-color,rgba(0,0,0,0))]`}
               >
                  {/* Aura animation */}
                  <div className={`absolute -top-12 -right-12 w-40 h-40 ${myTier?.bg} blur-[60px] rounded-full animate-pulse`} />
                  
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <LeagueTierBadge wp={currentUser.wp} size="md" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('league.your_rank')}</span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                           <h2 className="text-4xl font-black text-white">#{currentRankPosition}</h2>
                           {nextTarget && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                 <Target size={10} />
                                 <span>{t('league.chase_target', { name: nextTarget.name })}</span>
                              </div>
                           )}
                        </div>
                        
                        {nextTarget && (
                           <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-end">
                                 <p className="text-[10px] font-bold text-slate-400">{t('league.overcome_progress')}</p>
                                 <p className="text-[10px] font-black text-emerald-400">+{wpNeeded.toLocaleString()} WP</p>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${Math.min(100, (currentUser.wp / nextTarget.wp) * 100)}%` }}
                                   className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" 
                                 />
                              </div>
                           </div>
                        )}
                     </div>
                     
                     <div className="text-right">
                        <div className="p-3 bg-white/5 rounded-[var(--theme-border-radius-inner,12px)] border border-white/5 mb-2 inline-block">
                           <Zap size={24} className="text-amber-400" />
                        </div>
                        <p className="text-2xl font-black text-white">{currentUser.wp.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wellness Points</p>
                     </div>
                  </div>
               </motion.div>
            )}

            {/* ── Search + Quick Filters ── */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 group">
                <div className="flex items-center gap-3 bg-slate-900/30 rounded-[var(--theme-border-radius-inner,12px)] px-4 py-3 border border-[var(--theme-border-glass,rgba(255,255,255,0.05))] focus-within:border-cyan-500/50 transition-all">
                  <Search size={16} className="text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('league.search_placeholder')}
                    className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none w-full font-bold"
                  />
                </div>
              </div>

              <div className="relative flex p-1 shadow-sm border-[var(--theme-border-width,1px)] border-[var(--theme-border-glass,rgba(255,255,255,0.08))] bg-slate-950/20 rounded-[var(--theme-border-radius-inner,12px)] overflow-x-auto scrollbar-hide">
                {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setLeagueView(view)}
                    className={`rounded-[calc(var(--theme-border-radius-inner,12px)-4px)] px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      leagueView === view
                        ? 'bg-slate-800/60 text-white border border-[var(--theme-border-glass,rgba(255,255,255,0.1))] shadow-lg shadow-[var(--theme-glow-color,rgba(0,0,0,0))]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {view === 'all' ? t('league.view_all') : view === 'top10' ? t('league.view_top10') : t('league.view_nearby')}
                  </button>
                ))}
              </div>
            </div>

            {searchedData.length === 0 ? (
              <EmptyState
                searchQuery={searchQuery}
                leagueMode={leagueMode}
                onReset={() => { setSearchQuery(''); setLeagueView('all'); }}
                onAddFriend={() => setShowAddFriend(true)}
              />
            ) : (
              <>
                {/* Podium */}
                {top3.length > 0 && leagueView !== 'around' && (
                  <PodiumSection top3={top3} />
                )}

                {/* Leaderboard */}
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
                          isPremium={isPremium}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {leagueMode === 'friends' && (
           <button 
             onClick={() => setShowAddFriend(true)}
             className="w-full py-4 rounded-[var(--theme-border-radius,24px)] border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/50"
           >
              <UserPlus size={18} />
              {t('league.challenge_friends')}
           </button>
        )}
      </div>
        </>
      )}
    </div>
  );
});

export default LeagueTab;