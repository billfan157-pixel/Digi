import { useMemo } from 'react';
import { FEATURES, type FeatureKey } from '@/config/premium';
import { usePremiumStatus } from './useIsPremium';

export function useFeature(feature: FeatureKey): boolean {
  const status = usePremiumStatus();
  const isAllowed = useMemo(() => {
    if (status === 'none' || status === 'expired') return FEATURES[feature].free;
    if (status === 'grace') return FEATURES[feature].premium;
    return FEATURES[feature].premium;
  }, [status, feature]);
  return isAllowed;
}
