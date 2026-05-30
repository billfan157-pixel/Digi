import i18n from '@/i18n';
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
        toast.success(i18n.t('feed.post_saved'), { icon: '🔖' });
      } else {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', postId);
        if (error) throw error;
        toast.info(i18n.t('feed.post_unsaved'));
      }
      return true;
    } catch {
      setSavedPosts(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(postId);
        else next.delete(postId);
        return next;
      });
      toast.error(i18n.t('validation.something_wrong'));
      return false;
    }
  }, [currentUserId, savedPosts]);

  const cheersPost = useCallback(async (post: { id: string; author_id: string }) => {
    if (!currentUserId || !post.id) {
      toast.error(i18n.t('feed.post_no_id'));
      return false;
    }

    if (cheeredPosts.has(post.id)) {
      toast.error(i18n.t('feed.clinked_already'));
      return false;
    }

    setCheeredPosts(prev => new Set(prev).add(post.id));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tid = toast.loading(i18n.t('feed.cheers_loading'), { icon: '💦' });

    try {
      const { data, error } = await supabase.rpc('action_cheers_post', {
        p_post_id: String(post.id),
        p_author_id: post.author_id ? String(post.author_id) : '00000000-0000-0000-0000-000000000000',
        p_local_date: today,
      });

      if (error) throw error;

      if (data === true) {
        toast.success(i18n.t('home.water_goal_added'), { id: tid, icon: '✨' });
        await supabase.rpc('pulse_post', { p_post_id: String(post.id) });
        return true;
      } else {
        toast.error(i18n.t('feed.clinked_already'), { id: tid });
        setCheeredPosts(prev => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
        return false;
      }
    } catch {
      setCheeredPosts(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      toast.error(i18n.t('validation.something_wrong'), { id: tid, icon: '💦' });
      return false;
    }
  }, [currentUserId, cheeredPosts]);

  const deletePost = useCallback(async (postId: string) => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: i18n.t('feed.delete_post_title'), message: i18n.t('feed.delete_post_message'), confirmLabel: i18n.t('common.delete'), variant: 'danger' });
    if (!ok) return false;

    const tid = toast.loading(i18n.t('feed.post_deleting'));
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', currentUserId);
      if (error) throw error;
      toast.success(i18n.t('feed.post_deleted'), { id: tid });
      return true;
    } catch (err: unknown) {
      console.error("Lỗi xóa bài viết:", err);
      toast.error(i18n.t('feed.post_delete_failed'), { id: tid });
      return false;
    }
  }, [currentUserId]);
 
  const reportPost = useCallback(async (postId: string) => {
    const reasons = [
      i18n.t('feed.report_reason_1'),
      i18n.t('feed.report_reason_2'),
      i18n.t('feed.report_reason_3'),
      i18n.t('feed.report_reason_4'),
      i18n.t('feed.report_reason_5'),
      i18n.t('feed.report_reason_6'),
    ];
    const choice = window.prompt(`${i18n.t('feed.report_prompt')}\n\n${reasons.join('\n')}`, '1');
    if (!choice) return false;
    const idx = parseInt(choice, 10);
    if (idx < 1 || idx > 6) return false;
    const reasonMap = ['spam', 'inappropriate', 'harassment', 'misinformation', 'violence', 'other'];
    const selectedReason = reasonMap[idx - 1];

    const tid = toast.loading(i18n.t('feed.report_sending'));
    try {
      const { error } = await supabase.from('reports').insert({ target_id: postId, target_type: 'post', reporter_id: currentUserId, reason: selectedReason });
      if (error) throw error;
      toast.success(i18n.t('feed.post_reported'), { id: tid });
      return true;
    } catch (err) {
      console.warn('Report error:', err);
      toast.error(i18n.t('feed.report_failed'), { id: tid });
      return false;
    }
  }, [currentUserId]);

  const editPost = useCallback(async (postId: string, currentContent: string) => {
    const newContent = window.prompt(i18n.t('feed.edit_post_title'), currentContent);
    if (newContent !== null && newContent.trim() !== currentContent) {
      const tid = toast.loading(i18n.t('feed.post_updating'));
      try {
        const { error } = await supabase
          .from('social_posts')
          .update({ content: newContent.trim() })
          .eq('id', postId)
          .eq('author_id', currentUserId);
        if (error) throw error;
        toast.success(i18n.t('feed.post_updated'), { id: tid });
        return newContent.trim();
      } catch {
        toast.error(i18n.t('feed.post_update_failed'), { id: tid });
        return null;
      }
    }
    return null;
  }, [currentUserId]);
 
  const joinChallenge = useCallback(async (opponentId: string, extra?: { stake_coins?: number; target_ml?: number; deadline?: string; mode?: string }) => {
    if (!currentUserId || !opponentId) {
      toast.error(i18n.t('feed.challenge_need_login'));
      return false;
    }

    if (currentUserId === opponentId) {
      toast.error(i18n.t('feed.challenge_self'));
      return false;
    }

    const tid = toast.loading(i18n.t('feed.challenge_sending'));
    try {
      const { error } = await supabase.from('hydration_battles').insert({
        challenger_id: currentUserId,
        opponent_id: opponentId,
        stake_coins: extra?.stake_coins ?? 0,
        target_ml: extra?.target_ml ?? 2000,
        deadline: extra?.deadline ?? null,
        mode: extra?.mode ?? i18n.t('battle.race_goal'),
        status: 'pending',
      });
      if (error) throw error;
      toast.success(i18n.t('feed.challenge_letter_sent'), { id: tid });
      return true;
    } catch (err: unknown) {
      console.error("Lỗi gửi chiến thư:", err);
      toast.error(i18n.t('feed.challenge_letter_failed'), { id: tid });
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