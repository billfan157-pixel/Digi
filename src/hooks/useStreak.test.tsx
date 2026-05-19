import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStreak } from '@/hooks/useStreak';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

vi.mock('@/lib/supabase', () => {
  const mockChain = {
    select: vi.fn(() => mockChain),
    eq: vi.fn(() => mockChain),
    gte: vi.fn(() => mockChain),
    lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  };
  return {
    supabase: {
      from: vi.fn(() => mockChain),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useStreak — streak calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streak = pastStreak when todayIntake < waterGoal', async () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, false),
      { wrapper },
    );
    expect(result.current.streak).toBe(0);
  });

  it('streak = pastStreak + 1 when todayIntake >= waterGoal', async () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 2000, false),
      { wrapper },
    );
    expect(result.current.streak).toBe(1);
  });

  it('returns 0 streak for undefined userId', () => {
    const { result } = renderHook(
      () => useStreak(undefined, 2000, 1000, false),
      { wrapper },
    );
    expect(result.current.streak).toBe(0);
  });

  it('returns 0 streak for "undefined" userId', () => {
    const { result } = renderHook(
      () => useStreak('undefined', 2000, 1000, false),
      { wrapper },
    );
    expect(result.current.streak).toBe(0);
  });
});

describe('useStreak — freeze logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('needsFreeze is false when not premium', () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, false),
      { wrapper },
    );
    expect(result.current.needsFreeze).toBe(false);
  });

  it('needsFreeze is false when streakFreezes is 0', () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, true),
      { wrapper },
    );
    expect(result.current.needsFreeze).toBe(false);
  });

  it('has correct initial freezes count', () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, true),
      { wrapper },
    );
    expect(result.current.streakFreezes).toBe(0);
  });

  it('useStreakFreeze returns false when not premium', async () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, false),
      { wrapper },
    );
    const outcome = await act(async () => result.current.useStreakFreeze());
    expect(outcome).toBe(false);
  });

  it('useStreakFreeze returns false when streakFreezes <= 0', async () => {
    const { result } = renderHook(
      () => useStreak('user-1', 2000, 1000, true),
      { wrapper },
    );
    const outcome = await act(async () => result.current.useStreakFreeze());
    expect(outcome).toBe(false);
  });
});
