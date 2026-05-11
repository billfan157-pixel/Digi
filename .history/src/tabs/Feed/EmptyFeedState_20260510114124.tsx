import { Filter } from 'lucide-react';
import type { FeedFilter, FeedMode } from './types';

interface EmptyFeedStateProps {
  feedSearch: string;
  feedFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  onModeChange: (mode: FeedMode) => void;
  onOpenDiscoverPeople: () => void;
}

const EMPTY_STATE_BY_FILTER: Record<FeedFilter, { title: string; description: string }> = {
  all: {
    title: 'Chưa có bài viết nào',
    description: 'Hãy là người đầu tiên lan tỏa hydration moment!',
  },
  milestones: {
    title: 'Chưa có cột mốc nào',
    description: 'Giữ chuỗi streak để xuất hiện trên bảng vàng.',
  },
  challenges: {
    title: 'Chưa có thách đấu nào',
    description: 'Tạo chiến thư hydration để bắt đầu kèo mới.',
  },
};

export const EmptyFeedState = ({
  feedSearch,
  feedFilter,
  onFilterChange,
  onModeChange,
  onOpenDiscoverPeople,
}: EmptyFeedStateProps) => {
  const state = feedSearch
    ? { title: 'Không tìm thấy bài phù hợp', description: 'Thử đổi từ khóa hoặc chuyển chế độ xem khác.' }
    : EMPTY_STATE_BY_FILTER[feedFilter];

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-3xl shadow-lg p-8 text-center backdrop-blur-sm mt-8">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
        <Filter size={28} className="text-slate-500" />
      </div>
      <p className="text-white text-lg font-bold mb-2">{state.title}</p>
      <p className="text-slate-400 text-sm mb-6">{state.description}</p>
    <div className="flex items-center justify-center gap-3">
      <button onClick={() => { onFilterChange('all'); onModeChange('smart'); }} className="py-2.5 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold active:scale-95 transition-all hover:bg-white/10">
        Đặt lại feed
      </button>
      <button onClick={onOpenDiscoverPeople} className="py-2.5 px-6 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-sm font-bold active:scale-95 transition-all hover:bg-cyan-500/25">
        Khám phá người mới
      </button>
      </div>
    </div>
  );
};
