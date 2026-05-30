/**
 * useSocialGraph Hook
 * Friend recommendations based on hydration patterns
 */
import { useCallback} from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FriendRecommendation {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  similarity_score: number;
  reason: string;
}

export function useSocialGraph(userId: string | undefined) {
  // Get users with similar hydration goals/patterns
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['friend-recommendations', userId],
    queryFn: async (): Promise<FriendRecommendation[]> => {
      if (!userId) return [];

      // Simple recommendation: users with same timezone and similar daily goal
      const { data, error } = await supabase.rpc('get_friend_recommendations', {
        p_user_id: userId,
        p_limit: 10,
      });
      if (error) {
        // Fallback: just get active users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .eq('is_premium', true)
          .limit(10);
        return (profiles || []).map(p => ({
          user_id: p.id,
          nickname: p.nickname || 'User',
          avatar_url: p.avatar_url,
          similarity_score: 0.5,
          reason: 'Active premium user',
        }));
      }
      return data || [];
    },
    enabled: !!userId,
  });

  const refreshRecommendations = useCallback(() => {
    // Implement cache invalidation if needed
  }, []);

  return { recommendations, isLoading, refreshRecommendations };
}
