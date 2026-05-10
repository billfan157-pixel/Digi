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
          disabled={hasCheered}
          className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-bold py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ${
            hasCheered
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
          }`}
        >
          {!hasCheered && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {hasCheered ? <CheckCircle2 size={18} /> : <Droplets size={18} />}
            <span className="hidden sm:inline">{hasCheered ? 'Đã cụng ly' : 'Cụng ly'}</span>
          </span>
        </button>
      )}

      <button
        onClick={onComment}
        className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group"
      >
        <MessageCircle size={18} className="group-hover:text-blue-400 transition-colors" />
        {commentsCount > 0 ? commentsCount : <span className="hidden sm:inline">Bình luận</span>}
      </button>
    </div>

    <button
      onClick={onSave}
      className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group"
    >
      <motion.div
        animate={isSaved ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1 }}
        transition={{ duration: 0.3 } as any}
      >
        <Bookmark
          size={18}
          className={`transition-colors ${isSaved ? 'fill-cyan-500 text-cyan-500' : 'group-hover:text-cyan-400'}`}
        />
      </motion.div>
    </button>
  </div>
);