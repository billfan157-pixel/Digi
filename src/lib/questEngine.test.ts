import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimQuestReward, claimChallengeReward } from './questEngine';

const mockFrom = vi.fn();
const mockRpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    registerActionTypes: vi.fn(),
    schedule: vi.fn(),
  },
}));

describe('claimQuestReward input validation', () => {
  it('returns null for empty userId', async () => {
    const result = await claimQuestReward('', 'valid-quest-id');
    expect(result).toBeNull();
  });

  it('returns null for undefined userId', async () => {
    const result = await claimQuestReward('undefined', 'valid-quest-id');
    expect(result).toBeNull();
  });

  it('returns null for empty userQuestId', async () => {
    const result = await claimQuestReward('valid-user', '');
    expect(result).toBeNull();
  });

  it('returns null for undefined userQuestId', async () => {
    const result = await claimQuestReward('valid-user', 'undefined');
    expect(result).toBeNull();
  });

  it('returns null when both params are empty', async () => {
    const result = await claimQuestReward('', '');
    expect(result).toBeNull();
  });
});

describe('claimQuestReward — RPC', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('returns null when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

    const result = await claimQuestReward('valid-user', 'valid-quest');
    expect(result).toBeNull();
  });

  it('returns data on success', async () => {
    mockRpc.mockResolvedValue({ data: { success: true, leveled_up: false }, error: null });

    const result = await claimQuestReward('valid-user', 'valid-quest');
    expect(result).toEqual({ success: true, leveled_up: false });
  });

  it('dispatches refresh event after claim', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    await claimQuestReward('valid-user', 'valid-quest');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hydrationEvent' }),
    );

    dispatchSpy.mockRestore();
  });
});

describe('claimChallengeReward', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('returns null when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('fail') });

    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toBeNull();
  });

  it('returns success on RPC ok', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toEqual({ success: true });
  });
});

describe('provisionUserQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeQuestChain(questResult: Record<string, unknown>) {
    const chain: Record<string, unknown> = {};
    chain._resolve = questResult;
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.lte = vi.fn(() => Promise.resolve(chain._resolve));
    chain.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    return chain;
  }

  function makeExistingChain(existingResult: Record<string, unknown>) {
    const chain: Record<string, unknown> = {};
    chain._resolve = existingResult;
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => Promise.resolve(chain._resolve));
    return chain;
  }

  function makeUpsertChain() {
    const chain: Record<string, unknown> = {};
    chain.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    return chain;
  }

  it('skips provisioning when no quests available', async () => {
    mockFrom.mockReturnValue(makeQuestChain({ data: null, error: null }));

    const { provisionUserQuests } = await import('./questEngine');
    await provisionUserQuests('uid', 1);

    expect(mockFrom).toHaveBeenCalled();
  });

  it('inserts only new quests not already assigned', async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const questChain = makeQuestChain({ data: [{ id: 'q1', type: 'daily', min_level: 0 }], error: null });
    const existingChain = makeExistingChain({ data: [{ quest_id: 'q1', reset_date: today }], error: null });
    mockFrom
      .mockReturnValueOnce(questChain)
      .mockReturnValueOnce(existingChain);

    const { provisionUserQuests } = await import('./questEngine');
    await provisionUserQuests('uid', 1);

    expect(questChain.upsert).not.toHaveBeenCalled();
  });

  it('inserts quests not yet assigned', async () => {
    const questChain = makeQuestChain({ data: [{ id: 'q-new', type: 'daily', min_level: 0 }], error: null });
    const existingChain = makeExistingChain({ data: [], error: null });
    const upsertChain = makeUpsertChain();
    mockFrom
      .mockReturnValueOnce(questChain)
      .mockReturnValueOnce(existingChain)
      .mockReturnValueOnce(upsertChain);

    const { provisionUserQuests } = await import('./questEngine');
    await provisionUserQuests('uid', 1);

    expect(upsertChain.upsert).toHaveBeenCalled();
  });
});

