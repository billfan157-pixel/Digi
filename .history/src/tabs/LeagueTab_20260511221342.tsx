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

const STAT_CARDS = [
  {
    key: 'doi-thu',
    label: 'Đối thủ',
    icon: Users,
    border: 'border-cyan-500/15',
    bg: 'bg-cyan-500/[0.06]',
    glow: 'bg-cyan-400/10',
    labelColor: 'text-cyan-300/80',
    iconColor: 'text-cyan-300/50',
  },
  {
    key: 'streak',
    label: 'Streak nóng',
    icon: Zap,
    border: 'border-orange-500/15',
    bg: 'bg-orange-500/[0.06]',
    glow: 'bg-orange-400/10',
    labelColor: 'text-orange-300/80',
    iconColor: 'text-orange-300/50',
  },
  {
    key: 'wp-tb',
    label: 'WP TB',
    icon: TrendingUp,
    border: 'border-emerald-500/15',
    bg: 'bg-emerald-500/[0.06]',
    glow: 'bg-emerald-400/10',
    labelColor: 'text-emerald-300/80',
    iconColor: 'text-emerald-300/50',
  },
];

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
      <div className="fixed bottom-20 left-[-10%] h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none" />

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex justify-between items-center pt-4 pb-3 px-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
              Bảng vinh danh
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Xếp hạng{' '}
              <Trophy
                size={22}
                className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
              />
            </h1>
          </div>
          <button className="active:scale-95 transition-all rounded-full">
            <AvatarFrame
              size="sm"
              level={profile?.level || 1}
              avatarUrl={profile?.avatar_url ?? null}
              nickname={profile?.nickname}
              showBadge={false}
            />
          </button>
        </div>

        {/* Stats mini bar - glass style */}
        <div className="grid grid-cols-3 gap-2.5 px-6 pb-4">
          {STAT_CARDS.map((stat, idx) => {
            const values = [sortedData.length, hottestStreak, averageWp.toLocaleString()];
            return (
              <div
                key={stat.key}
                className={`relative overflow-hidden rounded-xl border ${stat.border} ${stat.bg} p-3 backdrop-blur-xl group`}
              >
                <div className={`absolute -top-3 -right-3 w-12 h-12 ${stat.glow} blur-[25px] rounded-full`} />
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${stat.labelColor}`}>
                    {stat.label}
                  </p>
                  <stat.icon size={12} className={stat.iconColor} />
                </div>
                <p className="text-lg font-black text-white">{values[idx]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mode pills - glass style ── */}
      <div className="relative mx-6 mt-4">
        <div className="flex p-1 bg-slate-800/30 backdrop-blur-2xl rounded-2xl border border-white/[0.06] shadow-sm">
          {(['public', 'friends', 'clubs'] as LeagueMode[]).map((mode) => {
            const meta = MODE_META[mode];
            return (
              <button
                key={mode}
                onClick={() => setLeagueMode(mode)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
                  leagueMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {leagueMode === mode && (
                  <motion.div
                    layoutId="leaguePill"
                    className="absolute inset-0 rounded-xl bg-slate-700/60 border border-white/10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <meta.icon size={14} />
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 mt-4 space-y-4">
        {/* Add friend button */}
        {leagueMode === 'friends' && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowAddFriend(true)}
            className="w-full py-3.5 rounded-2xl border border-dashed border-emerald-500/40 text-emerald-400 bg-emerald-500/8 text-sm font-bold flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all hover:bg-emerald-500/15 hover:border-emerald-500/60"
          >
            <UserPlus size={18} /> Tìm và thách đấu bạn bè
          </motion.button>
        )}

        {leagueMode === 'clubs' ? (
          currentUser?.id ? (
            <ClubsView userId={currentUser.id} />
          ) : (
            <EmptyState
              searchQuery={searchQuery}
              leagueMode={leagueMode}
              onReset={() => { setSearchQuery(''); setLeagueView('all'); }}
              onAddFriend={() => setShowAddFriend(true)}
            />
          )
        ) : (
          <div className="space-y-4">
            {/* ── Spotlight card ── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 backdrop-blur-xl">
              {/* Decoration glow */}
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-cyan-400/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-emerald-400/8 blur-[40px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Hạng của bạn
                    </p>
                    {nextTarget && (
                      <span className="text-[9px] font-bold text-emerald-400/80 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/15">
                        <Target size={10} /> Cần {wpNeeded.toLocaleString()} WP
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black text-white">
                    {currentRankPosition ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        #{currentRankPosition}
                      </span>
                    ) : (
                      'Chưa xếp hạng'
                    )}
                  </p>

                  {nextTarget && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((currentUser?.wp || 0) / nextTarget.wp) * 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                          {Math.round(((currentUser?.wp || 0) / nextTarget.wp) * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Còn{' '}
                        <span className="text-emerald-400 font-bold">
                          {wpNeeded.toLocaleString()} WP
                        </span>{' '}
                        để vượt{' '}
                        <span className="text-white font-semibold">{nextTarget.name}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-400/80">
                    WP
                  </p>
                  <p className="text-3xl font-black text-white">
                    {(currentUser?.wp || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Search + Filters ── */}
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <div className="flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2.5 border border-white/[0.06] focus-within:border-cyan-500/30 focus-within:bg-slate-800/60 transition-all">
                  <Search size={14} className="text-slate-500 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên..."
                    className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none w-full"
                  />
                </div>
              </div>

              {/* View filter pills */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {(['all', 'top10', 'around'] as LeagueView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setLeagueView(view)}
                    className={`rounded-lg px-3 py-2.5 text-[10px] font-bold transition-all shrink-0 whitespace-nowrap ${
                      leagueView === view
                        ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 bg-slate-800/20 border border-transparent'
                    }`}
                  >
                    {view === 'all' ? 'Tất cả' : view === 'top10' ? 'Top 10' : 'Gần bạn'}
                  </button>
                ))}
              </div>

              {/* Count badge */}
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-slate-800/30 px-3 py-2.5 text-[10px] font-bold text-slate-400 shrink-0">
                <Users size={12} />
                {displayData.length}
              </div>
            </div>

            {searchedData.length === 0 ? (
              <EmptyState
                searchQuery={searchQuery}
                leagueMode={leagueMode}
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