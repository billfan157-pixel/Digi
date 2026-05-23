import { useState, useCallback } from 'react';
import i18n from '@/i18n';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useLike(postId: string, currentUserId: string | undefined, initialLiked: boolean, initialCount: number) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleLike = useCallback(async () => {
    if (!currentUserId || isProcessing) return;

    const newState = !isLiked;
    setIsLiked(newState);
    setCount(prev => (newState ? prev + 1 : prev - 1));
    setIsProcessing(true);

    try {
      if (newState) {
        const { error } = await supabase.from('post_cheers').insert({ post_id: postId, user_id: currentUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_cheers').delete().eq('post_id', postId).eq('user_id', currentUserId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Like error:', err);
      // Rollback
      setIsLiked(!newState);
      setCount(prev => (!newState ? prev + 1 : prev - 1));
      toast.error(i18n.t('validation.generic_error'));
    } finally {
      setIsProcessing(false);
    }
  }, [postId, currentUserId, isLiked, isProcessing]);

  return { isLiked, count, toggleLike, isProcessing };
}