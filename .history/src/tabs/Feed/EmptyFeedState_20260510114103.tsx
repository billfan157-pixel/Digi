import { Filter } from 'lucide-react';
import type { FeedFilter, FeedMode } from './types';

interface EmptyFeedStateProps {
  feedSearch: string;
  feedFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  onModeChange: (mode: FeedMode) => void;
  onOpenDiscoverPeople: () => void;
}
import { Filter } from 'lucide-react';
import type { FeedFilter, FeedMode } from './types';

  onModeChange,
  onOpenDiscoverPeople,
}: EmptyFeedStateProps) => (
  <div className="bg-slate-900/50 border border-white/5 rounded-3xl shadow-lg p-8 text-center backdrop-blur-sm mt-8">
    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
      <Filter size={28} className="text-slate-500" />
    </div>
    <p className="text-white text-lg font-bold mb-2">Không tìm thấy bài phù hợp</p>
    <p className="text-slate-400 text-sm mb-6">
      {feedSearch ? 'Thử đổi từ khóa hoặc chuyển chế độ xem khác.' : 'Chưa có nội dung phù hợp với bộ lọc hiện tại.'}
    </p>
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
