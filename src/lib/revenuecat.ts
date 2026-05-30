import i18n from '@/i18n';
import { Capacitor } from '@capacitor/core';
import { Sentry } from './sentry';
import type { BillingPlan, PremiumTier } from '@/config/premium';

export const RC_PLUS_MONTHLY = 'digiwell_plus_monthly';
export const RC_PLUS_YEARLY = 'digiwell_plus_yearly';
export const RC_PRO_MONTHLY = 'digiwell_pro_monthly';
export const RC_PRO_YEARLY = 'digiwell_pro_yearly';

const PRODUCT_IDS = {
  plus: { monthly: RC_PLUS_MONTHLY, yearly: RC_PLUS_YEARLY },
  pro: { monthly: RC_PRO_MONTHLY, yearly: RC_PRO_YEARLY },
} as const;

let isInitialized = false;

export async function initRevenueCat(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (isInitialized) return true;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const apiKey = Capacitor.getPlatform() === 'ios'
      ? (import.meta.env.VITE_REVENUECAT_IOS_API_KEY || '')
      : (import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY || '');

    if (!apiKey) {
      console.warn('[RevenueCat] No API key configured');
      return false;
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;
    return true;
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'revenuecat-init' } });
    return false;
  }
}

export function getProductId(tier: 'plus' | 'pro', plan: BillingPlan): string {
  return PRODUCT_IDS[tier][plan];
}

export function getTierFromProductId(productId: string): PremiumTier | null {
  if (productId.startsWith('digiwell_plus')) return 'plus';
  if (productId.startsWith('digiwell_pro')) return 'pro';
  return null;
}

export async function getPackageForProduct(tier: 'plus' | 'pro', plan: BillingPlan) {
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  const offerings = await Purchases.getOfferings();
  const productId = getProductId(tier, plan);

  if (!offerings.current) return null;

  if (plan === 'yearly') {
    if (offerings.current.annual?.product.identifier === productId) {
      return offerings.current.annual;
    }
  }

  if (offerings.current.monthly?.product.identifier === productId) {
    return offerings.current.monthly;
  }

  const found = offerings.current.availablePackages.find(p => p.product.identifier === productId);
  return found || null;
}

export async function purchasePackage(tier: 'plus' | 'pro', plan: BillingPlan) {
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const aPackage = await getPackageForProduct(tier, plan);

    if (!aPackage) {
      return { error: i18n.t('common.no_payment_package') };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage });

    import('@/lib/analytics').then(({ track }) =>
      track('subscription_purchased', { tier, plan, store: Capacitor.getPlatform() }),
    );

    return { customerInfo };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Purchase failed';
    if (!msg.includes('UserCancelled')) {
      Sentry.captureException(err, { extra: { tier, plan }, tags: { feature: 'revenuecat-purchase' } });
    }
    return { error: msg };
  }
}

export async function restorePurchases() {
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    return { customerInfo };
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'revenuecat-restore' } });
    return { customerInfo: null };
  }
}

export async function getCustomerInfo() {
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch {
    return null;
  }
}
