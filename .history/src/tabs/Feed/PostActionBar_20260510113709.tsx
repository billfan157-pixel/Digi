import { Heart, MessageCircle, Bookmark, Droplets, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostActionBarProps {
  isLiked: boolean;
  likeCount: number;
  isSaved: boolean;
  hasCheered: boolean;
  isChallenge: boolean;
  commentsCount: number;
  onLike: () => void;
  onCheers: () => void;
  onComment: () => void;
  onSave: () => void;
}

export const PostActionBar = ({
  isLiked,
  likeCount,
  isSaved,
  hasCheered,
  isChallenge,
  commentsCount,
  onLike,
  onCheers,
  onComment,
  onSave,
}: PostActionBarProps) => (
  <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={onLike}
        className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group"
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : { scale: 1 }}
          transition={{ duration: 0.4, type: 'spring' } as any}
        >
          <Heart
            size={18}
