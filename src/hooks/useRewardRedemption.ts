/**
 * useRewardRedemption Hook
 * Real-world prize redemption
 */
import i18n from '@/i18n';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  coin_cost: number;
  stock: number; // -1 for unlimited
  category: 'physical' | 'digital' | 'subscription' | 'merchandise';
  available: boolean;
}

interface Redemption {
  id: string;
  reward_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  coin_spent: number;
  created_at: string;
  shipping_info?: {
    name: string;
    address: string;
    phone: string;
  };
  tracking_number?: string;
}

interface RedemptionRequest {
  reward_id: string;
  shipping_info?: {
    name: string;
    address: string;
    phone: string;
  };
}

export function useRewardRedemption(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [userCoins, setUserCoins] = useState(0);

  // Get available rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['reward-items'],
    queryFn: async (): Promise<RewardItem[]> => {
      const { data, error } = await supabase
        .from('reward_items')
        .select('*')
        .eq('available', true)
        .order('coin_cost');
      if (error) return [];
      return data || [];
    },
  });

  // Get user's redemption history
  const { data: redemptions = [], isLoading: historyLoading } = useQuery({
    queryKey: ['user-redemptions', userId],
    queryFn: async (): Promise<Redemption[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!userId,
  });

  // Get user's coin balance
  const { data: profile } = useQuery({
    queryKey: ['user-coins', userId],
    queryFn: async () => {
      if (!userId) return { coins: 0 };
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();
      if (error) return { coins: 0 };
      return data;
    },
    enabled: !!userId,
  });

  // Redeem reward
  const redeemReward = useMutation({
    mutationFn: async (request: RedemptionRequest) => {
      // Check if user has enough coins
      if ((profile?.coins || 0) < (rewards.find(r => r.id === request.reward_id)?.coin_cost || 0)) {
        throw new Error(i18n.t('common.not_enough_coins'));
      }

      const { error } = await supabase.rpc('redeem_reward', {
        p_user_id: userId,
        p_reward_id: request.reward_id,
        p_shipping_info: request.shipping_info || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['user-coins'] });
    },
  });

  // Cancel redemption
  const cancelRedemption = useMutation({
    mutationFn: async (redemptionId: string) => {
      const { error } = await supabase.rpc('cancel_redemption', {
        p_redemption_id: redemptionId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-redemptions'] });
    },
  });

  // Check if can afford
  const canAfford = useCallback((coinCost: number) => {
    return (profile?.coins || 0) >= coinCost;
  }, [profile?.coins]);

  return {
    rewards,
    redemptions,
    userCoins: profile?.coins || 0,
    isLoading: rewardsLoading || historyLoading,
    redeemReward: redeemReward.mutate,
    cancelRedemption: cancelRedemption.mutate,
    canAfford,
  };
}
