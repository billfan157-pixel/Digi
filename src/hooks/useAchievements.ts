/**
 * useAchievements Hook
 * Badge collection and achievement progress
 */
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: 'hydration' | 'streak' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    exp: number;
    coins: number;
    badge_id?: string;
  };
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievement?: Achievement;
}

export function useAchievements(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Get all available achievements
  const { data: allAchievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity');
      if (error) return [];
      return data || [];
    },
  });

  // Get user's unlocked achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async (): Promise<UserAchievement[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievement_id(*)')
        .eq('user_id', userId);
      if (error) return [];
      return data || [];
    },
    enabled: !!userId,
  });

  // Check for new achievements (unlocked based on current stats)
  const checkNewAchievements = useCallback(async () => {
    if (!userId) return [];

    const { data: newAchievements, error } = await supabase.rpc('check_achievements', {
      p_user_id: userId,
    });

    if (error) return [];
    return newAchievements || [];
  }, [userId]);

  // Unlock achievement
  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: string) => {
      const { error } = await supabase.rpc('unlock_achievement', {
        p_user_id: userId,
        p_achievement_id: achievementId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  // Get achievement categories
  const achievementsByCategory = (category: Achievement['category']) => {
    return allAchievements.filter(a => a.category === category);
  };

  // Get achievement by rarity
  const achievementsByRarity = (rarity: Achievement['rarity']) => {
    return allAchievements.filter(a => a.rarity === rarity);
  };

  // Check if user has specific achievement
  const hasAchievement = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  return {
    allAchievements,
    userAchievements,
    checkNewAchievements,
    unlockAchievement: unlockAchievement.mutate,
    achievementsByCategory,
    achievementsByRarity,
    hasAchievement,
    totalUnlocked: userAchievements.length,
    totalAvailable: allAchievements.length,
  };
}
