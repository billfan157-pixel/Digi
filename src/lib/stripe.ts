import type { BillingPlan } from '../config/premium';

type CheckoutResult = {
  status: 'success' | 'cancel' | 'unavailable';
  sessionId: string | null;
};

export const PREMIUM_CHECKOUT_AVAILABLE = false;

export const readCheckoutResult = (): CheckoutResult | null => null;

export const clearCheckoutResult = () => {};

export const startPremiumCheckout = async (_plan: BillingPlan): Promise<CheckoutResult> => ({
  status: 'unavailable',
  sessionId: null,
});