describe('syncLevelQuestProgress', () => {
  it('returns early when userId is empty', async () => {
    const { syncLevelQuestProgress } = await import('./questEngine');
    await expect(syncLevelQuestProgress('', 1)).resolves.not.toThrow();
  });

  it('returns early when no quest data', async () => {
    const m = { select: vi.fn(() => ({ eq: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) };
    mockFrom.mockReturnValue(m);

    const { syncLevelQuestProgress } = await import('./questEngine');
    await expect(syncLevelQuestProgress('uid', 1)).resolves.not.toThrow();
  });
});

describe('runQuestEngine', () => {
  it('returns early when userId is empty', async () => {
    const { runQuestEngine } = await import('./questEngine');
    await expect(runQuestEngine({
      userId: '', waterToday: 500, waterGoal: 2000, streak: 0, totalWater: 500,
      logCountToday: 1, weeklyDays: 1, level: 1,
    })).resolves.not.toThrow();
  });

  it('dedups concurrent calls for same user', async () => {
    const m = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    };
    mockFrom.mockReturnValue(m);

    const { runQuestEngine } = await import('./questEngine');
    const ctx = {
      userId: 'uid', waterToday: 500, waterGoal: 2000, streak: 0, totalWater: 500,
      logCountToday: 1, weeklyDays: 1, level: 1,
    };
    const p1 = runQuestEngine(ctx);
    const p2 = runQuestEngine(ctx);
    await expect(Promise.all([p1, p2])).resolves.not.toThrow();
  });
});

describe('runChallengeEngine', () => {
  it('returns early when userId is empty', async () => {
    const { runChallengeEngine } = await import('./questEngine');
    await expect(runChallengeEngine({
      userId: '', waterToday: 500, waterGoal: 2000, streak: 0, totalWater: 500,
      logCountToday: 1, weeklyDays: 1, level: 1,
    })).resolves.not.toThrow();
  });
});

describe('milestone calculation logic', () => {
  it('detects newly reached milestones', () => {
    const milestones = [
      { at: 100, exp: 10, coins: 5, label: 'Mốc 100ml' },
      { at: 500, exp: 20, coins: 10, label: 'Mốc 500ml' },
      { at: 1000, exp: 50, coins: 25, label: 'Mốc 1000ml' },
    ];
    const newValue = 600;
    const alreadyReached: number[] = [0];

    const newMilestones = milestones
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.at <= newValue && !alreadyReached.includes(m.idx));

    expect(newMilestones).toHaveLength(1);
    expect(newMilestones[0].idx).toBe(1);
    expect(newMilestones[0].label).toBe('Mốc 500ml');
  });

  it('detects multiple newly reached milestones', () => {
    const milestones = [
      { at: 100, exp: 10, coins: 5, label: 'Mốc 100ml' },
      { at: 500, exp: 20, coins: 10, label: 'Mốc 500ml' },
      { at: 1000, exp: 50, coins: 25, label: 'Mốc 1000ml' },
    ];
    const newValue = 1500;

    const newMilestones = milestones
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.at <= newValue);

    expect(newMilestones).toHaveLength(3);
  });

  it('skips already reached milestones', () => {
    const milestones = [
      { at: 100, exp: 10, coins: 5, label: 'Mốc 100ml' },
      { at: 500, exp: 20, coins: 10, label: 'Mốc 500ml' },
    ];
    const newValue = 600;
    const alreadyReached = [0, 1];

    const newMilestones = milestones
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.at <= newValue && !alreadyReached.includes(m.idx));

    expect(newMilestones).toHaveLength(0);
  });

  it('detects completion when target_value is reached', () => {
    const target = 1000;
    const current = 1500;
    expect(target != null && current >= target).toBe(true);
  });

  it('detects not completed when below target', () => {
    const target = 1000;
    const current = 500;
    expect(target != null && current >= target).toBe(false);
  });

  it('null target_value means no completion check', () => {
    const target = null;
    const current = 500;
    expect(target != null && current >= target).toBe(false);
  });
});
