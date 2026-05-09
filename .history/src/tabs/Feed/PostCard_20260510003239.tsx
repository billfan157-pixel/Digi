import { useState, memo } from 'react';
import { Share2, Heart, MoreHorizontal, MessageCircle, Droplets, CheckCircle2, Trash2, Flag, Edit2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLike } from '../../hooks/useLike';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getRelativeTimeLabel } from '../../lib/social';
import { PostCardContent } from './PostCardContent';
import type { SocialFeedPost } from '../../models';

interface PostCardProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  handleToggleLikePost: (post: SocialFeedPost) => void;
  onOpenComments: (post: SocialFeedPost) => void;
}

export const PostCard = memo(({ post, currentUserId, handleToggleLikePost, onOpenComments }: PostCardProps) => {
  const { isLiked, count, toggleLike } = useLike(post.id, currentUserId, post.likedByMe || false, post.likes_count || 0);
  const [hasCheered, setHasCheered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isMyPost = currentUserId === post.author_id;
  const [isDeleted, setIsDeleted] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleSavePost = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    const newState = !isSaved;
    setIsSaved(newState);
    try {
      if (newState) {
        const { error } = await supabase.from('saved_posts').insert({ user_id: currentUserId, post_id: post.id });
        if (error) throw error;
        toast.success('Đã lưu bài viết vào mục Lưu trữ', { icon: '🔖' });
      } else {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', post.id);
        if (error) throw error;
        toast.info('Đã bỏ lưu bài viết');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu bài viết:', err);
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
      setIsSaved(!newState);
    }
  };

  const handleCheers = async () => {
    if (!post.id) { toast.error("Lỗi dữ liệu: Bài viết này không có ID!"); return; }
    setHasCheered(true);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tid = toast.loading('Đang cụng ly... 🍻', { icon: '💦' });
    try {
      const { data, error } = await supabase.rpc('action_cheers_post', {
        p_post_id: String(post.id),
        p_author_id: post.author_id ? String(post.author_id) : '00000000-0000-0000-0000-000000000000',
        p_local_date: today,
      });
      if (error) throw error;
      if (data === true) {
        toast.success('+200ml vào mục tiêu hôm nay!', { id: tid, icon: '✨' });
        supabase.rpc('pulse_post', { p_post_id: String(post.id) }).then(({ error }: any) => {
          if (error) console.error("Lỗi cập nhật Pulse:", error);
        });
      } else {
        toast.error('Bạn đã cụng ly bài này rồi!', { id: tid });
      }
    } catch (err: any) {
      setHasCheered(false);
      toast.error('Lỗi máy chủ, chưa thể cộng nước!', { id: tid, icon: '💦' });
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
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Báo cáo bài viết', message: 'Báo cáo bài viết này vì chứa nội dung spam hoặc không phù hợp?', confirmLabel: 'Báo cáo', variant: 'danger' });
    if (!ok) return;
    const tid = toast.loading('Đang gửi báo cáo đến hệ thống...');
    try {
      await supabase.from('reports').insert({ target_id: post.id, target_type: 'post', reporter_id: currentUserId, reason: 'Inappropriate content / Spam' });
    } catch (err) {
      console.warn('Report fallback:', err);
    } finally {
      toast.success('Đã ghi nhận báo cáo. Bài viết đã được ẩn khỏi Feed của bạn.', { id: tid });
      setShowMenu(false);
      setIsDeleted(true);
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

  const handleJoinChallenge = async () => {
    if (!currentUserId || !post.author_id) { toast.error("Vui lòng đăng nhập để thách đấu!"); return; }
    if (currentUserId === post.author_id) { toast.error("Sếp không thể tự thách đấu chính mình!"); return; }
    const tid = toast.loading('Đang gửi chiến thư...');
    try {
      const { error } = await supabase.from('hydration_battles').insert({ challenger_id: currentUserId, opponent_id: post.author_id, stake_coins: 0, status: 'pending' });
      if (error) throw error;
      toast.success('Đã gửi chiến thư! Đối thủ sẽ nhận được thông báo trong Đấu trường. ⚔️', { id: tid });
    } catch (err: any) {
      console.error("Lỗi gửi chiến thư:", err);
      toast.error('Không thể gửi chiến thư lúc này!', { id: tid });
    }
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
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 } as any}
      className={`transition-all duration-500 bg-slate-900/50 rounded-3xl shadow-lg p-5 border backdrop-blur-sm relative overflow-hidden ${
        isAchievement ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
        isCompare ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
        isChallenge ? 'border-purple-500/30' :
        isMilestone ? 'border-orange-500/30' :
        'border-white/5'
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
      {isMilestone && <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />}
      {isAchievement && <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 blur-3xl rounded-full" />}
      {isCompare && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-cyan-500/10 blur-3xl rounded-full" />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border-2 border-slate-700/50" style={{ background: isChallenge ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(6,182,212,0.25))' }}>
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-black text-white">{(post.author?.nickname || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px]">{post.author?.nickname ?? 'Người dùng'}</span>
              {post.post_kind === 'progress' && <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Tiến độ</span>}
              {isChallenge && <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Thách đấu</span>}
              {isAchievement && <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Thành tựu</span>}
              {isCompare && <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Đồng đội</span>}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-0.5">
              <span>{getRelativeTimeLabel(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"><Share2 size={18} /></button>
          <div className="relative">
            <button onClick={() => setShowMenu(true)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"><MoreHorizontal size={18} /></button>
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
                        <button onClick={handleEditPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"><Edit2 size={16} /> Chỉnh sửa</button>
                        <button onClick={handleDeletePost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={16} /> Xóa bài viết</button>
                      </>
                    ) : (
                      <button onClick={handleReportPost} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"><Flag size={16} /> Báo cáo vi phạm</button>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
          handleJoinChallenge={handleJoinChallenge}
        />
      </div>

      {/* Contextual Badges */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
        {(!isMilestone && !isWaterLog && !isChallenge) && (post.hydration_ml || 0) > 0 && (
          <motion.span animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">+{post.hydration_ml}ml</motion.span>
        )}
        {(!isMilestone && !isWaterLog && !isChallenge) && (post.streak_snapshot || 0) > 0 && (
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

      {/* Content */}
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
                 <img src={post.compare_avatar || `https://ui-avatars.com/api/?name=${post.compare_name}&background=10B981&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
              </div>
            </div>
            <p className="text-center text-white font-bold text-lg leading-snug mb-2 z-10">
              Cả bạn và <span className="text-emerald-400">{post.compare_name || 'Đồng đội'}</span> đều đạt <span className="text-amber-400">{post.value || 100}%</span> mục tiêu!
            </p>
            <p className="text-center text-slate-400 text-xs z-10">Cùng nhau giữ vững phong độ nhé! 🔥</p>
            <button className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all">
              Gửi lời chúc mừng
            </button>
          </div>
        ) : isChallenge ? (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-purple-300 font-bold mb-1">Mục tiêu chung:</h4>
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

      {/* Contextual Badges (Data-driven UI) */}
      <div className="flex items-center gap-2 mb-4 relative z-10 flex-wrap">
         {(!isMilestone && !isWaterLog && !isChallenge) && (post.hydration_ml || 0) > 0 && <motion.span animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 15px rgba(6,182,212,0.6)', '0 0 0px rgba(6,182,212,0)'] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">+{post.hydration_ml}ml</motion.span>}
         {(!isMilestone && !isWaterLog && !isChallenge) && (post.streak_snapshot || 0) > 0 && <motion.span animate={{ boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 15px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }} transition={{ duration: 2, delay: 1, repeat: Infinity, ease: "easeInOut" }} className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">Chuỗi {post.streak_snapshot}</motion.span>}
         {post.temperature && <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">{post.temperature}°C</span>}
         {post.heart_rate && <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">{post.heart_rate} nhịp/phút</span>}
         {post.drink_type && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">{post.drink_type}</span>}
      </div>

      {/* ================= SOCIAL HYDRATION PULSE - KILLER FEATURE ================= */}
      {(post.pulse_count > 0) && (
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
            <span className="font-black text-cyan-400">{post.pulse_count} người bạn</span> đã nạp nước sau khi xem.
          </p>
        </motion.div>
      )}

      {/* Action Bar Mới: Có nút CỤNG LY */}
      <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={handleLikeClick} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <motion.div animate={isLiked ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : { scale: 1 }} transition={{ duration: 0.4, type: "spring" } as any}>
              <Heart size={18} className={`transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "group-hover:text-rose-400"}`} /> 
            </motion.div>
            <span className={isLiked ? "text-rose-500" : ""}>{count > 0 ? count : 'Thích'}</span>
          </button>
          
          {/* Nút ĐẶC QUYỀN APP SỨC KHỎE */}
          {!isChallenge && (
            <button 
              onClick={handleCheers} 
              disabled={hasCheered}
            className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-bold py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 ${hasCheered ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'}`}
            >
            {!hasCheered && (
              <motion.div 
                animate={{ x: ['-100%', '200%'] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" 
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {hasCheered ? <CheckCircle2 size={18}/> : <Droplets size={18}/>}
              <span className="hidden sm:inline">{hasCheered ? 'Đã cụng ly' : 'Cụng ly'}</span>
            </span>
            </button>
          )}

          <button onClick={() => onOpenComments(post)} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-2 sm:px-3 rounded-xl transition-all active:scale-95 group">
            <MessageCircle size={18} className="group-hover:text-blue-400 transition-colors" /> 
            {(post.comments_count || 0) > 0 ? post.comments_count : <span className="hidden sm:inline">Bình luận</span>}
          </button>
        </div>

        <button onClick={handleSavePost} className="flex items-center gap-1.5 text-slate-400 text-xs font-bold hover:bg-white/5 hover:text-white py-2 px-3 rounded-xl transition-all active:scale-95 group">
          <motion.div animate={isSaved ? { scale: [1, 1.3, 1], y: [0, -4, 0] } : { scale: 1 }} transition={{ duration: 0.3 } as any}>
            <Bookmark size={18} className={`transition-colors ${isSaved ? "fill-cyan-500 text-cyan-500" : "group-hover:text-cyan-400"}`} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
});
