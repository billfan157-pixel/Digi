import { describe, it, expect } from 'vitest';
import { getKFactor, calculateExpectedScore, calculateWpDelta, calculateStakeReward } from './arenaEngine';

describe('getKFactor', () => {
  it('returns 40 for new players (<30 matches)', () => {
    expect(getKFactor(0)).toBe(40);
    expect(getKFactor(29)).toBe(40);
  });

  it('returns 20 for intermediate players (30-99 matches)', () => {
    expect(getKFactor(30)).toBe(20);
    expect(getKFactor(99)).toBe(20);
  });

  it('returns 10 for pro players (>=100 matches)', () => {
    expect(getKFactor(100)).toBe(10);
    expect(getKFactor(500)).toBe(10);
  });
});

describe('calculateExpectedScore', () => {
  it('returns 0.5 for equal WP', () => {
    expect(calculateExpectedScore(5000, 5000)).toBeCloseTo(0.5, 3);
  });

  it('favours higher WP player', () => {
    expect(calculateExpectedScore(7000, 5000)).toBeGreaterThan(0.5);
    expect(calculateExpectedScore(5000, 7000)).toBeLessThan(0.5);
  });

  it('approaches 1 for huge WP gaps', () => {
    expect(calculateExpectedScore(20000, 2000)).toBeCloseTo(1, 2);
  });

  it('2000 WP gap gives ~0.91 for stronger player', () => {
    const score = calculateExpectedScore(7000, 5000);
    expect(score).toBeCloseTo(0.909, 2);
  });
});

describe('calculateWpDelta', () => {
  it('winner gains WP, loser loses WP (zero-sum)', () => {
    const { deltaA, deltaB } = calculateWpDelta(5000, 5000, 'win', 50, 50);
    expect(deltaA).toBeGreaterThan(0);
    expect(deltaB).toBeLessThan(0);
    expect(deltaA + deltaB).toBeCloseTo(0, 0);
  });

  it('equal WP gives delta = K * 0.5', () => {
    const { deltaA } = calculateWpDelta(5000, 5000, 'win', 100, 100);
    expect(deltaA).toBe(5);
  });

  it('draw gives zero-sum small change for unequal WP', () => {
    const { deltaA, deltaB } = calculateWpDelta(5000, 7000, 'draw', 50, 50);
    expect(deltaA).toBeGreaterThan(0);
    expect(deltaB).toBeLessThan(0);
    expect(Math.abs(deltaA + deltaB)).toBeLessThanOrEqual(1);
  });

  it('huge upset gives massive gain to underdog', () => {
    const { deltaA, deltaB } = calculateWpDelta(2000, 12000, 'win', 5, 5);
    expect(deltaA).toBeGreaterThan(30);
    expect(deltaB).toBeLessThan(-30);
  });

  it('new player (<30) gets larger swings', () => {
    const { deltaA: newPlayer } = calculateWpDelta(5000, 5000, 'win', 5, 100);
    const { deltaA: oldPlayer } = calculateWpDelta(5000, 5000, 'win', 100, 100);
    expect(Math.abs(newPlayer)).toBeGreaterThan(Math.abs(oldPlayer));
  });

  it('deltaA + deltaB ≈ 0 for all outcomes', () => {
    const results: Array<'win' | 'loss' | 'draw'> = ['win', 'loss', 'draw'];
    for (const result of results) {
      const { deltaA, deltaB } = calculateWpDelta(5000, 6000, result, 50, 50);
      expect(Math.abs(deltaA + deltaB)).toBeLessThanOrEqual(1);
    }
  });
});

describe('calculateStakeReward', () => {
  it('winner gets 90% of stake, loser loses full stake', () => {
    const r = calculateStakeReward(100, 'win', 0);
    expect(r.winnerReward).toBe(90);
    expect(r.loserDeduction).toBe(100);
    expect(r.refund).toBe(0);
  });

  it('draw refunds both', () => {
    const r = calculateStakeReward(100, 'draw', 0);
    expect(r.refund).toBe(100);
    expect(r.winnerReward).toBe(0);
  });

  it('loss gives no reward and no refund', () => {
    const r = calculateStakeReward(100, 'loss', 0);
    expect(r.winnerReward).toBe(0);
    expect(r.refund).toBe(0);
  });

  it('streak >= 3 adds 10% bonus for winner', () => {
    const r = calculateStakeReward(100, 'win', 2);
    expect(r.winnerReward).toBe(100);
  });

  it('streak bonus only applies to winner', () => {
    const r = calculateStakeReward(100, 'loss', 2);
    expect(r.winnerReward).toBe(0);
    expect(r.refund).toBe(0);
  });
});
