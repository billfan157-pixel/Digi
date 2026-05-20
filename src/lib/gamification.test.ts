import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logWaterAndUpdateStreakSecurely', () => {
  it('returns mock data for short/fake user IDs', async () => {
    const { logWaterAndUpdateStreakSecurely } = await import('./gamification');
    const result = await logWaterAndUpdateStreakSecurely('short-id', 250);
    expect(result).toEqual({
      success: true,
      log_id: expect.stringMatching(/^mock-log-/),
      current_streak: 1,
      wp: 10,
      streak_freezes: 0,
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('calls RPC for valid user IDs', async () => {
    mockRpc.mockResolvedValue({ data: { current_streak: 5, wp: 20 }, error: null });
    const { logWaterAndUpdateStreakSecurely } = await import('./gamification');
    const result = await logWaterAndUpdateStreakSecurely('a'.repeat(30), 500, 'Trà', { tempC: 25, exerciseMins: 30 });
    expect(mockRpc).toHaveBeenCalledWith('log_water_and_update_streak', {
      p_user_id: 'a'.repeat(30),
      p_ml_added: 500,
      p_name: 'Trà',
      p_temp_c: 25,
      p_exercise_mins: 30,
      p_is_fasting: false,
    });
    expect(result).toEqual({ current_streak: 5, wp: 20 });
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });
    const { logWaterAndUpdateStreakSecurely } = await import('./gamification');
    await expect(logWaterAndUpdateStreakSecurely('a'.repeat(30), 100)).rejects.toThrow('RPC failed');
  });
});

describe('fetchStreakFreezes', () => {
  it('returns streak_freeze count from profile', async () => {
    const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), single: vi.fn(() => Promise.resolve({ data: { streak_freezes: 3 }, error: null })) };
    mockFrom.mockReturnValue(chain);
    const { fetchStreakFreezes } = await import('./gamification');
    const result = await fetchStreakFreezes('user-1');
    expect(result).toBe(3);
  });

  it('returns 0 when data is null', async () => {
    const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), single: vi.fn(() => Promise.resolve({ data: null, error: null })) };
    mockFrom.mockReturnValue(chain);
    const { fetchStreakFreezes } = await import('./gamification');
    const result = await fetchStreakFreezes('user-1');
    expect(result).toBe(0);
  });

  it('throws on error', async () => {
    const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), single: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })) };
    mockFrom.mockReturnValue(chain);
    const { fetchStreakFreezes } = await import('./gamification');
    await expect(fetchStreakFreezes('user-1')).rejects.toThrow('DB error');
  });
});

describe('applyStreakFreeze', () => {
  it('calls use_streak_freeze RPC and returns result', async () => {
    mockRpc.mockResolvedValue({ data: { remaining_freezes: 2 }, error: null });
    const { applyStreakFreeze } = await import('./gamification');
    const result = await applyStreakFreeze('user-1');
    expect(mockRpc).toHaveBeenCalledWith('use_streak_freeze', { p_user_id: 'user-1' });
    expect(result).toEqual({ remaining_freezes: 2 });
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('freeze not available') });
    const { applyStreakFreeze } = await import('./gamification');
    await expect(applyStreakFreeze('user-1')).rejects.toThrow('freeze not available');
  });
});
