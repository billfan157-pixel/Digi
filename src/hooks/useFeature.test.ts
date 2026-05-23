import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscriptionTier, useIsPremium } from '@/hooks/useIsPremium';
import { useFeature } from '@/hooks/useFeature';

// Mock supabase client to avoid network attempts
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
  isSupabaseConfigured: true,
}));

let mockProfile: Record<string, unknown> | null = null;

// Mock the AppStore
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      profile: mockProfile,
    };
    return selector(state);
  }),
}));

describe('Freemium 3-Tier Model Hooks', () => {
  beforeEach(() => {
    mockProfile = null;
    vi.clearAllMocks();
  });

  describe('useSubscriptionTier', () => {
    it('returns "free" when profile is null', () => {
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('free');
    });

    it('returns "free" when subscription_tier is not set', () => {
      mockProfile = { subscription_tier: null };
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('free');
    });

    it('returns "plus" when tier is plus and subscription is active', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'plus',
        subscription_end: tomorrow.toISOString(),
      };
      
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('plus');
    });

    it('returns "pro" when tier is pro and subscription is active', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'pro',
        subscription_end: tomorrow.toISOString(),
      };
      
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('pro');
    });

    it('returns "free" when subscription has expired without grace period', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockProfile = {
        subscription_tier: 'plus',
        subscription_end: yesterday.toISOString(),
        grace_period_end: null,
      };
      
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('free');
    });

    it('returns actual tier when subscription has expired but within grace period', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      mockProfile = {
        subscription_tier: 'pro',
        subscription_end: yesterday.toISOString(),
        grace_period_end: tomorrow.toISOString(),
      };
      
      const { result } = renderHook(() => useSubscriptionTier());
      expect(result.current).toBe('pro');
    });
  });

  describe('useIsPremium', () => {
    it('returns false for free tier', () => {
      mockProfile = { subscription_tier: 'free' };
      const { result } = renderHook(() => useIsPremium());
      expect(result.current).toBe(false);
    });

    it('returns true for plus tier', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'plus',
        subscription_end: tomorrow.toISOString(),
      };
      const { result } = renderHook(() => useIsPremium());
      expect(result.current).toBe(true);
    });

    it('returns true for pro tier', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'pro',
        subscription_end: tomorrow.toISOString(),
      };
      const { result } = renderHook(() => useIsPremium());
      expect(result.current).toBe(true);
    });
  });

  describe('useFeature gating', () => {
    it('allows basic features for free tier', () => {
      mockProfile = { subscription_tier: 'free' };
      
      const chatAllowed = renderHook(() => useFeature('aiChat'));
      const coachAllowed = renderHook(() => useFeature('aiHydrationCoach'));
      
      expect(chatAllowed.result.current).toBe(true);
      expect(coachAllowed.result.current).toBe(false);
    });

    it('allows plus-tier features for plus tier', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'plus',
        subscription_end: tomorrow.toISOString(),
      };
      
      const weeklyChartAllowed = renderHook(() => useFeature('weeklyChart'));
      const coachAllowed = renderHook(() => useFeature('aiHydrationCoach'));
      
      expect(weeklyChartAllowed.result.current).toBe(true);
      expect(coachAllowed.result.current).toBe(false);
    });

    it('allows all features for pro tier', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockProfile = {
        subscription_tier: 'pro',
        subscription_end: tomorrow.toISOString(),
      };
      
      const weeklyChartAllowed = renderHook(() => useFeature('weeklyChart'));
      const coachAllowed = renderHook(() => useFeature('aiHydrationCoach'));
      
      expect(weeklyChartAllowed.result.current).toBe(true);
      expect(coachAllowed.result.current).toBe(true);
    });
  });
});
