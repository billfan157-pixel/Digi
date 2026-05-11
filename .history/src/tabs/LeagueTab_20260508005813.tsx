import React, { memo, useMemo, useState } from 'react';
import { Trophy, UserPlus, Zap, Crown, Flame, Search, ArrowUpRight, Radar, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ClubsView from '../components/ClubsView';
import AvatarFrame from '../components/AvatarFrame';
import type { Profile } from '../models';

type LeagueMode = 'public' | 'friends' | 'clubs';
type LeagueView = 'all' | 'top10' | 'around';

interface LeagueEntry {
  id?: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

interface LeagueTabProps {
  leagueMode: LeagueMode;
  setLeagueMode: (mode: LeagueMode) => void;
  setShowAddFriend: (show: boolean) => void;
  getLeagueData: () => LeagueEntry[];
  getRankInfo: (wp: number) => { name: string; color: string; bg: string; border: string; };
  profile?: Profile | null;
}

// Optimized podium heights for mobile
const podiumHeights = [180, 140, 120];
const podiumBorders = ['border-yellow-400/70', 'border-slate-300/50', 'border-orange-400/50'];
const podiumShadows = [
  'shadow-[0_-5px_20px_rgba(250,204,21,0.15)]',
  'shadow-[0_-5px_15px_rgba(203,213,225,0.1)]',
  'shadow-[0_-5px_15px_rgba(251,146,60,0.1)]',
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

  const leagueData = getLeagueData();

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

  const searchedData = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return sortedData;

    return sortedData.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.dept.toLowerCase().includes(keyword),
    );
  }, [searchQuery, sortedData]);

  const displayData = useMemo(() => {
    if (leagueView === 'top10') {
      return searchedData.slice(0, 10);
    }

    if (leagueView === 'around' && currentUserIndex >= 0) {
      const start = Math.max(0, currentUserIndex - 2);
      const end = Math.min(searchedData.length, currentUserIndex + 3);
      return searchedData.slice(start, end);
    }

    return searchedData;
  }, [leagueView, searchedData, currentUserIndex]);

  const podiumSource = leagueView === 'all' ? searchedData : sortedData;
  const top3 = podiumSource.slice(0, 3);
  const leaderboardRows = displayData.filter((item) => !top3.some((topItem) => topItem.id === item.id && topItem.name === item.name));

  const modeMeta = {
    public: {
      label: 'Cộng đồng',
      accent: 'text-cyan-300',
      description: 'Toàn hệ thống, cạnh tranh dựa trên tổng Wellness Points.',
    },
    friends: {
      label: 'Bạn bè',
      accent: 'text-emerald-300',
      description: 'So kèo trong network cá nhân để giữ động lực mỗi ngày.',
    },
    clubs: {
      label: 'Câu lạc bộ',
      accent: 'text-purple-300',
      description: 'Theo dõi thành tích đội nhóm và đẩy ranking tập thể.',
    },
  } as const;

  const renderEmptyState = () => (
    <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-8 text-center backdrop-blur-xl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slate-800">
        <Radar size={26} className="text-slate-500" />
      </div>
      <p className="text-lg font-black text-white">Chưa có dữ liệu phù hợp</p>
      <p className="mt-2 text-sm text-slate-400">
        {searchQuery
          ? 'Thử đổi từ khóa hoặc quay về chế độ xem đầy đủ.'
          : leagueMode === 'friends'
            ? 'Hãy thêm bạn bè để bảng xếp hạng riêng bắt đầu có nhiệt.'
            : 'Chưa có đủ dữ liệu để dựng bảng xếp hạng lúc này.'}
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            setSearchQuery('');
            setLeagueView('all');
          }}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95"
        >
          Reset bộ lọc
        </button>
        {leagueMode === 'friends' && (
          <button
            onClick={() => setShowAddFriend(true)}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-95"
          >
            Thêm bạn bè
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-right duration-300 relative space-y-5 pb-6">
      {/* Simplified gradients for mobile performance */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-cyan-600/8 via-blue-500/4 to-transparent pointer-events-none blur-2xl -z-10" />
      <div className="absolute top-40 right-[-10%] h-48 w-48 rounded-full bg-amber-500/8 blur-2xl pointer-events-none -z-10" />

      <div className="relative z-0 space-y-5">
          {/* Header section - optimized touch target */}
          <div className="flex justify-between items-start pt-6 pb-4 px-6">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">
                BẢNG VINH DANH
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                Xếp hạng <Trophy size={30} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
              </h1>
              <p className={`mt-2.5 text-sm leading-relaxed ${modeMeta[leagueMode].accent}`}>
                {modeMeta[leagueMode].description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="active:scale-95 transition-transform rounded-full">
                <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
              </button>
            </div>
          </div>

          {/* Stats grid - optimized for mobile with 2 columns */}
          <div className="grid grid-cols-2 gap-3 px-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 backdrop-blur-xl">
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">Đối thủ</p>
              <p className="mt-2 text-3xl font-black text-white">{sortedData.length}</p>
              <p className="text-xs text-cyan-100/70 mt-1">{modeMeta[leagueMode].label}</p>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 backdrop-blur-xl">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-300">Streak nóng</p>
              <p className="mt-2 text-3xl font-black text-white">{hottestStreak}</p>
              <p className="text-xs text-orange-100/70 mt-1">ngày liên tiếp</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xl col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Mặt bằng chung</p>
                  <p className="text-xs text-emerald-100/70 mt-1">WP trung bình</p>
                </div>
                <p className="text-3xl font-black text-white">{averageWp.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Mode tabs - increased touch target */}
          <div className="flex p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 mx-6 shadow-2xl relative">
            <button 
              onClick={() => setLeagueMode('public')} 
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all relative ${leagueMode === 'public' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {leagueMode === 'public' && <motion.div layoutId="leagueTab" className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/30 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]" />}
              <span className="relative z-10">Cộng đồng</span>
            </button>
            <button 
              onClick={() => setLeagueMode('friends')} 
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all relative ${leagueMode === 'friends' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {leagueMode === 'friends' && <motion.div layoutId="leagueTab" className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]" />}
              <span className="relative z-10">Bạn bè</span>
            </button>
            <button 
              onClick={() => setLeagueMode('clubs')} 
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all relative ${leagueMode === 'clubs' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {leagueMode === 'clubs' && <motion.div layoutId="leagueTab" className="absolute inset-0 bg-purple-500/20 border border-purple-500/30 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)]" />}
              <span className="relative z-10">Câu lạc bộ</span>
            </button>
          </div>

          <div className="px-6">
            {/* Add friend button - larger touch target */}
            {leagueMode === 'friends' && (
              <button
                onClick={() => setShowAddFriend(true)}
                className="w-full mb-4 py-4 rounded-2xl border border-dashed border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-sm font-bold flex items-center justify-center gap-2.5 active:scale-95 transition-all hover:bg-emerald-500/20"
              >
                <UserPlus size={18} /> Tìm và thách đấu bạn bè
              </button>
            )}

            {leagueMode === 'clubs' ? (
              currentUser?.id ? <ClubsView userId={currentUser.id} /> : renderEmptyState()
            ) : (
              <div className="space-y-4">
                {/* User spotlight - improved readability */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Spotlight</p>
                      <p className="mt-1.5 text-xl font-black text-white">
                        {currentRankPosition ? `Hạng #${currentRankPosition}` : 'Chưa xếp hạng'}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {nextTarget
                          ? `Cần thêm ${(nextTarget.wp - (currentUser?.wp || 0)).toLocaleString()} WP để vượt ${nextTarget.name}.`
                          : 'Bạn đang dẫn đầu hoặc chưa có đối thủ phía trên.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-300">WP hiện tại</p>
                      <p className="mt-1.5 text-3xl font-black text-white">{(currentUser?.wp || 0).toLocaleString()}</p>
                      <div className="mt-2 flex items-center justify-end gap-1.5 text-orange-400 text-sm font-black">
                        <Flame size={14} />
                        {currentUser?.streak || 0} ngày
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and filters - better mobile UX */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3 bg-slate-800/50 rounded-2xl px-4 py-3.5 border border-white/5">
                    <Search size={18} className="text-slate-500 shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Tìm theo tên hoặc nhóm..."
                      className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button 
                      onClick={() => setLeagueView('all')} 
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all shrink-0 ${leagueView === 'all' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setLeagueView('top10')} 
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all shrink-0 ${leagueView === 'top10' ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                    >
                      Top 10
                    </button>
                    <button 
                      onClick={() => setLeagueView('around')} 
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all shrink-0 ${leagueView === 'around' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                    >
                      Gần bạn
                    </button>
                    <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 shrink-0">
                      <Users size={14} />
                      {displayData.length}
                    </div>
                  </div>
                </div>

                {searchedData.length === 0 ? renderEmptyState() : (
                  <>
                    {/* Podium - optimized spacing for mobile */}
                    {top3.length > 0 && leagueView !== 'around' && (
                      <div className="flex items-end justify-center gap-3 pt-2">
                        {[1, 0, 2].map((podiumIndex) => {
                          const item = top3[podiumIndex];
                          if (!item) return null;

                          const isChampion = podiumIndex === 0;
                          const cardHeight = podiumHeights[podiumIndex];

                          return (
                            <motion.div
                              key={item.id && item.id !== '' ? item.id : `podium-${podiumIndex}`}
                              initial={{ opacity: 0, y: 40 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 * podiumIndex, type: 'spring', stiffness: 120 }}
                              className={`flex-1 flex flex-col items-center relative ${isChampion ? 'z-20 -mx-2' : 'z-10'}`}
                            >
                              {isChampion ? (
                                <Crown size={36} className="text-yellow-400 mb-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.9)] animate-pulse" />
                              ) : (
                                <div className="mb-6" />
                              )}
                              <div className="relative mb-4">
                                <div className={`rounded-full bg-slate-800 flex items-center justify-center font-black border-[3px] z-10 relative ${isChampion ? 'w-20 h-20 text-4xl border-[5px] border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'w-14 h-14 text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]'} ${podiumIndex === 1 ? 'border-slate-300' : podiumIndex === 2 ? 'border-orange-400' : ''}`}>
                                  <span className={`${isChampion ? 'text-yellow-400' : podiumIndex === 1 ? 'text-slate-200' : 'text-orange-400'}`}>
                                    {item.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className={`absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-black z-20 border border-slate-800 ${isChampion ? 'w-8 h-8 -bottom-2 text-xs bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950' : 'w-6 h-6 -bottom-1.5 text-[10px]'} ${podiumIndex === 1 ? 'bg-slate-200 text-slate-900' : podiumIndex === 2 ? 'bg-orange-400 text-orange-950' : ''}`}>
                                  {podiumIndex + 1}
                                </div>
                              </div>
                              <div className={`w-full rounded-t-2xl border-t-[3px] px-2 pt-4 relative overflow-hidden backdrop-blur-xl flex flex-col items-center ${podiumBorders[podiumIndex]} ${podiumShadows[podiumIndex]} ${isChampion ? 'bg-gradient-to-t from-amber-500/20 to-yellow-500/5' : 'bg-gradient-to-t from-slate-800/40 to-slate-700/20'}`} style={{ height: `${cardHeight}px` }}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
                                <p className={`text-center font-bold truncate relative z-10 max-w-full px-1 ${isChampion ? 'text-base' : 'text-sm'} ${item.isMe ? 'text-cyan-300' : 'text-white'}`}>
                                  {item.name}
                                </p>
                                <p className={`mt-1.5 text-center font-black relative z-10 ${isChampion ? 'text-sm text-yellow-400' : podiumIndex === 1 ? 'text-xs text-slate-300' : 'text-xs text-orange-400'}`}>
                                  {item.wp.toLocaleString()} WP
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-black text-orange-400 relative z-10">
                                  <Flame size={11} />
                                  {item.streak}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Leaderboard rows - improved touch targets */}
                    <div className="space-y-2.5">
                      {leaderboardRows.length === 0 ? renderEmptyState() : leaderboardRows.map((item) => {
                        const actualRank = sortedData.findIndex((entry) => entry.id === item.id && entry.name === item.name) + 1;
                        const rankInfo = getRankInfo(item.wp);
                        const previousUser = actualRank > 1 ? sortedData[actualRank - 2] : null;
                        const gap = previousUser ? Math.max(previousUser.wp - item.wp, 0) : 0;

                        return (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(actualRank * 0.03, 0.25) }}
                            key={item.id && item.id !== '' ? item.id : `fallback-league-${actualRank}`}
                            className={`group relative flex items-center p-4 rounded-2xl backdrop-blur-md border transition-all duration-300 overflow-hidden min-h-[80px] ${item.isMe ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/50 scale-[1.01] z-10' : 'bg-slate-800/60 border-white/5 hover:bg-slate-700/60 hover:border-white/10'}`}
                          >
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-6xl font-black text-white/[0.03] italic pointer-events-none select-none">
                              {actualRank}
                            </div>

                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-lg font-black text-slate-300 shrink-0 shadow-inner relative z-10">
                              {item.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 ml-4 min-w-0 relative z-10">
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-base truncate ${item.isMe ? 'text-cyan-300' : 'text-slate-100'}`}>
                                  {item.name}
                                </p>
                                {item.isMe && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <span>{item.dept}</span>
                                {gap > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Cách trên {gap.toLocaleString()} WP</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`px-2 py-1 rounded flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider border ${rankInfo.bg} ${rankInfo.color} ${rankInfo.border}`}>
                                  {rankInfo.name}
                                </div>
                                <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                  <Flame size={9} className="text-orange-500" />
                                  <span className="text-orange-500 text-[11px] font-black">{item.streak}</span>
                                </div>
                                {actualRank <= 10 && (
                                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10">
                                    <Sparkles size={9} className="text-cyan-300" />
                                    <span className="text-cyan-300 text-[11px] font-black">Top 10</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 relative z-10">
                              <p className={`font-black text-xl tracking-tight ${item.isMe ? 'text-cyan-400 drop-shadow-md' : 'text-white'}`}>
                                {item.wp.toLocaleString()}
                              </p>
                              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center justify-end gap-1 mt-1">
                                <Zap size={9} className="text-amber-400" /> WP
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
    </div>
  );
});

export default LeagueTab;