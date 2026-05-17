import { describe, it, expect } from 'vitest';
import { claimQuestReward } from './questEngine';

// ── Pure logic tests (no Supabase needed) ──

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
    const alreadyReached: number[] = [];

    const newMilestones = milestones
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.at <= newValue && !alreadyReached.includes(m.idx));

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
    const targetValue = 1000;
    const newValue = 1500;
    const isCompleted = targetValue != null && newValue >= targetValue;
    expect(isCompleted).toBe(true);
  });

  it('detects not completed when below target', () => {
    const targetValue = 1000;
    const newValue = 500;
    const isCompleted = targetValue != null && newValue >= targetValue;
    expect(isCompleted).toBe(false);
  });

  it('null target_value means no completion check', () => {
    const targetValue = null;
    const newValue = 500;
    const isCompleted = targetValue != null && newValue >= targetValue;
    expect(isCompleted).toBe(false);
  });
});
