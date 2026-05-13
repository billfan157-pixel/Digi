import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface UsePostActionsProps {
  currentUserId: string | undefined;
}

export function usePostActions({ currentUserId }: UsePostActionsProps) {
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [cheeredPosts, setCheeredPosts] = useState<Set<string>>(new Set());

  const toggleSavePost = useCallback(async (postId: string) => {
    if (!currentUserId) return false;

    const isSaved = savedPosts.has(postId);
    const newState = !isSaved;

    setSavedPosts(prev => {
      const next = new Set(prev);
      if (newState) next.add(postId);
      else next.delete(postId);
      return next;
    });

    try {
      if (newState) {
        const { error } = await supabase.from('saved_posts').insert({ user_id: currentUserId, post_id: postId });
        if (error) throw error;
        toast.success('Đã lưu bài viết vào mục Lưu trữ', { icon: '🔖' });
      } else {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', postId);
        if (error) throw error;
        toast.info('Đã bỏ lưu bài viết');
      }
      return true;
    } catch (err: any) {
      setSavedPosts(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(postId);
        else next.delete(postId);
        return next;
      });
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
      return false;
    }
  }, [currentUserId, savedPosts]);

  const cheersPost = useCallback(async (post: { id: string; author_id: string }) => {
    if (!currentUserId || !post.id) {
      toast.error("Lỗi dữ liệu: Bài viết này không có ID!");
      return false;
    }

    if (cheeredPosts.has(post.id)) {
      toast.error('Bạn đã cụng ly bài này rồi!');
      return false;
    }

    setCheeredPosts(prev => new Set(prev).add(post.id));
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
        await supabase.rpc('pulse_post', { p_post_id: String(post.id) });
        return true;
      } else {
        toast.error('Bạn đã cụng ly bài này rồi!', { id: tid });
        setCheeredPosts(prev => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
        return false;
      }
    } catch (err: any) {
      setCheeredPosts(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      toast.error('Lỗi máy chủ, chưa thể cộng nước!', { id: tid, icon: '💦' });
      return false;
    }
  }, [currentUserId, cheeredPosts]);

  const deletePost = useCallback(async (postId: string) => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Xóa bài viết', message: 'Bạn có chắc chắn muốn xóa bài viết này?', confirmLabel: 'Xóa', variant: 'danger' });
    if (!ok) return false;

    const tid = toast.loading('Đang xóa bài viết...');
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', currentUserId);
      if (error) throw error;
      toast.success('Đã xóa bài viết thành công', { id: tid });
      return true;
    } catch (err: any) {
      console.error("Lỗi xóa bài viết:", err);
      toast.error('Không thể xóa bài viết lúc này!', { id: tid });
      return false;
    }
  }, []);

  const reportPost = useCallback(async (postId: string) => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Báo cáo bài viết', message: 'Báo cáo bài viết này vì chứa nội dung spam hoặc không phù hợp?', confirmLabel: 'Báo cáo', variant: 'danger' });
    if (!ok) return false;

    const tid = toast.loading('Đang gửi báo cáo đến hệ thống...');
    try {
      const { error } = await supabase.from('reports').insert({ target_id: postId, target_type: 'post', reporter_id: currentUserId, reason: 'Inappropriate content / Spam' });
      if (error) throw error;
      toast.success('Đã ghi nhận báo cáo. Bài viết đã được ẩn khỏi Feed của bạn.', { id: tid });
      return true;
    } catch (err) {
      console.warn('Report error:', err);
      toast.error('Gửi báo cáo thất bại, vui lòng thử lại sau.', { id: tid });
      return false;
    }
  }, [currentUserId]);

  const editPost = useCallback(async (postId: string, currentContent: string) => {
    const newContent = window.prompt('Chỉnh sửa bài viết:', currentContent);
    if (newContent !== null && newContent.trim() !== currentContent) {
      const tid = toast.loading('Đang cập nhật...');
      try {
        const { error } = await supabase
          .from('social_posts')
          .update({ content: newContent.trim() })
          .eq('id', postId)
          .eq('author_id', currentUserId);
        if (error) throw error;
        toast.success('Đã cập nhật bài viết', { id: tid });
        return newContent.trim();
      } catch (err) {
        toast.error('Lỗi khi cập nhật!', { id: tid });
        return null;
      }
    }
    return null;
  }, []);

  const joinChallenge = useCallback(async (opponentId: string) => {
    if (!currentUserId || !opponentId) {
      toast.error("Vui lòng đăng nhập để thách đấu!");
      return false;
    }

    if (currentUserId === opponentId) {
      toast.error("Sếp không thể tự thách đấu chính mình!");
      return false;
    }

    const tid = toast.loading('Đang gửi chiến thư...');
    try {
      const { error } = await supabase.from('hydration_battles').insert({ challenger_id: currentUserId, opponent_id: opponentId, stake_coins: 0, status: 'pending' });
      if (error) throw error;
      toast.success('Đã gửi chiến thư! Đối thủ sẽ nhận được thông báo trong Đấu trường. ⚔️', { id: tid });
      return true;
    } catch (err: any) {
      console.error("Lỗi gửi chiến thư:", err);
      toast.error('Không thể gửi chiến thư lúc này!', { id: tid });
      return false;
    }
  }, [currentUserId]);

  return {
    savedPosts,
    cheeredPosts,
    toggleSavePost,
    cheersPost,
    deletePost,
    reportPost,
    editPost,
    joinChallenge,
  };
}