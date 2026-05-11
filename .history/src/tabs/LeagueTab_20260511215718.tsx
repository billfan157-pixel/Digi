import React, { memo, useMemo, useState, useEffect } from 'react';
import { Trophy, UserPlus, Zap, Crown, Users, Target, Search, Medal, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClubsView from '../components/ClubsView';
import AvatarFrame from '../components/AvatarFrame';
import type { Profile } from '../models';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { PodiumSection } from './League/PodiumSection';
import { LeaderboardRow } from './League/LeaderboardRow';
import { EmptyState } from './League/EmptyState';
import type { LeagueEntry, LeagueMode, LeagueView, RankInfo } from './League/types';

interface LeagueTabProps {
  leagueMode: LeagueMode;
  setLeagueMode: (mode: LeagueMode) => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
  getRankInfo: (wp: number) => RankInfo;
  profile?: Profile | null;
}

const MODE_META: Record<LeagueMode, { label: string; accent: string; icon: typeof Trophy }> = {
  public: { label: 'Cộng đồng', accent: 'text-cyan-300', icon: Trophy },
  friends: { label: 'Bạn bè', accent: 'text-emerald-300', icon: Users },
  clubs: { label: 'Câu lạc bộ', accent: 'text-purple-300', icon: Users },
};

const LeagueTab = memo(function LeagueTab({
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  getLeagueData,
  getRankInfo,
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
  const hottestStreak = sortedData.reduce((best, item) => Math.max(best, item.streak || 0), 0);
  const averageWp = sortedData.length > 0
    ? Math.round(sortedData.reduce((sum, item) => sum + item.wp, 0) / sortedData.length)
    : 0;
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

  return (
    <div className="animate-in slide-in-from-right duration-300 relative min-h-screen pb-6 bg-slate-950">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-full h-72 bg-gradient-to-b from-cyan-500/8 via-blue-500/4 to-transparent pointer-events-none blur-3xl" />
      <div className="fixed top-40 right-[-10%] h-56 w-56 rounded-full bg-amber-500/6 blur-3xl pointer-events-none" />
      <div className="fixed top-40 right-[-10%] h-48 w-48 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center pt-4 pb-3 px-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Bảng vinh danh
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Xếp hạng <Trophy size={22} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
              </h1>
            </div>
          </div>
          <button className="active:scale-95 transition-all rounded-full">
            <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
          </button>
        </div>

        {/* Stats mini bar */}
        <div className="grid grid-cols-3 gap-2 px-6 pb-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Đối thủ</p>
            <p className="text-lg font-black text-white">{sortedData.length}</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2.5 backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-300">Streak nóng</p>
            <p className="text-lg font-black text-white">{hottestStreak}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">WP TB</p>
            <p className="text-lg font-black text-white">{averageWp.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Mode tabs - pill style */}
      <div className="flex p-1 bg-slate-800/40 backdrop-blur-xl rounded-full border border-white/5 mx-6 mt-4">
        {(['public', 'friends', 'clubs'] as LeagueMode[]).map((mode) => {
          const meta = MODE_META[mode];
          return (
            <button
              key={mode}
              onClick={() => setLeagueMode(mode)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all relative ${
                leagueMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {leagueMode === mode && (
                <motion.div
                  layoutId="leaguePill"
                  className="absolute inset-0 rounded-full bg-slate-700/60 border border-white/10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 mt-4 space-y-4">
        {/* Add friend button */}
        {leagueMode === 'friends' && (
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-full py-3.5 rounded-2xl border border-dashed border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-sm font-bold flex items-center justify-center gap-2.5 active:scale-95 transition-all hover:bg-emerald-500/20"
          >
            <UserPlus size={18} /> Tìm và thách đấu bạn bè
          </button>
        )}

        {leagueMode === 'clubs' ? (
          currentUser?.id ? <ClubsView userId={currentUser.id} /> : <EmptyState searchQuery={searchQuery} leagueMode={leagueMode} onReset={() => { setSearchQuery(''); setLeagueView('all'); }} onAddFriend={() => setShowAddFriend(true)} />
        ) : (
          <div className="space-y-4">
            {/* Spotlight compact */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hạng của bạn</p>
                    {nextTarget && (
                      <span className="text-[9px] font-bold text-emerald-400/70 flex items-center gap-1">
                        <Target size={10} /> Cần {wpNeeded.toLocaleString()} WP
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-white">
                    {currentRankPosition ? `#${currentRankPosition}` : 'Chưa xếp hạng'}
                  </p>
                  {nextTarget && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                            style={{ width: `${Math.min(100, ((currentUser?.wp || 0) / nextTarget.wp) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                          {(Math.round(((currentUser?.wp || 0) / nextTarget.wp) * 100))}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Còn <span className="text-emerald-400 font-bold">{wpNeeded.toLocaleString()} WP</span> để vượt <span className="text-white font-semibold">{nextTarget.name}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">WP</p>
                  <p className="text-2xl font-black text-white">{(currentUser?.wp || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Search + Filters inline */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-white/5 transition-all ${
                  searchFocused ? 'flex-[3] border-cyan-500/30' : 'flex-1'
                }`}
              >
                <Search size={14} className="text-slate-500 shrink-0" />
                <AnimatePresence>
                  {searchFocused && (
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '100%', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên..."
                      onBlur={() => !searchQuery && setSearchFocused(false)}
                      className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none w-full"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                {!searchFocused && (
                  <button onClick={() => setSearchFocused(true)} className="text-xs text-slate-500 whitespace-nowrap">
                    Tìm kiếm
                  </button>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setLeagueView(view)}
                    className={`rounded-lg px-2.5 py-2 text-[10px] font-bold transition-all shrink-0 whitespace-nowrap ${
                      leagueView === view
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {view === 'all' ? 'Tất cả' : view === 'top10' ? 'Top 10' : 'Gần bạn'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[10px] font-bold text-slate-400 shrink-0">
                <Users size={12} />
                {displayData.length}
              </div>
            </div>

            {searchedData.length === 0 ? (
              <EmptyState searchQuery={searchQuery} leagueMode={leagueMode} onReset={() => { setSearchQuery(''); setLeagueView('all'); }} onAddFriend={() => setShowAddFriend(true)} />
            ) : (
              <>
                {/* Podium */}
                {top3.length > 0 && leagueView !== 'around' && (
                  <PodiumSection top3={top3} />
                )}

                {/* Leaderboard */}
                {leaderboardRows.length > 0 && (
                  <div className="space-y-2">
                    {leaderboardRows.map((item) => {
                      const actualRank = sortedData.findIndex(
                        (entry) => entry.id === item.id && entry.name === item.name,
                      ) + 1;
                      const rankInfo = getRankInfo(item.wp);
                      const previousUser = actualRank > 1 ? sortedData[actualRank - 2] : null;
                      const gap = previousUser ? Math.max(previousUser.wp - item.wp, 0) : 0;

                      return (
                        <LeaderboardRow
                          key={item.id || `row-${actualRank}`}
                          item={item}
                          actualRank={actualRank}
                          rankInfo={rankInfo}
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
      </div>
    </div>
  );
});

export default LeagueTab;