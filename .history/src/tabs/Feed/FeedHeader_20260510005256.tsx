import { useState } from 'react';
import { ArrowUpRight, Award, Bell, Search, Swords, X, Users, Sparkles, TrendingUp } from 'lucide-react';
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
  { key: 'all', label: 'Tất cả', icon: Sparkles },
  { key: 'milestones', label: 'Bảng vàng', icon: Award },
  { key: 'challenges', label: 'Thách đấu', icon: Swords },
];

export const FeedHeader = ({
  profile,
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
              onClick={onOpenDiscoverPeople}
      <input
        value={feedSearch}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Tìm theo tên, nội dung, đồ uống..."
        className="w-full bg-transparent text-sm text-white placeholder:text-meta outline-none"
      />
      {feedSearch && (
        <button onClick={() => onSearchChange('')} className="text-meta hover:text-white transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  </div>
);
