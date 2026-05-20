import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addPostCheer, pulsePost as pulsePostApi, dropWaterToPost, sendNudge as sendNudgeApi } from '../lib/social.service';
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

  const cheerMutation = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().slice(0, 10);
      return addPostCheer(postId, postAuthorId, today);
    },
    onMutate: () => {
      if (hasCheered) {
        toast.error('Bạn đã cụng ly bài này rồi!');
        throw new Error('already_cheered');
      }
      setHasCheered(true);
      setCheersCount(prev => prev + 1);
    },
    onError: (err) => {
      if ((err as Error).message === 'already_cheered') return;
      setHasCheered(false);
      setCheersCount(prev => prev - 1);
      toast.error('Lỗi khi cụng ly, thử lại sau!');
    },
    onSuccess: () => {
      pulsePostApi(postId);
    },
  });

  const dropMutation = useMutation({
    mutationFn: (amount: number) => dropWaterToPost(postId, currentUserId!, postAuthorId, amount),
    onMutate: (amount) => {
      const waterAvailable = useAppStore.getState().waterIntake;
      if (currentUserId === postAuthorId) {
        toast.error('Không thể tự châm nước cho chính mình!');
        throw new Error('self_drop');
      }
      if (waterAvailable < amount) {
        toast.error(`Bạn cần ít nhất ${amount}ml để châm nước cho bạn bè!`);
        throw new Error('insufficient_water');
      }
    },
    onSuccess: (_, amount) => {
      setDropsCount(prev => prev + amount);
      const current = useAppStore.getState().waterIntake;
      useAppStore.setState({ waterIntake: Math.max(0, current - amount) });
      toast.success(`Đã châm ${amount}ml cho bạn! (-${amount}ml của bạn)`);
    },
    onError: (err) => {
      if ((err as Error).message === 'self_drop' || (err as Error).message === 'insufficient_water') return;
      toast.error('Chưa thể châm nước lúc này!');
    },
  });

  const nudgeMutation = useMutation({
    mutationFn: () => sendNudgeApi(currentUserId!, postAuthorId, postId),
    onMutate: () => {
      if (currentUserId === postAuthorId) {
        toast.error('Không thể tự nudge chính mình!');
        throw new Error('self_nudge');
      }
    },
    onSuccess: () => {
      toast.success('Đã gửi Nudge.');
    },
    onError: (err) => {
      if ((err as Error).message === 'self_nudge') return;
      toast.error('Chưa thể gửi Nudge lúc này!');
    },
  });

  // ── Cheers (Cụng ly) ──
  const cheers = useCallback(() => {
    if (!currentUserId) return;
    cheerMutation.mutate();
  }, [currentUserId, cheerMutation]);

  // ── Drop (Châm nước) ──
  const drop = useCallback((amount: number = 25) => {
    if (!currentUserId) return;
    dropMutation.mutate(amount);
  }, [currentUserId, dropMutation]);

  // ── Nudge ──
  const donateFreeze = useCallback(() => {
    if (!currentUserId) return;
    nudgeMutation.mutate();
  }, [currentUserId, nudgeMutation]);

  return {
    cheersCount,
    dropsCount,
    hasCheered,
    cheers,
    drop,
    donateFreeze,
  };
}
