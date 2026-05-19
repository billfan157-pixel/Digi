import { describe, it, expect, vi } from 'vitest';
import { claimQuestReward, claimChallengeReward } from './questEngine';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
        lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
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
  it('returns null when RPC returns error', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC failed') });

    const result = await claimQuestReward('valid-user', 'valid-quest');
    expect(result).toBeNull();
  });

  it('returns data on success', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true, leveled_up: false }, error: null });

    const result = await claimQuestReward('valid-user', 'valid-quest');
    expect(result).toEqual({ success: true, leveled_up: false });
  });

  it('dispatches refresh event after claim', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null });

    await claimQuestReward('valid-user', 'valid-quest');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hydrationEvent' }),
    );

    dispatchSpy.mockRestore();
  });
});

describe('claimChallengeReward', () => {
  it('returns null when RPC returns error', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('fail') });

    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toBeNull();
  });

  it('returns success on RPC ok', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

    const result = await claimChallengeReward('uid', 'cid');
    expect(result).toEqual({ success: true });
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
