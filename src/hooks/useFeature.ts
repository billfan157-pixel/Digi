import { useMemo } from 'react';
import { FEATURES, type FeatureKey } from '@/config/premium';
import { useSubscriptionTier } from './useIsPremium';

export function useFeature(feature: FeatureKey): boolean {
  const tier = useSubscriptionTier();
  const isAllowed = useMemo(() => {
    return FEATURES[feature][tier];
  }, [tier, feature]);
  return isAllowed;
}

