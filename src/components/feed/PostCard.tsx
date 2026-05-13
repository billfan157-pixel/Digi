import { useState, useEffect, memo } from 'react';
import {
  Share2, Heart, Zap, Target, MoreHorizontal, MessageCircle, Globe, Droplets,
  CheckCircle2, Edit2, Trash2, Flag, Flame, Coffee, Bookmark, Trophy, Sparkles, CloudSun, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getRelativeTimeLabel } from '../../lib/social';
import { readSavedPostIds, writeSavedPostIds, getPostSignalMeta } from '../../lib/feedUtils';
import type { SocialFeedPost } from '../../models';

interface PostCardProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  handleToggleLikePost: (post: SocialFeedPost) => void;
  onOpenComments: (post: SocialFeedPost) => void;
  onSendNudge?: (post: SocialFeedPost) => void;
}

export const PostCard = memo(({ post, currentUserId, handleToggleLikePost, onOpenComments, onSendNudge }: PostCardProps) => {
  const postId = post.id ? String(post.id) : '';
  // Sử dụng cheers_count hoặc like_count (đã được đồng bộ trong DB)
  const initialCheersCount = (post as any).cheers_count || post.likes_count || (post as any).like_count || 0;
  
  const [cheersCount, setCheersCount] = useState(initialCheersCount);
  const [hasCheered, setHasCheered] = useState((post as any).cheeredByMe || false);
  const [showMenu, setShowMenu] = useState(false);
  const isMyPost = currentUserId === post.author_id;
  const [isDeleted, setIsDeleted] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(postId ? readSavedPostIds(currentUserId).has(postId) : false);
  }, [currentUserId, postId]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'DigiWell', text: postContent, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link chia sẻ');
    } else {
      toast.info('Trình duyệt chưa hỗ trợ chia sẻ nhanh.');
    }
  };

  const handleSavePost = async () => {
    if (!currentUserId || !postId) {
      toast.error('Vui lòng đăng nhập để lưu bài viết.');
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);
    const savedIds = readSavedPostIds(currentUserId);
    const newState = !savedIds.has(postId);

    try {
      if (newState) {
        savedIds.add(postId);
        toast.success('Đã lưu bài viết.');
      } else {
        toast.info('Đã bỏ lưu bài viết');
        savedIds.delete(postId);
      }

      writeSavedPostIds(currentUserId, savedIds);
      setIsSaved(newState);
    } catch (err: any) {
      console.error('Lỗi khi lưu bài viết:', err);
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  const handleCheers = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để cụng ly!");
      return;
    }
    if (hasCheered) {
      toast.error('Bạn đã cụng ly bài này rồi!');
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);
    
    // Optimistic UI update
    setHasCheered(true);
    setCheersCount((prev: number) => prev + 1);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const payload = {
        p_post_id: String(post.id),
        p_author_id: post.author_id ? String(post.author_id) : '00000000-0000-0000-0000-000000000000',
        p_local_date: today
      };

      const { data, error } = await supabase.rpc('action_cheers_post', payload);

      if (error) throw error;

      // Cập nhật Pulse âm thầm
      void supabase.rpc('pulse_post', { p_post_id: String(post.id) });
      
      toast.success('🍻 Đã cụng ly! +200ml nước');
    } catch (err: any) {
      console.error("Lỗi cụng ly:", err);
      setHasCheered(false);
      setCheersCount((prev: number) => prev - 1);
      toast.error('Máy chủ bận, thử lại sau nhé!');
    }
  };

  const handleDeletePost = async () => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Xóa bài viết', message: 'Bạn có chắc chắn muốn xóa bài viết này?', confirmLabel: 'Xóa', variant: 'danger' });
    if (!ok) return;

    const tid = toast.loading('Đang xóa bài viết...');
    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', post.id);
      if (error) throw error;

      toast.success('Đã xóa bài viết thành công', { id: tid });
      setShowMenu(false);
      setIsDeleted(true);
    } catch (err: any) {
      console.error("Lỗi xóa bài viết:", err);
      toast.error('Không thể xóa bài viết lúc này!', { id: tid });
    }
  };

  const handleReportPost = async () => {
    if (!currentUserId || !postId) {
      toast.error('Vui lòng đăng nhập để báo cáo bài viết.');
      return;
    }

    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Báo cáo bài viết', message: 'Báo cáo bài viết này vì chứa nội dung spam hoặc không phù hợp?', confirmLabel: 'Báo cáo', variant: 'danger' });
    if (!ok) return;

    const tid = toast.loading('Đang gửi báo cáo đến hệ thống...');
    try {
      const { error } = await supabase.from('reports').insert({
        target_id: postId,
        target_type: 'post',
        reporter_id: currentUserId,
        reason: 'Inappropriate content / Spam'
      });
      if (error) throw error;

      toast.success('Đã ghi nhận báo cáo. Bài viết đã được ẩn khỏi Feed của bạn.', { id: tid });
      setShowMenu(false);
      setIsDeleted(true);
    } catch (err) {
      console.warn('Report failed:', err);
      toast.error('Chưa gửi được báo cáo. Vui lòng thử lại sau.', { id: tid });
    }
  };

  const handleEditPost = async () => {
    setShowMenu(false);
    const newContent = window.prompt('Chỉnh sửa bài viết:', postContent);
    if (newContent !== null && newContent.trim() !== postContent) {
      const tid = toast.loading('Đang cập nhật...');
      try {
        const { error } = await supabase.from('social_posts').update({ content: newContent.trim() }).eq('id', post.id);
        if (error) throw error;
        setPostContent(newContent.trim());
        toast.success('Đã cập nhật bài viết', { id: tid });
      } catch(err) {
        toast.error('Lỗi khi cập nhật!', { id: tid });
      }
    }
  };

  const isChallenge = post.type === 'challenge';
  const isMilestone = post.type === 'milestone';
  const isWaterLog = post.type === 'water_log' || post.type === 'daily_goal';
  const isAchievement = post.type === 'achievement';
  const isCompare = post.type === 'compare';
  const signalMeta = getPostSignalMeta(post);

  if (isDeleted) return null;

  const handleJoinChallenge = async () => {
    if (!currentUserId || !post.author_id) {
      toast.error('Vui lòng đăng nhập để thách đấu.');
      return;
    }
    if (currentUserId === post.author_id) {
      toast.error('Bạn không thể tự thách đấu chính mình.');
      return;
    }

    const tid = toast.loading('Đang gửi chiến thư...');
    try {
      const { error } = await supabase.from('hydration_battles').insert({
        challenger_id: currentUserId,
        opponent_id: post.author_id,
        stake_coins: 0,
        status: 'pending'
      });

      if (error) throw error;
      toast.success('Đã gửi chiến thư. Đối thủ sẽ nhận được thông báo trong Đấu trường.', { id: tid });
    } catch (err: any) {
      console.error("Lỗi gửi chiến thư:", err);
      toast.error('Không thể gửi chiến thư lúc này!', { id: tid });
    }
  };

  return (
    <motion.div
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      onDoubleClick={() => {
        if (!isMyPost && !hasCheered) handleCheers();
      }}
      className={`transition-all duration-300 rounded-3xl p-4 border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-xl relative overflow-hidden ${
        isAchievement ? 'ring-1 ring-amber-500/20' :
        isCompare ? 'ring-1 ring-emerald-500/15' :
        post.type === 'challenge' ? 'ring-1 ring-purple-500/15' :
        signalMeta.progress >= 100 ? 'ring-1 ring-orange-500/15' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-800 border border-slate-700/70">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-base font-black text-white">{(post.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-bold text-[15px]">{post.author?.nickname ?? 'Người dùng'}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10 bg-slate-950/50 ${signalMeta.accentText}`}>{signalMeta.eyebrow}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-0.5">
              <span>{getRelativeTimeLabel(post.created_at)}</span>
              <span>•</span>
              <Globe size={10} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <Share2 size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(true)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <div key="post-menu-overlay">
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden origin-top-right"
                  >
                    {isMyPost ? (
                      <>
                        <button onClick={handleEditPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                          <Edit2 size={16} /> Chỉnh sửa
                        </button>
                        <button onClick={handleDeletePost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 size={16} /> Xóa bài viết
                        </button>
                      </>
                    ) : (
                      <button onClick={handleReportPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Flag size={16} /> Báo cáo vi phạm
                      </button>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 mb-4">
        {isAchievement ? (
          <div className="flex flex-col items-center justify-center p-6 border border-amber-500/30 bg-amber-500/5 rounded-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 border-4 border-slate-900 z-10">
              <Trophy size={36} className="text-white" />
            </div>
            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1 z-10 flex items-center gap-1"><Sparkles size={12}/> Kỷ Lục Mới</p>
            <h4 className="text-white text-2xl font-black mb-2 z-10">{post.content}</h4>
            {post.value && <p className="text-slate-300 text-sm z-10">Hoàn thành xuất sắc mục tiêu đề ra.</p>}
          </div>
        ) : isCompare ? (
          <div className="border border-white/10 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
            <div className="flex items-center justify-center mb-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] z-10 transform translate-x-3">
                <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=0D8ABC&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center z-20 shadow-xl">
                <Zap size={14} className="text-amber-400" />
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10 transform -translate-x-3">
                <img src={(post as any).compare_avatar || `https://ui-avatars.com/api/?name=${(post as any).compare_name}&background=10B981&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
              </div>
            </div>
            <p className="text-center text-white font-bold text-lg leading-snug mb-2 z-10">
              Cả bạn và <span className="text-emerald-400">{(post as any).compare_name || 'Đồng đội'}</span> đều đạt <span className="text-amber-400">{post.value || 100}%</span> mục tiêu!
            </p>
            <p className="text-center text-slate-400 text-xs z-10">Cùng nhau giữ vững phong độ nhé.</p>
            <button className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all">
              Gửi lời chúc mừng
            </button>
          </div>
        ) : isChallenge ? (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-purple-300 font-bold mb-1 flex items-center gap-2"><Target size={16}/> Mục tiêu chung:</h4>
            <p className="text-white text-lg font-black leading-relaxed">{postContent}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleJoinChallenge}
                className="flex-1 bg-white text-purple-900 font-black py-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                Thách đấu ngay
              </button>
            </div>
          </div>
        ) : isMilestone ? (
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Flame size={32} className="text-white" />
            </div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Cột mốc mới</p>
            <h4 className="text-white text-2xl font-black mb-2">Chuỗi {post.value || post.streak_snapshot || 0} ngày</h4>
            {postContent && <p className="text-slate-300 text-sm">{postContent}</p>}
          </div>
        ) : isWaterLog ? (
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Droplets size={24} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-xl font-black">+{post.value || post.hydration_ml || 0} ml</h4>
              <p className="text-slate-400 text-sm truncate">{postContent || 'Vừa nạp thêm nước cho cơ thể.'}</p>
            </div>
          </div>
        ) : (
          <>
            {postContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">{postContent}</p>}
            {post.image_url && (
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
                <img src={post.image_url} alt="Ảnh bài viết" loading="lazy" className="w-full max-h-[500px] object-cover" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Unified Cheers Button (Replacing Kudos/Heart) */}
          <button
            onClick={handleCheers}
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest py-2.5 px-4 rounded-xl transition-all active:scale-95 group ${
              hasCheered 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <motion.div animate={hasCheered ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}>
              <Droplets size={18} className={hasCheered ? "fill-white" : "group-hover:text-cyan-400"} />
            </motion.div>
            <span>{cheersCount > 0 ? `${cheersCount} Cheers` : 'Cụng ly'}</span>
          </button>

          <button onClick={() => onOpenComments(post)} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
            <MessageCircle size={18} className="group-hover:text-blue-400" />
            {(post.comments_count || 0) > 0 ? post.comments_count : <span className="hidden sm:inline">Bình luận</span>}
          </button>
        </div>

        <button onClick={handleSavePost} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <Bookmark size={18} className={isSaved ? "fill-cyan-500 text-cyan-500" : ""} />
        </button>
      </div>
    </motion.div>
  );
});

PostCard.displayName = 'PostCard';
