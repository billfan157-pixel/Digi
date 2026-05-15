import { Filter, RotateCcw, Users } from 'lucide-react';
import type { FeedFilter, FeedMode } from './types';

interface EmptyFeedStateProps {
  feedSearch: string;
  feedFilter: FeedFilter;
  friendCount: number;
  onFilterChange: (filter: FeedFilter) => void;
  onModeChange: (mode: FeedMode) => void;
  onOpenDiscoverPeople: () => void;
}

const EMPTY_STATE_BY_FILTER: Record<FeedFilter, { title: string; description: string }> = {
  all: {
    title: 'Chưa có bài viết nào',
    description: 'Hãy là người đầu tiên thả Pulse hôm nay.',
  },
  checkins: {
    title: 'Chưa có Pulse nào',
    description: 'Đăng tiến độ uống nước để giữ nhịp cùng cộng đồng.',
  },
  drops: {
    title: 'Chưa có Drop nào',
    description: 'Thả Drop tại đây để chia sẻ vị trí.',
  },
  milestones: {
    title: 'Chưa có Peak nào',
    description: 'Giữ chuỗi streak để xuất hiện trên bảng vàng.',
  },
  challenges: {
    title: 'Chưa có Duel nào',
    description: 'Tạo Duel để bắt đầu một màn accountability mới.',
  },
  photos: {
    title: 'Chưa có Proof nào',
    description: 'Thêm ảnh vào Pulse để bài nổi bật hơn.',
  },
};

export const EmptyFeedState = ({
  feedSearch,
  feedFilter,
  friendCount,
  onFilterChange,
  onModeChange,
  onOpenDiscoverPeople,
}: EmptyFeedStateProps) => {
  const state = !feedSearch && friendCount === 0
    ? { title: 'Chưa có bạn bè', description: 'Thêm bạn để xem Drop, nhận Duel và giữ nhịp uống nước cùng nhau.' }
    : feedSearch
    ? { title: 'Không tìm thấy bài phù hợp', description: 'Thử đổi từ khóa hoặc chuyển chế độ xem khác.' }
    : EMPTY_STATE_BY_FILTER[feedFilter];

  return (
    <div className="mx-4 bg-slate-900/50 border border-white/5 rounded-3xl shadow-lg p-8 text-center backdrop-blur-sm mt-8 sm:mx-0">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
        <Filter size={28} className="text-slate-500" />
      </div>
      <p className="text-white text-lg font-bold mb-2">{state.title}</p>
      <p className="text-slate-400 text-sm mb-6">{state.description}</p>
    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
      <button onClick={() => { onFilterChange('all'); onModeChange('smart'); }} className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold active:scale-95 transition-all hover:bg-white/10">
        <RotateCcw size={15} />
        Đặt lại feed
      </button>
      <button onClick={onOpenDiscoverPeople} className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-sm font-bold active:scale-95 transition-all hover:bg-cyan-500/25">
        <Users size={15} />
        Khám phá người mới
      </button>
      </div>
    </div>
  );
};
