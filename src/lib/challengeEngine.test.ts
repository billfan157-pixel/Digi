import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runChallengeEngine, claimChallengeReward } from './challengeEngine';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/i18n', () => ({
  default: { t: (key: string) => key },
}));

describe('claimChallengeReward', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it('returns null when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } } as never);

    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toBeNull();
  });

  it('returns success on RPC ok', async () => {
    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toEqual({ success: true });
  });
});

describe('runChallengeEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeThenableChain(data: unknown) {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.gte = vi.fn(() => chain);
    chain.lte = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.update = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    
    chain.then = (resolve: (value: unknown) => unknown) => resolve({ data, error: null });

    return chain;
  }

  it('returns early when userId is empty', async () => {
    await expect(runChallengeEngine({
      userId: '', waterToday: 500, waterGoal: 2000, streak: 0, totalWater: 500,
      logCountToday: 1, weeklyDays: 1, level: 1,
    })).resolves.not.toThrow();
  });

  it('processes milestone challenge successfully', async () => {
    const mockUserChallenge = {
      id: 'uc-1',
      challenge_id: 'c-1',
      status: 'joined',
      current_value: 100,
      milestones_reached: [],
      challenge: {
        id: 'c-1',
        type: 'milestone',
        slug: 'ms-challenge',
        title: 'Thách thức cột mốc',
        target_value: 1000,
        milestones: [
          { at: 500, exp: 50, coins: 10, label: 'Mốc 500ml', badge_id: 'badge-1' }
        ],
        reward_exp: 100,
        reward_coins: 50,
      }
    };

    const userChallengeChain = makeThenableChain([mockUserChallenge]);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_challenges') return userChallengeChain;
      return makeThenableChain(null);
    });

    const ctx = {
      userId: 'user-1',
      waterToday: 600,
      waterGoal: 2000,
      streak: 3,
      totalWater: 600, // newValue > 500, milestone reached
      logCountToday: 1,
      weeklyDays: 3,
      level: 1,
    };

    await runChallengeEngine(ctx);

    // Verify it selected user_challenges
    expect(mockFrom).toHaveBeenCalledWith('user_challenges');
    // Verify it updated user_challenges with new current_value and milestone reached
    expect(userChallengeChain.update).toHaveBeenCalledWith(expect.objectContaining({
      current_value: 600,
      milestones_reached: [0],
      status: 'joined'
    }));
  });

  it('processes time_limited challenge successfully', async () => {
    const mockUserChallenge = {
      id: 'uc-2',
      challenge_id: 'c-2',
      status: 'joined',
      joined_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      days_completed: 0,
      days_failed: 0,
      challenge: {
        id: 'c-2',
        type: 'time_limited',
        slug: 'tl-challenge',
        title: 'Thách thức thời gian',
        duration_days: 2,
        target_percent: 80,
        grace_days: 1,
      }
    };

    const mockWaterLogs = [
      { day: new Date().toLocaleDateString('en-CA'), amount: 1800 }
    ];

    const challengeChain = makeThenableChain([mockUserChallenge]);
    const logsChain = makeThenableChain(mockWaterLogs);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_challenges') return challengeChain;
      if (table === 'water_logs') return logsChain;
      return makeThenableChain(null);
    });

    const ctx = {
      userId: 'user-2',
      waterToday: 1800,
      waterGoal: 2000, // 1800/2000 = 90% >= 80% (success)
      streak: 3,
      totalWater: 5000,
      logCountToday: 1,
      weeklyDays: 3,
      level: 1,
    };

    await runChallengeEngine(ctx);

    expect(mockFrom).toHaveBeenCalledWith('user_challenges');
    expect(mockFrom).toHaveBeenCalledWith('water_logs');
    expect(challengeChain.update).toHaveBeenCalled();
  });
});
