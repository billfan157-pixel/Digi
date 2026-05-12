import { useState } from 'react';
import { ChevronDown, Flame, Swords, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedSummary } from './types';

interface FeedSummaryCardsProps {
  summary: FeedSummary;
}

export const FeedSummaryCards = ({ summary }: FeedSummaryCardsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalSignals = summary.postsToday + summary.progressCount + summary.challengeCount + summary.storyCount;
  const primaryStats = [
    { label: '24 giờ', value: summary.postsToday, helper: 'bài mới', icon: TrendingUp, className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' },
    { label: 'Peak', value: summary.progressCount, helper: 'tiến độ', icon: Flame, className: 'border-orange-500/20 bg-orange-500/10 text-orange-300' },
    { label: 'Duel', value: summary.challengeCount, helper: 'đang mở', icon: Swords, className: 'border-violet-500/20 bg-violet-500/10 text-violet-300' },
  ];

  const secondaryStats = [
    { label: 'Drop', value: summary.storyCount, helper: '24 giờ', icon: TrendingUp, className: 'border-sky-500/20 bg-sky-500/10 text-sky-300' },
  ];

  return (
    <div className="px-4 sm:px-0 space-y-2">
      {totalSignals === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/45 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tín hiệu feed</p>
              <p className="mt-1 text-sm font-bold text-slate-300">Chưa có hoạt động mới</p>
            </div>
            <TrendingUp size={18} className="text-slate-600" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {primaryStats.map(({ label, value, helper, icon: Icon, className }) => (
            <div key={label} className={`rounded-2xl border p-3 ${className}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
                <Icon size={13} />
              </div>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
              <p className="text-[10px] font-semibold text-slate-400">{helper}</p>
            </div>
          ))}
        </div>
      )}
      {totalSignals > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isExpanded ? 'Ẩn chi tiết' : 'Xem thêm tín hiệu feed'}
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      <AnimatePresence initial={false}>
        {totalSignals > 0 && isExpanded && (
            <motion.div
              key="summary-cards"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
            <div className="grid grid-cols-1 gap-2 pb-2">
              {secondaryStats.map(({ label, value, helper, icon: Icon, className }) => (
                <div key={label} className={`rounded-2xl border p-3 ${className}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
                    <Icon size={13} />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{value}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{helper}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
