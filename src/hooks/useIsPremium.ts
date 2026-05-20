import { useAppStore } from '@/store/useAppStore';

export type PremiumStatus = 'active' | 'grace' | 'expired' | 'none';

export function useIsPremium(): boolean {
  const isPremium = useAppStore(s => s.isPremium);
  const profile = useAppStore(s => s.profile);
  const status = getPremiumStatus(isPremium, profile?.subscription_end, profile?.grace_period_end);
  return status === 'active' || status === 'grace';
}


export function usePremiumStatus(): PremiumStatus {
  const isPremium = useAppStore(s => s.isPremium);
  const profile = useAppStore(s => s.profile);
  return getPremiumStatus(isPremium, profile?.subscription_end, profile?.grace_period_end);
}


function getPremiumStatus(
  isPremium: boolean,
  subscriptionEnd: string | null | undefined,
  gracePeriodEnd: string | null | undefined,
): PremiumStatus {
  if (!isPremium) return 'none';

  const now = new Date();

  if (subscriptionEnd) {
    const end = new Date(subscriptionEnd);
    if (end > now) return 'active';

    // Subscription has expired, check grace period
    if (gracePeriodEnd) {
      const grace = new Date(gracePeriodEnd);
      if (grace > now) return 'grace';
    }

    return 'expired';
  }

  // No subscription_end (legacy or lifetime)
  return 'active';
}
