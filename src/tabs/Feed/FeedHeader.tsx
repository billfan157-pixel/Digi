import { useState, useEffect, useCallback } from 'react';
import { Award, Search, Swords, Users, Sparkles, TrendingUp, Image, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { key: 'smart', label: 'Smart', icon: Sparkles },
  { key: 'latest', label: 'Mới nhất', icon: TrendingUp },
  { key: 'following', label: 'Follow', icon: Users },
];

const filterOptions: { key: FeedFilter; label: string; icon: typeof Award }[] = [
  { key: 'all', label: 'Tất cả', icon: Sparkles },
  { key: 'checkins', label: 'Pulse', icon: Droplets },
  { key: 'drops', label: 'Drop', icon: Droplets },
  { key: 'milestones', label: 'Peak', icon: Award },
  { key: 'challenges', label: 'Duel', icon: Swords },
  { key: 'photos', label: 'Proof', icon: Image },
];

export const FeedHeader = ({
  onlineFriendsCount,
  feedMode,
  feedFilter,
  feedSearch,
  onModeChange,
  onFilterChange,
  onSearchChange,
}: FeedHeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(feedSearch);

  useEffect(() => {
    setDebouncedSearch(feedSearch);
  }, [feedSearch]);

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
    <div className="relative px-4 pb-2 sm:px-6">
      <div className="space-y-4">
        {/* Hidden search trigger for TabHeader integration */}
        <button 
          data-feed-search-trigger 
          className="hidden" 
          onClick={() => setShowSearch(!showSearch)} 
        />

        {/* Search bar (expandable) */}
        <AnimatePresence initial={false}>
          {showSearch && (
            <motion.div
              key="feed-search"
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 px-4 py-3 shadow-2xl">
                <Search size={16} className="text-cyan-400 shrink-0" />
                <input
                  value={debouncedSearch}
                  onChange={(event) => setDebouncedSearch(event.target.value)}
                  placeholder="Tìm bạn bè, bài viết..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setDebouncedSearch('');
                    onSearchChange('');
                  }}
                  className="text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest px-2"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          {/* Mode Switcher - Compact Glass */}
          <div className="flex items-center justify-between">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Users size={12} className="text-slate-600" />
                {onlineFriendsCount} Online
             </p>
             <div className="flex p-1 bg-slate-900/60 rounded-xl border border-white/5">
                {modeOptions.map(({ key, label, icon: Icon }) => {
                  const isActive = feedMode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleModeChange(key)}
                      className={`relative px-3 py-1.5 text-[10px] font-bold transition-all ${
                        isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="feedModeIndicator"
                          className="absolute inset-0 bg-white/10 rounded-lg"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Filter Pills - Premium Scrolling */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filterOptions.map(({ key, label, icon: Icon }) => {
              const isActive = feedFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key)}
                  className={`relative flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-cyan-400' : 'text-slate-600'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
