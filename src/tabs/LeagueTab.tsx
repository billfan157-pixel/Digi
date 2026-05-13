import React, { memo, useMemo, useState, useEffect } from 'react';
import { Trophy, UserPlus, Zap, Users, Search, Medal, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import TabHeader from '../components/layout/TabHeader';
import ClubsView from '../components/ClubsView';
import type { Profile } from '../models';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { PodiumSection } from './League/PodiumSection';
import { LeaderboardRow } from './League/LeaderboardRow';
import { EmptyState } from './League/EmptyState';
import { LeagueTierBadge } from './League/LeagueTierBadge';
import { getTierByWP } from './League/types';
import type { LeagueEntry, LeagueMode, LeagueView } from './League/types';

interface LeagueTabProps {
  leagueMode: LeagueMode;
  setLeagueMode: (mode: LeagueMode) => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
  profile?: Profile | null;
}

const MODE_META: Record<LeagueMode, { label: string; accent: string; icon: any }> = {
  public: { label: 'Cộng đồng', accent: 'text-cyan-300', icon: Trophy },
  friends: { label: 'Bạn bè', accent: 'text-emerald-300', icon: Users },
  clubs: { label: 'Câu lạc bộ', accent: 'text-purple-300', icon: Users },
};

const LeagueTab = memo(function LeagueTab({
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  getLeagueData,
  profile,
}: LeagueTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueView, setLeagueView] = useState<LeagueView>('all');
  const isPremium = useAppStore(useShallow(s => s.isPremium));

  useEffect(() => { setSearchQuery(''); setLeagueView('all'); }, [leagueMode]);

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
          label="Đấu trường"
          title={<span className="flex items-center gap-2">Xếp hạng <Trophy size={22} className="text-yellow-400" /></span>}
          profile={profile}
          actionIcon={<Medal size={18} />}
        />
      </div>

      {/* ── Mode pills ── */}
      <div className="px-6 mb-6">
        <div className="flex p-1 bg-slate-800/30 backdrop-blur-2xl rounded-2xl border border-white/5">
          {(['public', 'friends', 'clubs'] as LeagueMode[]).map((mode) => {
            const meta = MODE_META[mode];
            return (
              <button
                key={mode}
                onClick={() => setLeagueMode(mode)}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all relative ${
                  leagueMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {leagueMode === mode && (
                  <motion.div
                    layoutId="leaguePill"
                    className="absolute inset-0 rounded-xl bg-slate-700/60 border border-white/10"
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
             <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-white/10 rounded-3xl">
                <Users size={32} className="opacity-20" />
                <p className="text-xs font-bold">Tham gia CLB để so tài</p>
             </div>
          )
        ) : (
          <div className="space-y-6">
            {/* ── Hero Profile (Spotlight) ── */}
            {currentUser && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`relative overflow-hidden rounded-[2rem] border-2 ${myTier?.border} bg-slate-900/40 p-6 backdrop-blur-3xl shadow-2xl`}
               >
                  {/* Aura animation */}
                  <div className={`absolute -top-12 -right-12 w-40 h-40 ${myTier?.bg} blur-[60px] rounded-full animate-pulse`} />
                  
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <LeagueTierBadge wp={currentUser.wp} size="md" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hạng của bạn</span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                           <h2 className="text-4xl font-black text-white">#{currentRankPosition}</h2>
                           {nextTarget && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                 <Target size={10} />
                                 <span>Đuổi kịp {nextTarget.name}</span>
                              </div>
                           )}
                        </div>
                        
                        {nextTarget && (
                           <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-end">
                                 <p className="text-[10px] font-bold text-slate-400">Tiến độ vượt cấp</p>
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
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 mb-2 inline-block">
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
                <div className="flex items-center gap-3 bg-slate-800/40 rounded-2xl px-4 py-3 border border-white/5 focus-within:border-cyan-500/30 transition-all">
                  <Search size={16} className="text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm đối thủ..."
                    className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none w-full font-bold"
                  />
                </div>
              </div>

              <div className="flex p-1 bg-slate-800/40 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
                {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setLeagueView(view)}
                    className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      leagueView === view
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {view === 'all' ? 'Tất cả' : view === 'top10' ? 'Top 10' : 'Gần bạn'}
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
             className="w-full py-4 rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
              <UserPlus size={18} />
              Thách đấu thêm bạn bè
           </button>
        )}
      </div>
    </div>
  );
});

export default LeagueTab;