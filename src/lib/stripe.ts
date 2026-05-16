import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabase';
import { toast } from 'sonner';
import { Sentry } from './sentry';

type BillingPlan = 'monthly' | 'yearly';

export const PREMIUM_CHECKOUT_AVAILABLE = true;

export async function startPremiumCheckout(plan: BillingPlan) {
  const successUrl = Capacitor.isNativePlatform()
    ? 'digiwell://checkout-success'
    : `${window.location.origin}/checkout-success`;
  const cancelUrl = Capacitor.isNativePlatform()
    ? 'digiwell://checkout-cancel'
    : `${window.location.origin}/checkout-cancel`;

  Sentry.setContext('stripe-checkout', { plan, successUrl });

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: { plan, successUrl, cancelUrl },
  });

  if (error) {
    Sentry.captureMessage('Stripe checkout failed', { extra: { plan, error: error.message } });
    throw new Error(error.message || 'Không thể kết nối thanh toán.');
  }
  if (!data?.url) {
    Sentry.captureMessage('Stripe checkout missing URL', { extra: { plan, data } });
    throw new Error('Không thể tạo phiên thanh toán.');
  }

  return { sessionId: data.id as string, url: data.url as string };
}

export async function redirectToCheckout(plan: BillingPlan) {
  const toastId = toast.loading('Đang kết nối thanh toán...');

  try {
    const { url } = await startPremiumCheckout(plan);
    toast.dismiss(toastId);

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url, presentationStyle: 'popover' });
    } else {
      window.location.href = url;
    }
  } catch (error) {
    toast.dismiss(toastId);
    const msg = error instanceof Error ? error.message : 'Thanh toán không khả dụng.';
    toast.error(msg);
  }
}

export function readCheckoutResult(): { status: 'success' | 'cancel'; sessionId: string | null } | null {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  if (window.location.pathname.includes('/checkout-success') && sessionId) {
    return { status: 'success', sessionId };
  }
  if (window.location.pathname.includes('/checkout-cancel')) {
    return { status: 'cancel', sessionId: null };
  }
  return null;
}

export function clearCheckoutResult() {
  if (window.location.pathname.includes('/checkout-success') || window.location.pathname.includes('/checkout-cancel')) {
    window.history.replaceState({}, '', '/');
  }
}
