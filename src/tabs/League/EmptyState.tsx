import { Radar } from 'lucide-react';
import type { LeagueMode } from './types';

interface EmptyStateProps {
  searchQuery: string;
  leagueMode: LeagueMode;
  onReset: () => void;
  onAddFriend?: () => void;
}

export const EmptyState = ({ searchQuery, leagueMode, onReset, onAddFriend }: EmptyStateProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 text-center backdrop-blur-xl">
    {/* Decoration glow */}
    <div className="absolute -top-8 -left-8 w-24 h-24 bg-slate-500/10 blur-[50px] rounded-full pointer-events-none" />
    
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.06] bg-slate-800/50">
      <Radar size={26} className="text-slate-500" />
    </div>
    
    <p className="text-lg font-black text-white">Chưa có dữ liệu phù hợp</p>
    
    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
      {searchQuery
        ? 'Thử đổi từ khóa hoặc quay về chế độ xem đầy đủ.'
        : leagueMode === 'friends'
          ? 'Hãy thêm bạn bè để bảng xếp hạng riêng bắt đầu có nhiệt.'
          : 'Chưa có đủ dữ liệu để dựng bảng xếp hạng lúc này.'}
    </p>
    
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={onReset}
        className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
      >
        Reset bộ lọc
      </button>
      {leagueMode === 'friends' && onAddFriend && (
        <button
          onClick={onAddFriend}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
        >
          Thêm bạn bè
        </button>
      )}
    </div>
  </div>
);