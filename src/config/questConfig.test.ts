import { describe, it, expect } from 'vitest';
import {
  expRequiredForLevel,
  expGainedForWater,
  totalExpForLevel,
  levelFromExp,
  rankFromExp,
  levelProgress,
  conditionLabel,
  rankFromExpWithProgress,
  type Quest,
} from './questConfig';

describe('expRequiredForLevel', () => {
  it('uses k=1.1 for levels 1-10', () => {
    const exp1 = expRequiredForLevel(1);
    const exp10 = expRequiredForLevel(10);
    expect(exp1).toBe(100);
    expect(exp10).toBe(1260);
  });

  it('uses k=1.3 for levels 11-20', () => {
    const exp11 = expRequiredForLevel(11);
    const exp20 = expRequiredForLevel(20);
    expect(exp11).toBeGreaterThan(expRequiredForLevel(10));
    expect(exp20).toBe(4910);
  });

  it('uses k=1.6 for levels 21-40', () => {
    const exp21 = expRequiredForLevel(21);
    const exp40 = expRequiredForLevel(40);
    expect(exp21).toBeGreaterThan(expRequiredForLevel(20));
    expect(exp40).toBe(36580);
  });

  it('uses k=2.0 for levels 41+', () => {
    const exp41 = expRequiredForLevel(41);
    const exp50 = expRequiredForLevel(50);
    expect(exp41).toBeGreaterThan(expRequiredForLevel(40));
    expect(exp50).toBe(250000);
  });

  it('returns rounded to nearest 10', () => {
    const result = expRequiredForLevel(1);
    expect(result % 10).toBe(0);
  });
});

describe('expGainedForWater', () => {
  it('returns 10% for level <= 10', () => {
    expect(expGainedForWater(250, 1)).toBe(25);
    expect(expGainedForWater(500, 10)).toBe(50);
  });

  it('returns 12% for level 11-20', () => {
    expect(expGainedForWater(250, 11)).toBe(30);
    expect(expGainedForWater(500, 20)).toBe(60);
  });

  it('returns 15% for level 21-30', () => {
    expect(expGainedForWater(250, 21)).toBe(37);
    expect(expGainedForWater(500, 30)).toBe(75);
  });

  it('returns 20% for level > 30', () => {
    expect(expGainedForWater(250, 31)).toBe(50);
    expect(expGainedForWater(500, 50)).toBe(100);
  });

  it('handles 0ml', () => {
    expect(expGainedForWater(0, 1)).toBe(0);
    expect(expGainedForWater(0, 50)).toBe(0);
  });
});

describe('totalExpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(totalExpForLevel(1)).toBe(0);
  });

  it('returns cumulative EXP for level 5', () => {
    const expected = expRequiredForLevel(1) + expRequiredForLevel(2) + expRequiredForLevel(3) + expRequiredForLevel(4);
    expect(totalExpForLevel(5)).toBe(expected);
  });

  it('increases monotonically', () => {
    for (let i = 2; i <= 20; i++) {
      expect(totalExpForLevel(i)).toBeGreaterThan(totalExpForLevel(i - 1));
    }
  });
});

describe('levelFromExp', () => {
  it('starts at level 1 with 0 EXP', () => {
    expect(levelFromExp(0)).toBe(1);
  });

  it('advances level when reaching next threshold', () => {
    const expForLevel2 = expRequiredForLevel(1);
    expect(levelFromExp(expForLevel2)).toBe(2);
    expect(levelFromExp(expForLevel2 - 1)).toBe(1);
  });

  it('returns higher level for more EXP', () => {
    const highExp = totalExpForLevel(30);
    expect(levelFromExp(highExp)).toBeGreaterThanOrEqual(30);
  });

  it('returns at most 100', () => {
    expect(levelFromExp(999999999)).toBe(100);
  });
});

describe('rankFromExp', () => {
  it('returns tier 1 for 0 EXP', () => {
    expect(rankFromExp(0)).toBe(1);
  });

  it('returns tier 2 for border of rank 2', () => {
    expect(rankFromExp(2499)).toBe(1);
    expect(rankFromExp(2500)).toBe(2);
  });

  it('returns tier 7 for max EXP', () => {
    expect(rankFromExp(300000)).toBe(7);
  });
});

describe('levelProgress', () => {
  it('returns 0 at start of a level', () => {
    const startExp = totalExpForLevel(5);
    expect(levelProgress(startExp)).toBeCloseTo(0, 1);
  });

  it('returns > 0 when partially through a level', () => {
    const midExp = totalExpForLevel(5) + expRequiredForLevel(5) / 2;
    const progress = levelProgress(midExp);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });

  it('returns 1 at max level', () => {
    expect(levelProgress(999999999)).toBe(1);
  });
});

describe('conditionLabel', () => {
  const base: Quest = {
    id: '', type: 'daily', title: '', description: '',
    condition_type: 'drink_today', condition_value: 2000,
    reward_exp: 0, reward_coins: 0, reward_badge_id: null,
    min_level: 1, rarity: 'common',
  };

  it('handles drink_today', () => {
    expect(conditionLabel({ ...base, condition_type: 'drink_today', condition_value: 2000 }))
      .toBe('Uống 2.000ml hôm nay');
  });

  it('handles drink_streak', () => {
    expect(conditionLabel({ ...base, condition_type: 'drink_streak', condition_value: 7 }))
      .toBe('Streak 7 ngày');
  });

  it('handles level condition', () => {
    expect(conditionLabel({ ...base, condition_type: 'level', condition_value: 5 }))
      .toBe('Đạt level 5');
  });

  it('handles goal_percent', () => {
    expect(conditionLabel({ ...base, condition_type: 'goal_percent', condition_value: 80 }))
      .toBe('Đạt 80% mục tiêu');
  });

  it('handles log_count', () => {
    expect(conditionLabel({ ...base, condition_type: 'log_count', condition_value: 3 }))
      .toBe('Ghi nhận 3 lần');
  });

  it('handles drink_total (converts to liters)', () => {
    expect(conditionLabel({ ...base, condition_type: 'drink_total', condition_value: 10000 }))
      .toBe('Tổng 10L tích lũy');
  });

  it('handles drink_weekly_days', () => {
    expect(conditionLabel({ ...base, condition_type: 'drink_weekly_days', condition_value: 5 }))
      .toBe('5/7 ngày trong tuần');
  });

  it('returns empty string for unknown type', () => {
    expect(conditionLabel({ ...base, condition_type: 'level' as never, condition_value: 0 }))
      .toBe('Đạt level 0');
  });
});

describe('rankFromExpWithProgress', () => {
  it('returns tier 1 at 0 EXP', () => {
    const result = rankFromExpWithProgress(0);
    expect(result.current.tier).toBe(1);
    expect(result.next).not.toBeNull();
    expect(result.next!.tier).toBe(2);
    expect(result.progress).toBe(0);
  });

  it('returns progress between 0 and 100', () => {
    const result = rankFromExpWithProgress(1000);
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(100);
  });

  it('returns 0% progress at rank boundary', () => {
    const result = rankFromExpWithProgress(2500);
    expect(result.progress).toBe(0);
  });

  it('returns null next at max rank', () => {
    const result = rankFromExpWithProgress(300000);
    expect(result.current.tier).toBe(7);
    expect(result.next).toBeNull();
    expect(result.progress).toBe(100);
  });
});
