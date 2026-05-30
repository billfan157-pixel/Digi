import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function mockSelectChain(returns: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'in', 'neq', 'order', 'range', 'filter', 'limit', 'maybeSingle'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = vi.fn((resolve: (value: unknown) => void) => resolve(returns));
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.filter = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchCloseCircle', () => {
  it('returns mapped close circle members', async () => {
    const follows = [
      { following_id: 'u1', created_at: '2024-01-03T00:00:00Z' },
      { following_id: 'u2', created_at: '2024-01-02T00:00:00Z' },
    ];
    const profiles = [
      { id: 'u1', nickname: 'Alice', avatar_url: 'av.jpg', level: 5, water_today: 1500, water_goal: 2000 },
    ];

    const selectChain = mockSelectChain({ data: follows, error: null });
    mockFrom.mockReturnValueOnce(selectChain);

    const profileChain = mockSelectChain({ data: profiles, error: null });
    mockFrom.mockReturnValueOnce(profileChain);

    const { fetchCloseCircle } = await import('./social.service');
    const result = await fetchCloseCircle('my-id');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('u1');
    expect(result[0].nickname).toBe('Alice');
    expect(result[0].avatar_url).toBe('av.jpg');
    expect(result[0].level).toBe(5);
    expect(result[0].priority).toBe(1);
    expect(result[1].id).toBe('u2');
    expect(result[1].nickname).toBe('Bạn DigiWell');
    expect(result[1].level).toBeNull();
  });

  it('returns empty array when no follows', async () => {
    const selectChain = mockSelectChain({ data: [], error: null });
    mockFrom.mockReturnValueOnce(selectChain);

    const { fetchCloseCircle } = await import('./social.service');
    const result = await fetchCloseCircle('my-id');
    expect(result).toEqual([]);
  });

  it('throws on follows error', async () => {
    const selectChain = mockSelectChain({ data: null, error: new Error('db fail') });
    mockFrom.mockReturnValueOnce(selectChain);

    const { fetchCloseCircle } = await import('./social.service');
    await expect(fetchCloseCircle('my-id')).rejects.toThrow('db fail');
  });
});

