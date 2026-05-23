import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/browser', () => ({
  Browser: { open: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { loading: vi.fn(() => 'toast-id'), dismiss: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockInvoke = vi.fn();
vi.mock('./supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
  isSupabaseConfigured: false,
}));

describe('stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startPremiumCheckout', () => {
    it('returns sessionId and url on success', async () => {
      mockInvoke.mockResolvedValue({
        data: { id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123' },
        error: null,
      });

      const { startPremiumCheckout } = await import('./stripe');
      const result = await startPremiumCheckout('monthly');

      expect(result.sessionId).toBe('cs_test_123');
      expect(result.url).toBe('https://checkout.stripe.com/cs_test_123');
      expect(mockInvoke).toHaveBeenCalledWith('create-stripe-checkout', {
        body: { plan: 'monthly', tier: 'pro', successUrl: 'http://localhost:3000/checkout-success', cancelUrl: 'http://localhost:3000/checkout-cancel' },
      });
    });

    it('throws when edge function returns error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const { startPremiumCheckout } = await import('./stripe');
      await expect(startPremiumCheckout('yearly')).rejects.toThrow('Unauthorized');
    });

    it('throws when no url returned', async () => {
      mockInvoke.mockResolvedValue({
        data: { id: 'cs_test_123', url: '' },
        error: null,
      });

      const { startPremiumCheckout } = await import('./stripe');
      await expect(startPremiumCheckout('monthly')).rejects.toThrow('Không thể tạo phiên thanh toán');
    });
  });

  describe('readCheckoutResult', () => {
    it('returns success when path matches checkout-success', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/checkout-success', search: '?session_id=cs_test_123' },
        writable: true,
      });

      const { readCheckoutResult } = await import('./stripe');
      const result = readCheckoutResult();
      expect(result).toEqual({ status: 'success', sessionId: 'cs_test_123' });
    });

    it('returns cancel when path matches checkout-cancel', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/checkout-cancel', search: '' },
        writable: true,
      });

      const { readCheckoutResult } = await import('./stripe');
      const result = readCheckoutResult();
      expect(result).toEqual({ status: 'cancel', sessionId: null });
    });

    it('returns null for unrelated paths', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/app/home', search: '' },
        writable: true,
      });

      const { readCheckoutResult } = await import('./stripe');
      expect(readCheckoutResult()).toBeNull();
    });
  });

  describe('clearCheckoutResult', () => {
    it('replaces state when on checkout paths', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/checkout-success', search: '?session_id=cs_test_123' },
        writable: true,
      });

      const { clearCheckoutResult } = await import('./stripe');
      clearCheckoutResult();
      expect(window.location.pathname).toBe('/checkout-success');
    });
  });

  it('exports PREMIUM_CHECKOUT_AVAILABLE as true', async () => {
    const { PREMIUM_CHECKOUT_AVAILABLE } = await import('./stripe');
    expect(PREMIUM_CHECKOUT_AVAILABLE).toBe(true);
  });
});

describe('redirectToCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens Browser when native platform', async () => {
    vi.mocked(await import('@capacitor/core')).Capacitor.isNativePlatform = vi.fn(() => true);
    const { Browser } = await import('@capacitor/browser');
    vi.mocked(Browser.open).mockResolvedValue(undefined as never);

    mockInvoke.mockResolvedValue({
      data: { id: 'cs_test', url: 'https://checkout.stripe.com/cs_test' },
      error: null,
    });

    const { redirectToCheckout } = await import('./stripe');
    await redirectToCheckout('monthly');

    expect(Browser.open).toHaveBeenCalledWith({ url: 'https://checkout.stripe.com/cs_test', presentationStyle: 'popover' });
  });

  it('sets window.location when web platform', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    mockInvoke.mockResolvedValue({
      data: { id: 'cs_test', url: 'https://checkout.stripe.com/cs_test' },
      error: null,
    });

    const originalLocation = window.location;
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '', assign: assignMock },
      writable: true,
    });

    const { redirectToCheckout } = await import('./stripe');
    await redirectToCheckout('yearly');

    expect(window.location.href).toBe('https://checkout.stripe.com/cs_test');
  });

  it('shows error toast when startPremiumCheckout throws', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Payment failed' },
    });

    const { toast } = await import('sonner');

    const { redirectToCheckout } = await import('./stripe');
    await redirectToCheckout('monthly');

    expect(toast.error).toHaveBeenCalled();
  });
});

describe('clearCheckoutResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing on non-checkout path', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/app/home', search: '' },
      writable: true,
    });

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    const { clearCheckoutResult } = await import('./stripe');
    clearCheckoutResult();

    expect(replaceStateSpy).not.toHaveBeenCalled();
  });
});