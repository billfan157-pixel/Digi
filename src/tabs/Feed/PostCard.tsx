import { useState, memo } from 'react';
import { Droplets, Lightbulb, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useFeedInteractions } from '../../hooks/useFeedInteractions';
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

export const PostCard = memo(({ post, currentUserId, onOpenComments }: PostCardProps) => {
  // New interaction system: Cheers + Drop + Freeze replace Likes
  const {
    cheersCount,
    dropsCount,
    hasCheered,
    cheers,
    drop,
    donateFreeze,
  } = useFeedInteractions({
    currentUserId,
    postId: post.id,
    postAuthorId: post.author_id,
    initialCheersCount: post.like_count || 0,
    initialDropsCount: 0,
    initialCheered: (post as unknown as Record<string, unknown>).cheeredByMe as boolean || false,
  });

  const {
    savedPosts,
    toggleSavePost,
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

 const isChallenge = post.post_kind === 'challenge';
   const isMilestone = post.post_kind === 'milestone';
   const isAchievement = false;
   const isCompare = false;
   const isTip = false;
   const isPoll = false;
   const isWaterLog = (post.hydration_ml || 0) > 0;
   const isDrop = post.post_kind === 'story';

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

  // Border style based on post type
  const borderClass = isAchievement
    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
    : isCompare
      ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
      : isChallenge
        ? 'border-purple-500/30'
        : isMilestone
          ? 'border-orange-500/30'
          : isDrop
            ? 'border-cyan-500/30'
            : isTip
              ? 'border-emerald-500/25'
              : isPoll
                ? 'border-amber-500/25'
                : 'border-white/5';

  return (
    <motion.div
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
      className={`transition-all duration-500 bg-slate-900/50 rounded-3xl shadow-lg p-5 border backdrop-blur-sm relative overflow-hidden ${borderClass}`}
    >
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
          isDrop={isDrop}
          handleJoinChallenge={() => joinChallenge(post.author_id)}
        />
      </div>

      {/* Contextual Badges */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
        {!isMilestone && !isWaterLog && !isChallenge && !isTip && !isPoll && (post.hydration_ml || 0) > 0 && (
          <motion.span
            animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold"
          >
            +{post.hydration_ml}ml
          </motion.span>
        )}
        {!isMilestone && !isWaterLog && !isChallenge && !isTip && !isPoll && (post.streak_snapshot || 0) > 0 && (
          <motion.span
            animate={{ boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }}
            transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold"
          >
            Chuỗi {post.streak_snapshot}
          </motion.span>
        )}
         {isTip && (post as unknown as Record<string, unknown>).tip_category && (
           <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
             <Lightbulb size={10} />
             {String((post as unknown as Record<string, unknown>).tip_category) === 'science' ? 'Khoa học' : String((post as unknown as Record<string, unknown>).tip_category) === 'recipe' ? 'Công thức' : 'Mẹo vặt'}
           </span>
         )}
         {isPoll && (
           <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
             <BarChart3 size={10} />Khảo sát
           </span>
         )}
          {Boolean((post as unknown as Record<string, unknown>).temperature) && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
              {String((post as unknown as Record<string, unknown>).temperature)}°C
            </span>
          )}
          {Boolean((post as unknown as Record<string, unknown>).heart_rate) && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
              {String((post as unknown as Record<string, unknown>).heart_rate)} nhịp/phút
            </span>
          )}
          {Boolean((post as unknown as Record<string, unknown>).drink_type) && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              {String((post as unknown as Record<string, unknown>).drink_type)}
            </span>
          )}
       </div>

       {/* Social Hydration Pulse */}
       {Number((post as unknown as Record<string, unknown>).pulse_count || 0) > 0 && (
         <motion.div
           initial={{ opacity: 0.8 }}
           whileHover={{ opacity: 1, scale: 1.01 }}
           className="flex items-center gap-2.5 mb-4 relative z-10 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 overflow-hidden"
         >
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
           <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
             <Droplets size={12} className="text-cyan-400" />
           </div>
           <p className="text-xs text-slate-300 font-medium">
             <span className="font-black text-cyan-400">{String((post as unknown as Record<string, unknown>).pulse_count)} người bạn</span> đã nạp nước sau khi xem.
           </p>
         </motion.div>
       )}

      {/* Action Bar with new interaction system */}
      <PostActionBar
        cheersCount={cheersCount}
        dropsCount={dropsCount}
        hasCheered={hasCheered}
        isSaved={isSaved}
        isChallenge={isChallenge}
        isOwnPost={isMyPost}
        commentsCount={post.comments_count || 0}
        onCheers={cheers}
        onDrop={() => drop(25)}
        onDonateFreeze={donateFreeze}
        onComment={() => onOpenComments(post)}
        onSave={handleSaveClick}
      />
    </motion.div>
  );
});
