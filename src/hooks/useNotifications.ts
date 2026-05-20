import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { appQueryKeys } from '@/lib/queryKeys';

// Hàm tổng hợp âm thanh "Ting" bằng Web Audio API (không cần file mp3)
const playTingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine'; // Dạng sóng sine cho âm thanh tròn, êm
    osc.frequency.setValueAtTime(1200, ctx.currentTime); // Tần số 1200Hz (âm cao sáng)
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Âm lượng bắt đầu 10% (rất nhẹ nhàng)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); // Giảm âm lượng nhanh gọn trong 0.3s

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio playback failed (user may not have interacted yet):', e);
  }
};

async function fetchNotificationsData(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:public_profiles!notifications_actor_public_profile_fkey(nickname, avatar_url)')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as Record<string, unknown>[];
}

async function markAllReadRequest(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

async function markReadRequest(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export function useNotifications(currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: appQueryKeys.notifications(currentUserId),
    queryFn: () => fetchNotificationsData(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 30_000,
    select: (data) => ({
      notifications: data,
      unreadCount: data.filter((n) => !n.is_read).length,
    }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => markAllReadRequest(currentUserId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: appQueryKeys.notifications(currentUserId) });
      const prev = queryClient.getQueryData<Record<string, unknown>[]>(appQueryKeys.notifications(currentUserId));
      queryClient.setQueryData<Record<string, unknown>[]>(
        appQueryKeys.notifications(currentUserId),
        (old) => old?.map((n) => ({ ...n, is_read: true })),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(appQueryKeys.notifications(currentUserId), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKeys.notifications(currentUserId) });
    },
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => markReadRequest(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: appQueryKeys.notifications(currentUserId) });
      const prev = queryClient.getQueryData<Record<string, unknown>[]>(appQueryKeys.notifications(currentUserId));
      queryClient.setQueryData<Record<string, unknown>[]>(
        appQueryKeys.notifications(currentUserId),
        (old) => old?.map((n) => n.id === id ? { ...n, is_read: true } : n),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(appQueryKeys.notifications(currentUserId), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKeys.notifications(currentUserId) });
    },
  });

  useEffect(() => {
    if (!currentUserId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelId = `notifications-${currentUserId}`;
    const channel = supabase.channel(channelId);
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUserId}` }, () => {
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        playTingSound();
        queryClient.invalidateQueries({ queryKey: appQueryKeys.notifications(currentUserId) });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useNotifications] Channel error for user:', currentUserId);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, queryClient]);

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  const markAllRead = useCallback(() => {
    if (!currentUserId) return;
    markAllReadMut.mutate();
  }, [currentUserId, markAllReadMut]);

  const markAsRead = useCallback((id: string) => {
    markReadMut.mutate(id);
  }, [markReadMut]);

  return { notifications, unreadCount, markAllRead, markAsRead };
}
