import { useState, useEffect, useCallback } from 'react';
import { Award, Bell, Search, Swords, X, Users, Sparkles, TrendingUp, Lightbulb, BarChart3, Image } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarFrame from '../../components/AvatarFrame';
import type { Profile } from '../../models';
import type { FeedFilter, FeedMode } from './types';

interface FeedHeaderProps {
  profile: Profile | null;
  onlineFriendsCount: number;
  unreadCount: number;
  feedMode: FeedMode;
  feedFilter: FeedFilter;
  feedSearch: string;
  onModeChange: (mode: FeedMode) => void;
  onFilterChange: (filter: FeedFilter) => void;
  onSearchChange: (search: string) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenDiscoverPeople: () => void;
}

const modeOptions: { key: FeedMode; label: string; icon: typeof TrendingUp }[] = [
  { key: 'smart', label: 'Thông minh', icon: Sparkles },
  { key: 'latest', label: 'Mới nhất', icon: TrendingUp },
  { key: 'following', label: 'Đang follow', icon: Users },
];

const filterOptions: { key: FeedFilter; label: string; icon: typeof Award }[] = [
  { key: 'all', label: 'Tất cả', icon:
  { key: 'challenges', label: 'Thách đấu', icon: Swords },
];

export const FeedHeader = ({
  profile,
  onlineFriendsCount,
  unreadCount,
  feedMode,
  feedFilter,
  feedSearch,
  onModeChange,
  onFilterChange,
  onSearchChange,
  onOpenNotifications,
  onOpenProfile,
  onOpenDiscoverPeople,
}: FeedHeaderProps) => {
  const [showSearch, setShowSearch] = useState(!!feedSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(feedSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  const scrollFeedToTop = useCallback(() => {
    const el = document.querySelector('[data-feed-scroll-container]');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleModeChange = useCallback((mode: FeedMode) => {
    onModeChange(mode);
    scrollFeedToTop();
  }, [onModeChange, scrollFeedToTop]);

  const handleFilterChange = useCallback((filter: FeedFilter) => {
    onFilterChange(filter);
    scrollFeedToTop();
  }, [onFilterChange, scrollFeedToTop]);

  return (
    <div className="relative pt-6 pb-3 px-6 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/8 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* Top row: heading + actions */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold tracking-widest text-cyan-400/80 uppercase mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#06b6d4]" />
              Trạm phát tin
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
              Cộng đồng
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
              <Users size={13} className="text-slate-600" />
              <span className="text-slate-500">{onlineFriendsCount} người đang hoạt động</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-xl bg-slate-800/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15 active:scale-90 transition-all duration-200 ease-out"
              >
                <Search size={16} />
              </button>
            )}
<button
              onClick={onOpenNotifications}
              className="relative w-10 h-10 rounded-xl bg-slate-800/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15 active:scale-90 transition-all duration-200 ease-out"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-slate-950 shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenProfile}
              className="active:scale-90 transition-transform duration-200 ease-out rounded-full shadow-lg shadow-black/20 hover:shadow-cyan-500/20"
            >
              <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
            </button>
          </div>
        </div>

        {/* Search bar (expandable) */}
        <AnimatePresence initial={false}>
          {showSearch && (
            <motion.div
              key="feed-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden mb-3"
            >
              <div className="bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2 px-4 py-3 shadow-sm">
                <Search size={16} className="text-slate-500 shrink-0" />
<input
                  value={debouncedSearch}
                  onChange={(event) => setDebouncedSearch(event.target.value)}
                  placeholder="Tìm theo tên, nội dung, đồ uống..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  autoFocus
                />
                {feedSearch && (
                  <button onClick={() => onSearchChange('')} className="text-slate-500 hover:text-white transition-colors p-1">
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={() => { setShowSearch(false); onSearchChange(''); }}
                  className="text-slate-500 hover:text-white transition-colors text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode pills + filter pills in a single row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {/* Mode segment */}
          <div className="flex bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/5 p-0.5 shrink-0">
            {modeOptions.map(({ key, label, icon: Icon }) => {
              const isActive = feedMode === key;
              return (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  className={`relative px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="feedModeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon size={11} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/5 shrink-0" />

          {/* Filter pills */}
          {filterOptions.map(({ key, label, icon: Icon }) => {
            const isActive = feedFilter === key;
            return (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`relative px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="feedFilterIndicator"
                    className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon size={11} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};