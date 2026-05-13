import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useFollow(targetUserId: string, currentUserId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    supabase
      .from('social_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
      .catch(err => console.error('[useFollow] Check error:', err));
  }, [targetUserId, currentUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) {
      toast.error('Vui lòng đăng nhập để thực hiện');
      return;
    }
    const prev = isFollowing;
    setIsFollowing(!prev);

    try {
      if (!prev) {
        const { error } = await supabase
          .from('social_follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        if (error) throw error;
      }
    } catch (err: any) {
      setIsFollowing(prev);
      toast.error('Lỗi thao tác, thử lại sau');
      console.error('[useFollow] Toggle error:', err);
    }
  }, [targetUserId, currentUserId, isFollowing]);

  return { isFollowing, toggleFollow };
}