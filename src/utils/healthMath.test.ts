import { describe, it, expect } from 'vitest';
import {
  calculateWaterGoal,
  calculateWP,
  calculateProgress,
  formatVolume,
  getStreakTier,
  getNextStreakTier,
  generateEveningSummary,
  STREAK_TIERS,
} from '@/utils/healthMath';

describe('calculateWaterGoal', () => {
  it('returns weight * 35 for valid weight', () => {
    expect(calculateWaterGoal(60)).toBe(2100);
    expect(calculateWaterGoal(80)).toBe(2800);
  });

  it('returns 2000 default for 0 or falsy weight', () => {
    expect(calculateWaterGoal(0)).toBe(2000);
  });
});

describe('calculateWP', () => {
  it('gives base points for partial intake', () => {
    const wp = calculateWP(1000, 2000, 0);
    expect(wp).toBeGreaterThan(0);
    expect(wp).toBeLessThan(100);
  });

  it('gives 50+ base points when goal reached', () => {
    const wp = calculateWP(2000, 2000, 0);
    expect(wp).toBeGreaterThanOrEqual(50);
  });

  it('adds pacing bonus for logCount >= 3', () => {
    const withBonus = calculateWP(2000, 2000, 0, { logCount: 5 });
    const without = calculateWP(2000, 2000, 0, { logCount: 1 });
    expect(withBonus).toBeGreaterThan(without);
  });

  it('caps pacing bonus at 30', () => {
    const wp = calculateWP(2000, 2000, 0, { logCount: 20 });
    expect(wp).toBeGreaterThanOrEqual(50);
  });

  it('adds weather bonus for hot temp when pct >= 60', () => {
    const wp = calculateWP(2000, 2000, 0, { currentTempC: 35 });
    expect(wp).toBeGreaterThanOrEqual(65);
  });

  it('adds weather bonus for cold temp when pct >= 60', () => {
    const wp = calculateWP(2000, 2000, 0, { currentTempC: 10 });
    expect(wp).toBeGreaterThanOrEqual(60);
  });

  it('adds exercise bonus when exercise >= 30min and pct >= 80', () => {
    const wp = calculateWP(2000, 2000, 0, { exerciseMinutes: 30 });
    expect(wp).toBeGreaterThanOrEqual(70);
  });

  it('adds fasting bonus when pct >= 80', () => {
    const wp = calculateWP(2000, 2000, 0, { isFasting: true });
    expect(wp).toBeGreaterThanOrEqual(65);
  });

  it('adds social post bonus capped at 30', () => {
    const wp = calculateWP(2000, 2000, 0, { socialPosts: 5 });
    expect(wp).toBeGreaterThanOrEqual(50);
  });

  it('adds social like bonus capped at 20', () => {
    const wp = calculateWP(2000, 2000, 0, { socialLikes: 15 });
    expect(wp).toBeGreaterThanOrEqual(50);
  });

  it('applies streak multiplier', () => {
    const withStreak = calculateWP(2000, 2000, 30);
    const without = calculateWP(2000, 2000, 0);
    expect(withStreak).toBeGreaterThan(without);
  });

  it('caps streak multiplier at 2.5x (streak 30+)', () => {
    const wp1 = calculateWP(2000, 2000, 30);
    const wp2 = calculateWP(2000, 2000, 100);
    expect(wp2).toBeLessThanOrEqual(wp1 + 5);
  });
});

describe('calculateProgress', () => {
  it('returns 0 for 0 goal', () => {
    expect(calculateProgress(100, 0)).toBe(0);
  });

  it('returns correct percentage', () => {
    expect(calculateProgress(500, 2000)).toBe(25);
  });

  it('caps at 100', () => {
    expect(calculateProgress(3000, 2000)).toBe(100);
  });

  it('returns 0 for 0 current', () => {
    expect(calculateProgress(0, 2000)).toBe(0);
  });
});

