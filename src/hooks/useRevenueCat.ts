import i18n from '@/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '@/store/useAppStore';
import {
  initRevenueCat,
  purchasePackage,
  restorePurchases,
  getTierFromProductId,
} from '@/lib/revenuecat';
import type { BillingPlan } from '@/config/premium';
import { supabase } from '@/lib/supabase';
import { Sentry } from '@/lib/sentry';
import type { CustomerInfo } from '@revenuecat/purchases-capacitor';

export function useRevenueCat() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = useAppStore(s => s.profile);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    initRevenueCat().then(ready => {
      setIsReady(ready);
      if (ready) {
        setupCustomerListener();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setupCustomerListener() {
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      Purchases.addCustomerInfoUpdateListener((info) => {
        handleCustomerInfoChange(info);
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'revenuecat-listener' } });
    }
  }

  async function handleCustomerInfoChange(customerInfo: CustomerInfo) {
    if (!profile?.id) return;

    const activeEntry = Object.values(customerInfo.entitlements.all).find(e => e.isActive);
    if (!activeEntry) return;

    const tier = getTierFromProductId(activeEntry.productIdentifier);
    if (!tier) return;

    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_end: activeEntry.expirationDate,
      })
      .eq('id', profile.id);
  }

  const purchase = useCallback(async (tier: 'plus' | 'pro', plan: BillingPlan) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await purchasePackage(tier, plan);

      if ('error' in result && result.error) {
        if (!result.error.includes('UserCancelled')) {
          setError(result.error);
        }
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await restorePurchases();
      return { success: !!result.customerInfo };
    } catch {
      setError(i18n.t('common.cannot_restore_purchase'));
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isReady,
    isLoading,
    error,
    purchase,
    restore,
  };
}
