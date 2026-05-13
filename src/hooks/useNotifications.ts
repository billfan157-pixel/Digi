import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Hàm tổng hợp âm thanh "Ting" bằng Web Audio API (không cần file mp3)
const playTingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
    // Bỏ qua lỗi nếu trình duyệt chặn tự động phát âm thanh khi user chưa tương tác với trang
  }
};

export function useNotifications(currentUserId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:public_profiles!notifications_actor_public_profile_fkey(nickname, avatar_url)')
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error('[useNotifications] Fetch error:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    setTimeout(() => fetchNotifications(), 0);
    if (!currentUserId) return;

    // Cleanup previous channel before creating new one
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
          navigator.vibrate([100, 50, 100]); // Hiệu ứng rung kép (tit tit) báo hiệu có thông báo mới
        }
        playTingSound(); // Kích hoạt tiếng Ting
        fetchNotifications();
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
  }, [currentUserId, fetchNotifications]);

  const markAllRead = async () => {
    if (!currentUserId) return;
    setUnreadCount(0);
    setNotifications(prev => prev.map((n: any) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', currentUserId)
      .eq('is_read', false)
      .catch(err => console.error('[useNotifications] Mark all read error:', err));
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .catch(err => console.error('[useNotifications] Mark read error:', err));
  };

  return { notifications, unreadCount, markAllRead, markAsRead };
}
