import i18n from '@/i18n';
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
      .then(undefined, (err: unknown) => console.error('[useFollow] Check error:', err));
  }, [targetUserId, currentUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) {
      toast.error(i18n.t('fasting.login_required'));
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
    } catch (err: unknown) {
      setIsFollowing(prev);
      toast.error(i18n.t('fasting.operation_error'));
      console.error('[useFollow] Toggle error:', err);
    }
  }, [targetUserId, currentUserId, isFollowing]);

  return { isFollowing, toggleFollow };
}