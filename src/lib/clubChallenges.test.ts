import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

function buildChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'lte', 'gte', 'order', 'limit', 'insert', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = vi.fn((resolve: (value: unknown) => void) => resolve(result));
  return chain;
}

describe('fetchActiveChallenge', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns challenge when found', async () => {
    const challenge = { id: 'c1', club_id: 'club1', title: 'Thử thách 7 ngày', target_ml: 7000, start_date: '2026-01-01', end_date: '2026-02-01', created_by: 'u1', created_at: '2026-01-01' };
    mockFrom.mockReturnValue(buildChain({ data: [challenge], error: null }));
    const { fetchActiveChallenge } = await import('./clubChallenges');
    const result = await fetchActiveChallenge('club1');
    expect(result).toEqual(challenge);
    expect(mockFrom).toHaveBeenCalledWith('club_challenges');
  });

  it('returns null when no active challenge', async () => {
    mockFrom.mockReturnValue(buildChain({ data: [], error: null }));
    const { fetchActiveChallenge } = await import('./clubChallenges');
    const result = await fetchActiveChallenge('club1');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error('DB error') }));
    const { fetchActiveChallenge } = await import('./clubChallenges');
    const result = await fetchActiveChallenge('club1');
    expect(result).toBeNull();
  });
});

describe('fetchChallengeProgress', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calculates total ml and unique members', async () => {
    mockFrom.mockReturnValue(buildChain({
      data: [
        { amount: 500, user_id: 'u1' },
        { amount: 300, user_id: 'u2' },
        { amount: 200, user_id: 'u1' },
      ],
      error: null,
    }));
    const { fetchChallengeProgress } = await import('./clubChallenges');
    const result = await fetchChallengeProgress('club1', '2026-01-01', '2026-02-01');
    expect(result.total_ml).toBe(1000);
    expect(result.member_count).toBe(2);
  });

  it('returns zeros when no data', async () => {
    mockFrom.mockReturnValue(buildChain({ data: [], error: null }));
    const { fetchChallengeProgress } = await import('./clubChallenges');
    const result = await fetchChallengeProgress('club1', '2026-01-01', '2026-02-01');
    expect(result.total_ml).toBe(0);
    expect(result.member_count).toBe(0);
  });

  it('returns zeros on error', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error('fail') }));
    const { fetchChallengeProgress } = await import('./clubChallenges');
    const result = await fetchChallengeProgress('club1', '2026-01-01', '2026-02-01');
    expect(result.total_ml).toBe(0);
    expect(result.member_count).toBe(0);
  });

  it('skips null user_ids in member count', async () => {
    mockFrom.mockReturnValue(buildChain({
      data: [
        { amount: 100, user_id: 'u1' },
        { amount: 200, user_id: null },
      ],
      error: null,
    }));
    const { fetchChallengeProgress } = await import('./clubChallenges');
    const result = await fetchChallengeProgress('club1', '2026-01-01', '2026-02-01');
    expect(result.total_ml).toBe(300);
    expect(result.member_count).toBe(1);
  });
});

describe('createChallenge', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('inserts and returns created challenge', async () => {
    const expected = { id: 'c2', club_id: 'club1', created_by: 'u1', title: 'Test', target_ml: 5000, start_date: expect.any(String), end_date: expect.any(String), created_at: null };
    mockFrom.mockReturnValue(buildChain({ data: expected, error: null }));
    const { createChallenge } = await import('./clubChallenges');
    const result = await createChallenge({ clubId: 'club1', userId: 'u1', title: 'Test', targetMl: 5000, durationDays: 7 });
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Test');
  });

  it('returns null on insert error', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error('insert fail') }));
    const { createChallenge } = await import('./clubChallenges');
    const result = await createChallenge({ clubId: 'club1', userId: 'u1', title: 'Test', targetMl: 5000, durationDays: 7 });
    expect(result).toBeNull();
  });
});
