import type { FeedSummary } from './types';

interface FeedSummaryCardsProps {
  summary: FeedSummary;
}

export const FeedSummaryCards = ({ summary }: FeedSummaryCardsProps) => (
  <div className="grid grid-cols-3 gap-3 px-4 sm:px-0">
    <div className="glass-card border-cyan-500/20 bg-cyan-500/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Hôm nay</p>
      <p className="mt-2 text-2xl font-black text-white">{summary.postsToday}</p>
      <p className="text-xs text-cyan-100/70">cập nhật mới</p>
    </div>
    <div className="glass-card border-orange-500/20 bg-orange-500/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Tiến độ</p>
      <p className="mt-2 text-2xl font-black text-white">{summary.progressCount}</p>
      <p className="text-xs text-orange-100/70">bài milestone</p>
    </div>
    <div className="glass-card border-purple-500/20 bg-purple-500/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Thử thách</p>
      <p className="mt-2 text-2xl font-black text-white">{summary.challengeCount}</p>
      <p className="text-xs text-purple-100/70">kèo đang nóng</p>
    </div>
  </div>
);
