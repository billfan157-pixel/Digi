import { ArrowUpRight, Award, Bell, Search, Swords, X } from 'lucide-react';
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
}: FeedHeaderProps) => (
  <div className="flex flex-col pt-6 pb-2 px-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="section-title text-meta mb-1">Trạm phát tin</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Cộng đồng
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onOpenDiscoverPeople} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-colors active:scale-95">
          <ArrowUpRight size={14} />
          Khám phá
        </button>
        <button onClick={onOpenNotifications} className="relative p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-slate-950">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
        <button onClick={onOpenProfile} className="active:scale-95 transition-all rounded-full shadow-lg shadow-black/20">
          <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
        </button>
      </div>
    </div>

    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <button onClick={() => onModeChange('smart')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedMode === 'smart' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        Thông minh
      </button>
      <button onClick={() => onModeChange('latest')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedMode === 'latest' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        Mới nhất
      </button>
      <button onClick={() => onModeChange('following')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedMode === 'following' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        Đang follow
      </button>
      <button onClick={() => onFilterChange('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${feedFilter === 'all' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        Tất cả cập nhật
      </button>
      <button onClick={() => onFilterChange('milestones')} className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${feedFilter === 'milestones' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        <Award size={14}/> Bảng vàng
      </button>
      <button onClick={() => onFilterChange('challenges')} className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${feedFilter === 'challenges' ? 'active-treatment' : 'bg-white/5 text-meta border border-white/10 hover:bg-white/10'}`}>
        <Swords size={14}/> Thách đấu
      </button>
    </div>

    <div className="glass-control mt-3 flex items-center gap-2 px-3 py-2">
      <Search size={16} className="text-meta" />
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