describe('fetchSocialFollowingIds', () => {
  it('returns list of following ids', async () => {
    const chain = mockSelectChain({ data: [{ following_id: 'u1' }, { following_id: 'u2' }], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { fetchSocialFollowingIds } = await import('./social.service');
    const result = await fetchSocialFollowingIds('my-id');
    expect(result).toEqual(['u1', 'u2']);
  });

  it('returns empty array when no follows', async () => {
    const chain = mockSelectChain({ data: [], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { fetchSocialFollowingIds } = await import('./social.service');
    const result = await fetchSocialFollowingIds('my-id');
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    const chain = mockSelectChain({ data: null, error: new Error('fail') });
    mockFrom.mockReturnValueOnce(chain);

    const { fetchSocialFollowingIds } = await import('./social.service');
    await expect(fetchSocialFollowingIds('my-id')).rejects.toThrow('fail');
  });
});

describe('fetchSocialProfileStats', () => {
  it('returns mapped stats from RPC', async () => {
    mockRpc.mockResolvedValue({ data: { follower_count: 10, following_count: 5, post_count: 3 }, error: null });

    const { fetchSocialProfileStats } = await import('./social.service');
    const result = await fetchSocialProfileStats('uid');
    expect(result).toEqual({ followers: 10, following: 5, posts: 3 });
  });

  it('returns zeros when data is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { fetchSocialProfileStats } = await import('./social.service');
    const result = await fetchSocialProfileStats('uid');
    expect(result).toEqual({ followers: 0, following: 0, posts: 0 });
  });

  it('throws on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('rpc fail') });

    const { fetchSocialProfileStats } = await import('./social.service');
    await expect(fetchSocialProfileStats('uid')).rejects.toThrow('rpc fail');
  });
});

describe('fetchSocialFeed', () => {
  function makeMockSelectChain(returns: Record<string, unknown>) {
    const chain: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'in', 'neq', 'order', 'range'];
    for (const m of methods) {
      chain[m] = vi.fn(() => chain);
    }
    chain.then = vi.fn((resolve: (value: unknown) => void) => resolve(returns));
    chain.order = vi.fn(() => chain);
    chain.range = vi.fn(() => chain);
    chain.in = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.neq = vi.fn(() => chain);
    return chain;
  }

  it('returns posts and stories', async () => {
    const postRows = [
      { id: 'p1', author_id: 'me', content: 'Hello', image_url: null, post_kind: 'status', visibility: 'public', hydration_ml: 500, streak_snapshot: 3, like_count: 2, created_at: '2024-06-15T10:00:00Z', expires_at: null, event_type: null, reference_id: null, stake_coins: null, is_squad_highlight: false },
      { id: 'p2', author_id: 'friend', content: 'Story', image_url: null, post_kind: 'story', visibility: 'followers', hydration_ml: null, streak_snapshot: null, like_count: 0, created_at: '2024-06-15T11:00:00Z', expires_at: '2099-06-16T11:00:00Z', event_type: null, reference_id: null, stake_coins: null, is_squad_highlight: false },
    ];
    const profiles = [
      { id: 'me', nickname: 'Me', avatar_url: null, level: 1, water_today: 500, water_goal: 2000 },
      { id: 'friend', nickname: 'Friend', avatar_url: 'av.jpg', level: 2, water_today: null, water_goal: null },
    ];
    const likes = [{ post_id: 'p1' }];

    mockFrom
      .mockReturnValueOnce(makeMockSelectChain({ data: postRows, error: null }))
      .mockReturnValueOnce(makeMockSelectChain({ data: profiles, error: null }))
      .mockReturnValueOnce(makeMockSelectChain({ data: likes, error: null }));

    const { fetchSocialFeed } = await import('./social.service');
    const result = await fetchSocialFeed('me', ['friend']);

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].id).toBe('p1');
    expect(result.posts[0].cheeredByMe).toBe(true);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].author_id).toBe('friend');
  });

  it('returns empty when no posts', async () => {
    mockFrom
      .mockReturnValueOnce(makeMockSelectChain({ data: [], error: null }));

    const { fetchSocialFeed } = await import('./social.service');
    const result = await fetchSocialFeed('me', ['friend']);

    expect(result.posts).toEqual([]);
    expect(result.stories).toEqual([]);
  });

  it('filters expired stories', async () => {
    const postRows = [
      { id: 'p1', author_id: 'friend', content: 'Expired story', image_url: null, post_kind: 'story', visibility: 'followers', hydration_ml: null, streak_snapshot: null, like_count: 0, created_at: '2024-06-15T10:00:00Z', expires_at: '2020-06-16T10:00:00Z', event_type: null, reference_id: null, stake_coins: null, is_squad_highlight: false },
    ];

    mockFrom
      .mockReturnValueOnce(makeMockSelectChain({ data: postRows, error: null }));

    const { fetchSocialFeed } = await import('./social.service');
    const result = await fetchSocialFeed('me', []);

    expect(result.posts).toEqual([]);
    expect(result.stories).toEqual([]);
  });

  it('handles story without expires_at', async () => {
    const postRows = [
      { id: 'p1', author_id: 'friend', content: 'No expiry', image_url: null, post_kind: 'story', visibility: 'followers', hydration_ml: null, streak_snapshot: null, like_count: 0, created_at: '2024-06-15T10:00:00Z', expires_at: null, event_type: null, reference_id: null, stake_coins: null, is_squad_highlight: false },
    ];

    mockFrom
      .mockReturnValueOnce(makeMockSelectChain({ data: postRows, error: null }));

    const { fetchSocialFeed } = await import('./social.service');
    const result = await fetchSocialFeed('me', []);

    expect(result.posts).toEqual([]);
    expect(result.stories).toEqual([]);
  });
});

