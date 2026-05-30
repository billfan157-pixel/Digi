import { describe, it, expect } from 'vitest';
import { getKFactor, calculateExpectedScore, calculateEloDelta, calculateStakeReward } from './arenaEngine';

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
  it('returns 0.5 for equal ELO', () => {
    expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5, 3);
  });

  it('favours higher ELO player', () => {
    expect(calculateExpectedScore(1400, 1200)).toBeGreaterThan(0.5);
    expect(calculateExpectedScore(1200, 1400)).toBeLessThan(0.5);
  });

  it('approaches 1 for huge ELO gaps', () => {
    expect(calculateExpectedScore(2000, 800)).toBeCloseTo(1, 2);
  });
});

describe('calculateEloDelta', () => {
  it('increases winner ELO and decreases loser ELO', () => {
    const { deltaA, deltaB } = calculateEloDelta(1200, 1200, 'win', 50, 50);
    expect(deltaA).toBeGreaterThan(0);
    expect(deltaB).toBeLessThan(0);
  });

  it('small delta for equal ELO with low K-factor', () => {
    const { deltaA } = calculateEloDelta(1200, 1200, 'win', 100, 100);
    expect(deltaA).toBe(5); // K=10 * (1 - 0.5) = 5
  });

  it('draw gives small change for unequal ELO', () => {
    const { deltaA, deltaB } = calculateEloDelta(1200, 1400, 'draw', 50, 50);
    expect(deltaA).toBeGreaterThan(0); // lower ELO gains from draw
    expect(deltaB).toBeLessThan(0);    // higher ELO loses from draw
  });

  it('huge upset gives massive gain to underdog (new player K=40)', () => {
    const { deltaA, deltaB } = calculateEloDelta(800, 1800, 'win', 5, 5);
    expect(deltaA).toBeGreaterThan(30);
    expect(deltaB).toBeLessThan(-30);
  });

  it('new player (<30) gets larger swings', () => {
    const { deltaA: newPlayer } = calculateEloDelta(1200, 1200, 'win', 5, 100);
    const { deltaA: oldPlayer } = calculateEloDelta(1200, 1200, 'win', 100, 100);
    expect(Math.abs(newPlayer)).toBeGreaterThan(Math.abs(oldPlayer));
  });
});

describe('calculateStakeReward', () => {
  it('winner gets 90% of stake, loser loses full stake', () => {
    const result = calculateStakeReward(100, 'win', 0);
    expect(result.winnerReward).toBe(90);
    expect(result.loserDeduction).toBe(100);
    expect(result.refund).toBe(0);
  });

  it('draw refunds both', () => {
    const result = calculateStakeReward(100, 'draw', 0);
    expect(result.refund).toBe(100);
    expect(result.winnerReward).toBe(0);
  });

  it('loss gives no reward and no refund', () => {
    const result = calculateStakeReward(100, 'loss', 0);
    expect(result.winnerReward).toBe(0);
    expect(result.refund).toBe(0);
  });

  it('streak >= 3 adds 10% bonus for winner', () => {
    const result = calculateStakeReward(100, 'win', 2); // current streak 2 -> after win = 3
    expect(result.winnerReward).toBe(100); // 90 + 10
  });

  it('streak bonus only applies to winner', () => {
    const result = calculateStakeReward(100, 'loss', 2);
    expect(result.winnerReward).toBe(0);
    expect(result.refund).toBe(0);
  });
});
