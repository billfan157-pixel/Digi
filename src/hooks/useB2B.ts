/**
 * useB2B Hook
 * White-label licensing for gyms and corporate partners
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type PartnerType = 'gym' | 'corporate' | 'clinic' | 'school';
type LicenseTier = 'starter' | 'professional' | 'enterprise';

interface B2BPartner {
  id: string;
  name: string;
  type: PartnerType;
  license_tier: LicenseTier;
  max_users: number;
  current_users: number;
  subdomain: string;
  custom_branding: boolean;
  api_access: boolean;
  billing_email: string;
  license_expires_at: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
}

interface LicenseKey {
  id: string;
  partner_id: string;
  key: string;
  tier: LicenseTier;
  max_activations: number;
  activations_used: number;
  expires_at: string;
  is_active: boolean;
}

interface UsageRecord {
  id: string;
  partner_id: string;
  period: string;
  active_users: number;
  hydration_events: number;
  premium_upgrades: number;
  revenue_share: number;
}

export function useB2B() {
  const [isLoading, setIsLoading] = useState(false);

  // Get partner info
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['b2b-partner'],
    queryFn: async (): Promise<B2BPartner | null> => {
      // In production, would fetch based on authenticated partner
      const { data, error } = await supabase
        .from('b2b_partners')
        .select('*')
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
  });

  // Get license keys
  const { data: licenseKeys = [] } = useQuery({
    queryKey: ['license-keys', partner?.id],
    queryFn: async (): Promise<LicenseKey[]> => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .eq('partner_id', partner.id);
      if (error) return [];
      return data || [];
    },
    enabled: !!partner?.id,
  });

  // Get usage reports
  const { data: usageReports = [] } = useQuery({
    queryKey: ['usage-reports', partner?.id],
    queryFn: async (): Promise<UsageRecord[]> => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from('usage_reports')
        .select('*')
        .eq('partner_id', partner.id)
        .order('period', { ascending: false })
        .limit(12);
      if (error) return [];
      return data || [];
    },
    enabled: !!partner?.id,
  });

  // Request demo/trial
  const requestTrial = useCallback(async (info: {
    company_name: string;
    type: PartnerType;
    email: string;
    phone: string;
    user_count: number;
  }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('create_b2b_trial_request', {
        p_company_name: info.company_name,
        p_type: info.type,
        p_email: info.email,
        p_phone: info.phone,
        p_user_count: info.user_count,
      });
      return { success: !error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upgrade license
  const upgradeLicense = useCallback(async (tier: LicenseTier) => {
    if (!partner) return { success: false };
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('upgrade_b2b_license', {
        p_partner_id: partner.id,
        p_tier: tier,
      });
      return { success: !error };
    } finally {
      setIsLoading(false);
    }
  }, [partner]);

  // Get API credentials
  const getAPICredentials = useCallback(async () => {
    if (!partner?.id) return null;
    const { data, error } = await supabase.rpc('get_b2b_api_credentials', {
      p_partner_id: partner.id,
    });
    if (error) return null;
    return data;
  }, [partner]);

  // Generate client license key
  const generateClientKey = useCallback(async (clientName: string, maxUsers: number) => {
    if (!partner?.id) return null;
    const { data, error } = await supabase.rpc('generate_client_license_key', {
      p_partner_id: partner.id,
      p_client_name: clientName,
      p_max_users: maxUsers,
    });
    if (error) return null;
    return data;
  }, [partner]);

  // Get revenue share
  const getRevenueShare = useCallback(async (period: string) => {
    if (!partner?.id) return 0;
    const record = usageReports.find(r => r.period === period);
    return record?.revenue_share || 0;
  }, [partner, usageReports]);

  return {
    partner,
    licenseKeys,
    usageReports,
    isLoading: isLoading || partnerLoading,
    requestTrial,
    upgradeLicense,
    getAPICredentials,
    generateClientKey,
    getRevenueShare,
  };
}