describe('searchSocialProfiles', () => {
  function makeMockSelectChain(returns: Record<string, unknown>) {
    const chain: Record<string, unknown> = {};
    chain.limit = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.neq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.filter = vi.fn(() => chain);
    chain.then = vi.fn((resolve: (value: unknown) => void) => resolve(returns));
    return chain;
  }

  it('returns profiles with search query', async () => {
    const data = [
      { id: 'u1', nickname: 'Alice', avatar_url: 'a.jpg', level: 3, water_today: 1000, water_goal: 2000 },
    ];
    const chain = makeMockSelectChain({ data, error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    const result = await searchSocialProfiles('my-id', 'Ali', [], []);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
    expect(result[0].isFollowing).toBe(false);
    expect(result[0].isInCircle).toBe(false);
    expect(chain.filter).toHaveBeenCalled();
  });

  it('marks following and circle status', async () => {
    const data = [
      { id: 'u1', nickname: 'Bob', avatar_url: null, level: null, water_today: null, water_goal: null },
    ];
    const chain = makeMockSelectChain({ data, error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    const result = await searchSocialProfiles('my-id', '', [], ['u1']);

    expect(result[0].isFollowing).toBe(true);
    expect(result[0].isInCircle).toBe(false);
  });

  it('returns empty array when no data', async () => {
    const chain = makeMockSelectChain({ data: [], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    const result = await searchSocialProfiles('my-id', '', [], []);

    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const chain = makeMockSelectChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    const result = await searchSocialProfiles('my-id', '', [], []);

    expect(result).toEqual([]);
  });

  it('uses order when no keyword', async () => {
    const chain = makeMockSelectChain({ data: [], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    await searchSocialProfiles('my-id', '', [], []);

    expect(chain.filter).not.toHaveBeenCalled();
    expect(chain.order).toHaveBeenCalledWith('nickname', { ascending: true });
  });

  it('escapes special characters in keyword', async () => {
    const chain = makeMockSelectChain({ data: [], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const { searchSocialProfiles } = await import('./social.service');
    await searchSocialProfiles('my-id', '100%_test\\x', [], []);

    expect(chain.filter).toHaveBeenCalledWith('nickname', 'ilike', expect.stringContaining('100\\%\\_test\\\\x'));
  });
});

describe('addFollow', () => {
  it('calls upsert and resolves', async () => {
    const upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    mockFrom.mockReturnValue({ upsert });

    const { addFollow } = await import('./social.service');
    await addFollow('me', 'them');

    expect(upsert).toHaveBeenCalledWith(
      { follower_id: 'me', following_id: 'them' },
      { onConflict: 'follower_id,following_id', ignoreDuplicates: true },
    );
  });

  it('throws on error', async () => {
    const upsert = vi.fn(() => Promise.resolve({ data: null, error: new Error('dup') }));
    mockFrom.mockReturnValue({ upsert });

    const { addFollow } = await import('./social.service');
    await expect(addFollow('me', 'them')).rejects.toThrow('dup');
  });
});

describe('removeFollow', () => {
  it('calls delete and resolves', async () => {
    const eq = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) }));
    const del = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: del });

    const { removeFollow } = await import('./social.service');
    await removeFollow('me', 'them');
  });

  it('throws on error', async () => {
    const eq = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('fail') })) }));
    const del = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: del });

    const { removeFollow } = await import('./social.service');
    await expect(removeFollow('me', 'them')).rejects.toThrow('fail');
  });
});

describe('addLike', () => {
  it('inserts and resolves', async () => {
    const insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    mockFrom.mockReturnValue({ insert });

    const { addLike } = await import('./social.service');
    await addLike('post-1', 'me');
    expect(insert).toHaveBeenCalledWith({ post_id: 'post-1', user_id: 'me' });
  });

  it('throws on error', async () => {
    const insert = vi.fn(() => Promise.resolve({ data: null, error: new Error('insert fail') }));
    mockFrom.mockReturnValue({ insert });

    const { addLike } = await import('./social.service');
    await expect(addLike('post-1', 'me')).rejects.toThrow('insert fail');
  });
});

describe('removeLike', () => {
  it('deletes and resolves', async () => {
    const eq2 = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const del = vi.fn(() => ({ eq: eq1 }));
    mockFrom.mockReturnValue({ delete: del });

    const { removeLike } = await import('./social.service');
    await removeLike('post-1', 'me');
  });

  it('throws on error', async () => {
    const eq2 = vi.fn(() => Promise.resolve({ data: null, error: new Error('delete fail') }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const del = vi.fn(() => ({ eq: eq1 }));
    mockFrom.mockReturnValue({ delete: del });

    const { removeLike } = await import('./social.service');
    await expect(removeLike('post-1', 'me')).rejects.toThrow('delete fail');
  });
});
