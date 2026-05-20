/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeed } from '@/hooks/useFeed';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

vi.mock('@/lib/supabase', () => {
  const mockChain = vi.fn();
  (mockChain as any).select = vi.fn(() => mockChain);
  (mockChain as any).eq = vi.fn(() => mockChain);
  (mockChain as any).in = vi.fn(() => mockChain);
  (mockChain as any).order = vi.fn(() => mockChain);
  (mockChain as any).range = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
  (mockChain as any).maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  (mockChain as any).single = vi.fn(() => Promise.resolve({ data: null, error: null }));
  (mockChain as any).upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));

  return {
    supabase: {
      from: vi.fn(() => mockChain),
      channel: vi.fn(() => ({
        on: vi.fn(() => ({ subscribe: vi.fn(() => 'SUBSCRIBED') })),
        unsubscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock('@/lib/sessionSecurity', () => ({
  readFeedCache: vi.fn(() => null),
  writeFeedCache: vi.fn(),
}));

vi.mock('@/models', () => ({}));

describe('useFeed — initial state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts with empty posts', async () => {
    const { result } = renderHook(() => useFeed('user-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
    });
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isFetchingMore).toBe(false);
    expect(result.current.newPostsCount).toBe(0);
  });

  it('starts with empty state for undefined userId', async () => {
    const { result } = renderHook(() => useFeed(undefined), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('loadMore does not throw when called', async () => {
    const { result } = renderHook(() => useFeed('user-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
    });
    act(() => {
      expect(() => result.current.loadMore()).not.toThrow();
    });
  });

  it('refetch returns without error', async () => {
    const { result } = renderHook(() => useFeed('user-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
    });
    await act(async () => {
      await expect(result.current.refetch()).resolves.toBeUndefined();
    });
  });

  it('showNewPosts clears pending count', async () => {
    const { result } = renderHook(() => useFeed('user-1'), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
    });
    act(() => {
      result.current.showNewPosts();
    });
    expect(result.current.newPostsCount).toBe(0);
  });
});
