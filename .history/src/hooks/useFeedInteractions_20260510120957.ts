import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

interface UseFeedInteractionsProps {
  currentUserId: string | undefined;
  postId: string;
  postAuthorId: string;
  initialCheersCount: number;
  initialDropsCount: number;
  initialCheered: boolean;
}

export function useFeedInteractions({
  currentUserId,
  postId,
  postAuthorId,
  initialCheersCount,
  initialDropsCount,
  initialCheered,
}: UseFeedInteractionsProps) {
  const [cheersCount, setCheersCount] = useState(initialCheersCount);
  const [dropsCount, setDropsCount] = useState(initialDropsCount);
  const [hasCheered, setHasCheered] = useState(initialCheered);

  // ── Cheers (Cụng ly) ── Default action, replaces Like
  const cheers = useCallback(async () => {
    if (!currentUserId) return;
    if (hasCheered) {
      toast.error('Bạn đã cụng ly bài này rồi!');
      return;
    }

    setHasCheered(true);
    setCheersCount(prev => prev + 1);

    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data, error } = await supabase.rpc('action_cheers_post', {
        p_post_id: postId,
        p_author_id: postAuthorId,
        p_local_date: today,
      });
      if (error) throw error;
      // Fire-and-forget pulse update
      supabase.rpc('pulse_post', { p_post_id: postId }).catch(() => {});
    } catch {
      setHasCheered(false);
      setCheersCount(prev => prev - 1);
      toast.error('Lỗi khi cụng ly, thử lại sau!');
    }
  }, [currentUserId, postId, postAuthorId, hasCheered]);

  // ── Drop (Châm nước) ── Donate 10-50ml from own progress
  const drop = useCallback(async (amount: number = 25) => {
    if (!currentUserId) return;
    if (currentUserId === postAuthorId) {
      toast.error('Không thể tự châm nước cho chính mình!');
      return;
    }

    const waterAvailable = useAppStore.getState().waterIntake;
    if (waterAvailable < amount) {
      toast.error(`Bạn cần ít nhất ${amount}ml để châm nước cho bạn bè!`);
      return;
    }

    const tid = toast.loading(`Đang châm ${amount}ml nước... 💧`);
    try {
      const { error } = await supabase.rpc('drop_water_to_post', {
        p_post_id: postId,
        p_from_user: currentUserId,
        p_to_user: postAuthorId,
        p_amount: amount,
      });
      if (error) throw error;
      setDropsCount(prev => prev + amount);
      useAppStore.getState().adjustWater(-amount);
      toast.success(`Đã châm ${amount}ml cho bạn! (-${amount}ml của bạn)`, { id: tid });
    } catch {
      toast.error('Chưa thể châm nước lúc này!', { id: tid });
    }
  }, [currentUserId, postId, postAuthorId]);

  // ── Freeze (Tặng khiên) ── Donate streak freeze item
  const donateFreeze = useCallback(async () => {
    if (!currentUserId) return;
    if (currentUserId === postAuthorId) {
      toast.error('Không thể tự tặng khiên cho chính mình!');
      return;
    }

    const tid = toast.loading('Đang gửi khiên bảo vệ... 🛡️');
    try {
      const { error } = await supabase.rpc('donate_streak_freeze', {
        p_from_user: currentUserId,
        p_to_user: postAuthorId,
        p_post_id: postId,
      });
      if (error) throw error;
      toast.success('Đã tặng khiên bảo vệ chuỗi! 🛡️', { id: tid });
    } catch {
      toast.error('Chưa thể tặng khiên lúc này!', { id: tid });
    }
  }, [currentUserId, postId, postAuthorId]);

  return {
    cheersCount,
    dropsCount,
    hasCheered,
    cheers,
    drop,
    donateFreeze,
  };
}