/**
 * useAds Hook
 * Freemium ad-supported tier integration
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type AdFormat = 'banner' | 'interstitial' | 'rewarded' | 'native';
type AdNetwork = 'adMob' | 'facebook' | 'unity' | 'applovin';

interface AdConfig {
  format: AdFormat;
  network: AdNetwork;
  unit_id: string;
  enabled: boolean;
  frequency_cap?: number; // max views per user per day
}

interface AdView {
  id: string;
  user_id: string;
  ad_format: AdFormat;
  network: string;
  viewed_at: string;
  rewarded_amount?: number;
}

interface AdReward {
  type: 'coins' | 'exp' | 'streak_bonus';
  amount: number;
}

export function useAds(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [lastReward, setLastReward] = useState<AdReward | null>(null);

  // Get ad configurations
  const { data: adConfigs = [] } = useQuery({
    queryKey: ['ad-configs'],
    queryFn: async (): Promise<AdConfig[]> => {
      const { data, error } = await supabase
        .from('ad_configurations')
        .select('*')
        .eq('enabled', true);
      if (error) return [];
      return data || [];
    },
  });

  // Get user's ad view history for today
  const { data: todayAdViews = [] } = useQuery({
    queryKey: ['ad-views-today', userId],
    queryFn: async (): Promise<AdView[]> => {
      if (!userId) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ad_views')
        .select('*')
        .eq('user_id', userId)
        .gte('viewed_at', today);
      if (error) return [];
      return data || [];
    },
    enabled: !!userId,
  });

  // Check if user is on free tier (see ads)
  const { data: isFreeTier } = useQuery({
    queryKey: ['user-tier', userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return true;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', userId)
        .single();
      if (error) return true;
      return !data?.is_premium;
    },
    enabled: !!userId,
  });

  // Record ad view
  const recordAdView = useMutation({
    mutationFn: async (params: { format: AdFormat; network: string; rewardedAmount?: number }) => {
      if (!userId) return;
      const { error } = await supabase.rpc('record_ad_view', {
        p_user_id: userId,
        p_format: params.format,
        p_network: params.network,
        p_rewarded_amount: params.rewardedAmount || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-views-today'] });
    },
  });

  // Show rewarded ad and grant reward
  const showRewardedAd = useCallback(async (): Promise<AdReward | null> => {
    if (!userId) return null;

    setIsShowingAd(true);
    try {
      // In production, would integrate with actual ad SDK
      // For now, simulate ad completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Grant reward (5 coins for watching ad)
      const reward: AdReward = { type: 'coins', amount: 5 };
      setLastReward(reward);

      // Record the view
      await recordAdView.mutateAsync({
        format: 'rewarded',
        network: 'simulated',
        rewardedAmount: reward.amount,
      });

      // Update user coins
      await supabase.rpc('add_user_coins', {
        p_user_id: userId,
        p_amount: reward.amount,
      });

      return reward;
    } finally {
      setIsShowingAd(false);
    }
  }, [userId, recordAdView]);

  // Get available ad for format
  const getAvailableAd = useCallback((format: AdFormat): AdConfig | null => {
    // Check frequency cap
    const todayCount = todayAdViews.filter(v => v.ad_format === format).length;
    const config = adConfigs.find(c => c.format === format);
    if (!config) return null;
    if (config.frequency_cap && todayCount >= config.frequency_cap) return null;
    return config;
  }, [adConfigs, todayAdViews]);

  // Show interstitial ad
  const showInterstitialAd = useCallback(async (): Promise<boolean> => {
    const config = getAvailableAd('interstitial');
    if (!config) return false;

    setIsShowingAd(true);
    try {
      // In production, would show actual ad
      await new Promise(resolve => setTimeout(resolve, 500));
      await recordAdView.mutateAsync({
        format: 'interstitial',
        network: config.network,
      });
      return true;
    } finally {
      setIsShowingAd(false);
    }
  }, [getAvailableAd, recordAdView]);

  // Track ad click
  const trackAdClick = useCallback(async (_adId: string, format: AdFormat) => {
    if (!userId) return;
    await supabase.rpc('record_ad_click', {
      p_user_id: userId,
      p_ad_id: _adId,
      p_format: format,
    });
  }, [userId]);

  // Get today's remaining ad quota
  const getRemainingQuota = useCallback((format: AdFormat): number => {
    const config = adConfigs.find(c => c.format === format);
    if (!config?.frequency_cap) return -1; // unlimited
    const todayCount = todayAdViews.filter(v => v.ad_format === format).length;
    return Math.max(0, config.frequency_cap - todayCount);
  }, [adConfigs, todayAdViews]);

  return {
    adConfigs,
    isFreeTier: isFreeTier ?? true,
    isShowingAd,
    lastReward,
    showRewardedAd,
    showInterstitialAd,
    trackAdClick,
    getAvailableAd,
    getRemainingQuota,
    todayAdCount: todayAdViews.length,
  };
}