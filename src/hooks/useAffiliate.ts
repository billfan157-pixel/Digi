/**
 * useAffiliate Hook
 * Commission tracking for user referrals
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AffiliateLink {
  id: string;
  user_id: string;
  code: string;
  url: string;
  created_at: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  commission_earned: number;
  is_active: boolean;
}

interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  referred_email: string;
  status: 'pending' | 'signed_up' | 'premium' | 'churned';
  joined_at: string;
  premium_started_at?: string;
  commission_earned: number;
}

interface AffiliateStats {
  total_earned: number;
  pending_payout: number;
  total_referrals: number;
  premium_referrals: number;
  conversion_rate: number;
}

export function useAffiliate(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [referralCode, setReferralCode] = useState('');

  // Get user's affiliate link
  const { data: affiliateLink } = useQuery({
    queryKey: ['affiliate-link', userId],
    queryFn: async (): Promise<AffiliateLink | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!userId,
  });

  // Get referral stats
  const { data: stats } = useQuery({
    queryKey: ['affiliate-stats', userId],
    queryFn: async (): Promise<AffiliateStats> => {
      if (!userId) return {
        total_earned: 0,
        pending_payout: 0,
        total_referrals: 0,
        premium_referrals: 0,
        conversion_rate: 0,
      };
      const { data, error } = await supabase.rpc('get_affiliate_stats', {
        p_user_id: userId,
      });
      if (error) return {
        total_earned: 0,
        pending_payout: 0,
        total_referrals: 0,
        premium_referrals: 0,
        conversion_rate: 0,
      };
      return data;
    },
    enabled: !!userId,
  });

  // Get referrals list
  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', userId],
    queryFn: async (): Promise<Referral[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliateLink?.id)
        .order('joined_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!userId && !!affiliateLink,
  });

  // Generate referral link
  const generateLink = useCallback(async () => {
    if (!userId) return null;
    const code = `REF-${userId.slice(0, 8).toUpperCase()}-${Date.now().toString(36)}`;
    const url = `https://digiwell.app/register?ref=${code}`;

    const { data, error } = await supabase
      .from('affiliate_links')
      .upsert({
        user_id: userId,
        code,
        url,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [userId]);

  // Track click
  const trackClick = useCallback(async (code: string) => {
    const { error } = await supabase.rpc('track_affiliate_click', {
      p_code: code,
    });
    return !error;
  }, []);

  // Track conversion
  const trackConversion = useCallback(async (newUserId: string, code: string) => {
    const { error } = await supabase.rpc('track_affiliate_conversion', {
      p_new_user_id: newUserId,
      p_code: code,
    });
    return !error;
  }, []);

  // Request payout
  const requestPayout = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.rpc('request_affiliate_payout', {
        p_user_id: userId,
        p_amount: amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
    },
  });

  return {
    affiliateLink,
    stats: stats || {
      total_earned: 0,
      pending_payout: 0,
      total_referrals: 0,
      premium_referrals: 0,
      conversion_rate: 0,
    },
    referrals,
    generateLink,
    trackClick,
    trackConversion,
    requestPayout: requestPayout.mutate,
    referralCode,
    setReferralCode,
  };
}
