import { useState, memo } from 'react';
import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLike } from '../../hooks/useLike';
import { usePostActions } from '../../hooks/usePostActions';
import { PostCardHeader } from './PostCardHeader';
import { PostCardContent } from './PostCardContent';
import { PostMenuDropdown } from './PostMenuDropdown';
import { PostActionBar } from './PostActionBar';
import type { SocialFeedPost } from '../../models';

interface PostCardProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  handleToggleLikePost: (post: SocialFeedPost) => void;
  onOpenComments: (post: SocialFeedPost) => void;
}

export const PostCard = memo(({ post, currentUserId, handleToggleLikePost, onOpenComments }: PostCardProps) => {
  const { isLiked, count: likeCount, toggleLike } = useLike(
    post.id,
    currentUserId,
    post.likedByMe || false,
    post.likes_count || 0
  );
  const {
    savedPosts,
    cheeredPosts,
    toggleSavePost,
    cheersPost,
    deletePost,
    reportPost,
    editPost,
    joinChallenge,
  } = usePostActions({ currentUserId });

  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [postContent, setPostContent] = useState(post.content);

  const isMyPost = currentUserId === post.author_id;
  const isSaved = savedPosts.has(post.id);
  const hasCheered = cheeredPosts.has(post.id);

  const isChallenge = post.type === 'challenge';
  const isMilestone = post.type === 'milestone';
  const isWaterLog = post.type === 'water_log' || post.type === 'daily_goal';
  const isAchievement = post.type === 'achievement';
  const isCompare = post.type === 'compare';

  if (isDeleted) return null;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'DigiWell', text: postContent, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link chia sẻ');
    }
  };

  const handleSaveClick = async () => {
    if (savedPosts.has(post.id)) return;
    await toggleSavePost(post.id);
  };

  const handleCheersClick = () => {
    cheersPost(post);
  };

  const handleDeleteClick = async () => {
    const success = await deletePost(post.id);
    if (success) {
      setShowMenu(false);
      setIsDeleted(true);
    }
  };

  const handleReportClick = async () => {
    const success = await reportPost(post.id);
    if (success) {
      setShowMenu(false);
      setIsDeleted(true);
    }
  };

  const handleEditClick = async () => {
    setShowMenu(false);
    const newContent = await editPost(post.id, postContent);
    if (newContent) setPostContent(newContent);
  };

  const handleLikeClick = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    toggleLike();
  };

  return (
    <motion.div
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', bounce: 0.3 } as any}
      className={`transition-all duration-500 bg-slate-900/50 rounded-3xl shadow-lg p-5 border backdrop-blur-sm relative overflow-hidden ${
        isAchievement
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
          : isCompare
            ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            : isChallenge
              ? 'border-purple-500/30'
              : isMilestone
                ? 'border-orange-500/30'
                : 'border-white/5'
      }`}
    >
      {/* Ambient glow decorations */}
      {isChallenge && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />}
      {isMilestone && <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />}
      {isAchievement && <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 blur-3xl rounded-full" />}
      {isCompare && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-cyan-500/10 blur-3xl rounded-full" />}

      {/* Header */}
      <PostCardHeader
        post={post}
        isChallenge={isChallenge}
        isAchievement={isAchievement}
        isCompare={isCompare}
        onShare={handleShare}
        onOpenMenu={() => setShowMenu(true)}
      />

      {/* Menu Dropdown */}
      <div className="relative">
        <PostMenuDropdown
          show={showMenu}
          isMyPost={isMyPost}
          onClose={() => setShowMenu(false)}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onReport={handleReportClick}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mb-4">
        <PostCardContent
          post={post}
          postContent={postContent}
          isAchievement={isAchievement}
          isCompare={isCompare}
          isChallenge={isChallenge}
          isMilestone={isMilestone}
          isWaterLog={isWaterLog}
          handleJoinChallenge={() => joinChallenge(post.author_id)}
        />
      </div>

      {/* Contextual Badges */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
        {!isMilestone && !isWaterLog && !isChallenge && (post.hydration_ml || 0) > 0 && (
          <motion.span
            animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold"
          >
            +{post.hydration_ml}ml
          </motion.span>
        )}
        {!isMilestone && !isWaterLog && !isChallenge && (post.streak_snapshot || 0) > 0 && (
          <motion.span
            animate={{ boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }}
            transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
      {/* Content */}
      <div className="relative z-10 mb-4">
        <PostCardContent
          post={post}
          postContent={postContent}
          isAchievement={isAchievement}
          isCompare={isCompare}
          isChallenge={isChallenge}
          isMilestone={isMilestone}
          isWaterLog={isWaterLog}
          handleJoinChallenge={handleJoinChallengeClick}
        />
      </div>

      {/* Contextual Badges */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
        {(!isMilestone && !isWaterLog && !isChallenge) && (post.hydration_ml || 0) > 0 && (
          <motion.span animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">+{post.hydration_ml}ml</motion.span>
        )}
        {(!isMilestone && !isWaterLog && !isChallenge) && (post.streak_snapshot || 0) > 0 && (
          <motion.span animate={{ boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }} transition={{ duration: 2, delay: 1, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">Chuỗi {post.streak_snapshot}</motion.span>
        )}
        {post.temperature && <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">{post.temperature}°C</span>}
        {post.heart_rate && <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">{post.heart_rate} nhịp/phút</span>}
        {post.drink_type && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">{post.drink_type}</span>}
      </div>

      {/* Social Hydration Pulse */}
      {(post.pulse_count > 0) && (
        <motion.div initial={{ opacity: 0.8 }} whileHover={{ opacity: 1, scale: 1.01 }} className="flex items-center gap-2.5 mb-4 relative z-10 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0"><Droplets size={12} className="text-cyan-400" /></div>
          <p className="text-xs text-slate-300 font-medium"><span className="font-black text-cyan-400">{post.pulse_count} người bạn</span> đã nạp nước sau khi xem.</p>
        </motion.div>
      )}

      {/* Action Bar */}
      <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={handleLikeClick} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <motion.div animate={isLiked ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : { scale: 1 }} transition={{ duration: 0.4, type: "spring" } as any}>
              <Heart size={18} className={`transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "group-hover:text-rose-400"}`} />
            </motion.div>
            <span className={isLiked ? "text-rose-500" : ""}>{count > 0 ? count : 'Thích'}</span>
          </button>

          {!isChallenge && (
            <button onClick={handleCheersClick} disabled={hasCheered} className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-bold py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ${hasCheered ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'}`}>
              {!hasCheered && <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />}
              <span className="relative z-10 flex items-center gap-1.5">
                {hasCheered ? <CheckCircle2 size={18} /> : <Droplets size={18} />}
                <span className="hidden sm:inline">{hasCheered ? 'Đã cụng ly' : 'Cụng ly'}</span>
              </span>
            </button>
          )}

          <button onClick={() => onOpenComments(post)} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <MessageCircle size={18} className="group-hover:text-blue-400 transition-colors" />
            {(post.comments_count || 0) > 0 ? post.comments_count : <span className="hidden sm:inline">Bình luận</span>}
          </button>
        </div>

        <button onClick={handleSaveClick} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <motion.div animate={isSaved ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1 }} transition={{ duration: 0.3 } as any}>
            <Bookmark size={18} className={`transition-colors ${isSaved ? "fill-cyan-500 text-cyan-500" : "group-hover:text-cyan-400"}`} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
});