import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedSummary } from './types';

interface FeedSummaryCardsProps {
  summary: FeedSummary;
}

export const FeedSummaryCards = ({ summary }: FeedSummaryCardsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="px-4 sm:px-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
      >
        {isExpanded ? 'Ẩn thống kê' : 'Xem thống kê'}
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="summary-cards"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 114, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3 pb-2">
              <div className="glass-card border-cyan-500/20 bg-cyan-500/10 p-3">
                <p className="section-label text-cyan-300">Hôm nay</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.postsToday}</p>
                <p className="text-xs text-cyan-100/70">cập nhật mới</p>
              </div>
              <div className="glass-card border-orange-500/20 bg-orange-500/10 p-3">
                <p className="section-label text-orange-300">Tiến độ</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.progressCount}</p>
                <p className="text-xs text-orange-100/70">bài milestone</p>
              </div>
              <div className="glass-card border-cyan-500/20 bg-cyan-500/10 p-3">
                <p className="section-label text-cyan-300">Thử thách</p>
                <p className="mt-2 text-2xl font-black text-white">{summary.challengeCount}</p>
                <p className="text-xs text-cyan-100/70">kèo đang nóng</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};