import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocialData } from '@/hooks/useSocialData';
import type { SocialFeedPost } from '@/models';
import { DEFAULT_SOCIAL_PROFILE_STATS } from '@/lib/social';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

vi.mock('@/lib/social', () => ({
  DEFAULT_SOCIAL_PROFILE_STATS: { followers: 0, following: 0, posts: 0 },
  isMissingSocialSchemaError: vi.fn(() => false),
}));

const mockRefetch = vi.fn(() => Promise.resolve({ data: [] }));
const mockMutateAsync = vi.fn(() => Promise.resolve());

vi.mock('@/hooks/useSocialQueries', () => ({
  useCloseCircleQuery: vi.fn(() => ({ data: [], isLoading: false, error: null, refetch: mockRefetch })),
  useSocialFollowingIdsQuery: vi.fn(() => ({ data: [], isLoading: false, error: null, refetch: mockRefetch })),
  useSocialProfileStatsQuery: vi.fn(() => ({ data: DEFAULT_SOCIAL_PROFILE_STATS, isLoading: false, error: null, refetch: mockRefetch })),
  useSocialFeedQuery: vi.fn(() => ({ data: { posts: [], stories: [] }, isLoading: false, error: null, refetch: mockRefetch })),
  useSocialSearchQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useSocialMutations', () => ({
  useFollowMutation: vi.fn(() => ({ addFollow: { mutateAsync: mockMutateAsync }, removeFollow: { mutateAsync: mockMutateAsync } })),
  useLikeMutation: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/hooks/useSocialComposer', () => ({ useSocialComposer: vi.fn(() => ({})) }));

describe('useSocialData — initial state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns initial state with empty arrays', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(result.current.socialPosts).toEqual([]);
    expect(result.current.socialStories).toEqual([]);
    expect(result.current.closeCircleMembers).toEqual([]);
    expect(result.current.socialError).toBe('');
  });

  it('has correct profile stats default', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(result.current.socialProfileStats).toEqual(DEFAULT_SOCIAL_PROFILE_STATS);
  });

  it('has discover people hidden by default', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(result.current.showDiscoverPeople).toBe(false);
  });

  it('has social profile hidden by default', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(result.current.showSocialProfile).toBe(false);
  });

  it('search query starts empty', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(result.current.socialSearchQuery).toBe('');
  });

  it('loadCloseCircle does not throw', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    expect(() => result.current.loadCloseCircle()).not.toThrow();
  });

  it('handleToggleLikePost does not throw', () => {
    const { result } = renderHook(() => useSocialData({ profile: null }), { wrapper });
    const post = { id: 'post-1', cheeredByMe: false, author_id: 'user-1', content: '', like_count: 0 } as unknown as SocialFeedPost;
    expect(() => result.current.handleToggleLikePost(post)).not.toThrow();
  });
});