describe('formatVolume', () => {
  it('formats ml when under 1000', () => {
    expect(formatVolume(500)).toBe('500ml');
  });

  it('formats L when 1000 or more', () => {
    expect(formatVolume(1500)).toBe('1.5L');
    expect(formatVolume(2000)).toBe('2.0L');
  });

  it('handles 0', () => {
    expect(formatVolume(0)).toBe('0ml');
  });
});

describe('STREAK_TIERS', () => {
  it('has 5 tiers', () => {
    expect(STREAK_TIERS).toHaveLength(5);
  });

  it('starts with Giọt at streak 0', () => {
    expect(STREAK_TIERS[0].name).toBe('Giọt');
    expect(STREAK_TIERS[0].minStreak).toBe(0);
  });

  it('ends with Đại Dương at streak 60+', () => {
    const last = STREAK_TIERS[STREAK_TIERS.length - 1];
    expect(last.name).toBe('Đại Dương');
    expect(last.maxStreak).toBeNull();
  });

  it('has increasing xpMultiplier', () => {
    for (let i = 1; i < STREAK_TIERS.length; i++) {
      expect(STREAK_TIERS[i].xpMultiplier).toBeGreaterThan(STREAK_TIERS[i - 1].xpMultiplier);
    }
  });
});

describe('getStreakTier', () => {
  it('returns Giọt for streak 0', () => {
    expect(getStreakTier(0).name).toBe('Giọt');
  });

  it('returns Suối for streak 7', () => {
    expect(getStreakTier(7).name).toBe('Suối');
  });

  it('returns Sông for streak 14', () => {
    expect(getStreakTier(14).name).toBe('Sông');
  });

  it('returns Biển for streak 30', () => {
    expect(getStreakTier(30).name).toBe('Biển');
  });

  it('returns Đại Dương for streak 60', () => {
    expect(getStreakTier(60).name).toBe('Đại Dương');
  });

  it('returns Đại Dương for very long streak', () => {
    expect(getStreakTier(365).name).toBe('Đại Dương');
  });
});

describe('getNextStreakTier', () => {
  it('returns Suối for streak 0', () => {
    expect(getNextStreakTier(0)?.name).toBe('Suối');
  });

  it('returns Sông for streak 7', () => {
    expect(getNextStreakTier(7)?.name).toBe('Sông');
  });

  it('returns null when at max tier', () => {
    expect(getNextStreakTier(60)).toBeNull();
    expect(getNextStreakTier(100)).toBeNull();
  });
});

describe('generateEveningSummary', () => {
  it('returns goal-reached summary when isGoalReached', () => {
    const s = generateEveningSummary({ waterIntake: 2000, waterGoal: 2000, streak: 5, isGoalReached: true });
    expect(s.emoji).toBe('🎯');
    expect(s.title).toContain('Mục tiêu');
  });

  it('returns fire summary for streak >= 7 when goal reached', () => {
    const s = generateEveningSummary({ waterIntake: 2000, waterGoal: 2000, streak: 7, isGoalReached: true });
    expect(s.emoji).toBe('🔥');
    expect(s.title).toBe('Xuất sắc!');
  });

  it('returns crown summary for streak >= 30 when goal reached', () => {
    const s = generateEveningSummary({ waterIntake: 2000, waterGoal: 2000, streak: 30, isGoalReached: true });
    expect(s.emoji).toBe('👑');
    expect(s.title).toBe('Ngày hoàn hảo!');
  });

  it('returns near-goal summary when pct >= 70', () => {
    const s = generateEveningSummary({ waterIntake: 1500, waterGoal: 2000, streak: 0, isGoalReached: false });
    expect(s.emoji).toBe('💪');
    expect(s.title).toBe('Gần lắm rồi!');
  });

  it('returns low progress summary when pct < 70', () => {
    const s = generateEveningSummary({ waterIntake: 500, waterGoal: 2000, streak: 0, isGoalReached: false });
    expect(s.emoji).toBe('🌱');
    expect(s.title).toBe('Ngày mai sẽ tốt hơn!');
  });

  it('handles 0 goal gracefully', () => {
    const s = generateEveningSummary({ waterIntake: 0, waterGoal: 0, streak: 0, isGoalReached: false });
    expect(s.title).toBeTruthy();
  });
});
