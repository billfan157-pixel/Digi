import { MessageCircle, Bookmark, Droplets, Shield, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostActionBarProps {
  cheersCount: number;
  dropsCount: number;
  hasCheered: boolean;
  isSaved: boolean;
  isChallenge: boolean;
  isOwnPost: boolean;
  commentsCount: number;
  onCheers: () => void;
  onDrop: () => void;
  onDonateFreeze: () => void;
  onComment: () => void;
  onSave: () => void;
}

export const PostActionBar = ({
  cheersCount,
  dropsCount,
  hasCheered,
  isSaved,
  isChallenge,
  isOwnPost,
  commentsCount,
  onCheers,
  onDrop,
  onDonateFreeze,
  onComment,
  onSave,
}: PostActionBarProps) => (
  <div className="border-t border-white/5 pt-3 mt-1 space-y-2 relative z-20">
    {/* Primary row: Cheers + Drop + Freeze + Comment */}
    <div className="flex items-center gap-1 sm:gap-2">
      {/* 🥂 Cheers — Default action */}
      <button
        onClick={onCheers}
        disabled={hasCheered}
        className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-bold py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ${
          hasCheered
            ? 'text-cyan-400 bg-cyan-500/10 cursor-default'
            : 'text-slate-400 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]'
        }`}
      >
        {!hasCheered && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12"
          />
        )}
        <motion.span
          whileTap={!hasCheered ? { scale: [1, 1.4, 1], rotate: [0, -8, 8, 0] } : {}}
          className="relative z-10 flex items-center gap-1"
        >
          <span className="text-base">🥂</span>
          <span className="hidden sm:inline font-bold">{hasCheered ? 'Đã cụng ly' : 'Cụng ly'}</span>
        </motion.span>
        {cheersCount > 0 && <span className={`relative z-10 text-[10px] ${hasCheered ? 'text-cyan-400' : 'text-slate-400'}`}>{cheersCount}</span>}
      </button>

      {/* 💧 Drop — Châm nước */}
      {!isOwnPost && !isChallenge && (
        <button
          onClick={onDrop}
          className="flex items-center gap-1 text-slate-400 text-xs font-bold py-2 px-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 active:scale-95 transition-all"
        >
          <Droplets size={15} />
          <span className="hidden sm:inline">Châm nước</span>
          {dropsCount > 0 && <span className="text-[10px] text-blue-400/70">+{dropsCount}ml</span>}
        </button>
      )}

      {/* 🛡️ Freeze — Tặng khiên */}
      {!isOwnPost && (
        <button
          onClick={onDonateFreeze}
          className="flex items-center gap-1 text-slate-400 text-xs font-bold py-2 px-2 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 active:scale-95 transition-all"
        >
          <Shield size={15} />
          <span className="hidden sm:inline">Tặng khiên</span>
        </button>
      )}

      {/* 💬 Comment */}
      <button
        onClick={onComment}
        className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ml-auto"
      >
        <MessageCircle size={16} className="group-hover:text-blue-400 transition-colors" />
        {commentsCount > 0 ? commentsCount : <span className="hidden sm:inline">Bình luận</span>}
      </button>

      {/* 🔖 Save */}
      <button
        onClick={onSave}
        className="flex items-center gap-1 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 rounded-xl transition-all active:scale-95"
      >
        <motion.div
