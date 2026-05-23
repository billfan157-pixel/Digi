import { useAppStore } from '@/store/useAppStore';
import type { PremiumTier } from '@/config/premium';

export type PremiumStatus = 'active' | 'grace' | 'expired' | 'none';

export function useSubscriptionTier(): PremiumTier {
  const profile = useAppStore(s => s.profile);
  if (!profile) return 'free';

  const tier = (profile.subscription_tier || 'free') as PremiumTier;
  if (tier === 'free') return 'free';

  // Check subscription validity
  const now = new Date();
  if (profile.subscription_end) {
    const end = new Date(profile.subscription_end);
    if (end > now) return tier;

    // Subscription has expired, check grace period
    if (profile.grace_period_end) {
      const grace = new Date(profile.grace_period_end);
      if (grace > now) return tier; // valid in grace period
    }

    return 'free'; // expired
  }

  // No subscription_end means lifetime/legacy premium (map to pro)
  return tier === 'pro' || (tier as string) === 'premium' ? 'pro' : tier;
}

export function useIsPremium(): boolean {
  const tier = useSubscriptionTier();
  return tier === 'plus' || tier === 'pro';
}

export function usePremiumStatus(): PremiumStatus {
  const profile = useAppStore(s => s.profile);
  const tier = useSubscriptionTier();
  if (tier === 'free') return 'none';

  const now = new Date();
  if (profile?.subscription_end) {
    const end = new Date(profile.subscription_end);
    if (end > now) return 'active';
    if (profile.grace_period_end) {
      const grace = new Date(profile.grace_period_end);
      if (grace > now) return 'grace';
    }
    return 'expired';
  }
  return 'active';
}
