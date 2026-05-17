import { describe, it, expect } from 'vitest';
import {
  normalizeQuestConditionType,
  resolveQuestProgress,
  type QuestLike,
  type QuestProgressContext,
} from './questProgress';

describe('normalizeQuestConditionType', () => {
  it('returns "drink_today" for condition_type containing "today"', () => {
    expect(normalizeQuestConditionType('drink_today')).toBe('drink_today');
    expect(normalizeQuestConditionType('drink today')).toBe('drink_today');
    expect(normalizeQuestConditionType('day', null)).toBe('drink_today');
  });

  it('returns "drink_weekly_days" for condition_type containing "week"', () => {
    expect(normalizeQuestConditionType('drink_weekly_days')).toBe('drink_weekly_days');
    expect(normalizeQuestConditionType('weekly')).toBe('drink_weekly_days');
  });

  it('returns "level" for title containing "level" or "cấp"', () => {
    expect(normalizeQuestConditionType(null, 'Đạt level 10')).toBe('level');
    expect(normalizeQuestConditionType('', 'Đạt cấp 5')).toBe('level');
    expect(normalizeQuestConditionType('level')).toBe('level');
  });

  it('returns "goal_percent" for condition_type containing "percent" or "goal"', () => {
    expect(normalizeQuestConditionType('goal_percent')).toBe('goal_percent');
    expect(normalizeQuestConditionType('percent')).toBe('goal_percent');
    expect(normalizeQuestConditionType('goal')).toBe('goal_percent');
  });

  it('returns "log_count" for condition_type containing "log" or "count"', () => {
    expect(normalizeQuestConditionType('log_count')).toBe('log_count');
    expect(normalizeQuestConditionType('log')).toBe('log_count');
  });

  it('returns "drink_streak" for condition_type containing "streak"', () => {
    expect(normalizeQuestConditionType('drink_streak')).toBe('drink_streak');
  });

  it('returns "drink_total" for condition_type containing "total" or "all"', () => {
    expect(normalizeQuestConditionType('drink_total')).toBe('drink_total');
    expect(normalizeQuestConditionType('total')).toBe('drink_total');
    expect(normalizeQuestConditionType('all')).toBe('drink_total');
  });

  it('returns raw type when no match found', () => {
    expect(normalizeQuestConditionType('custom_type')).toBe('custom_type');
    expect(normalizeQuestConditionType(undefined, undefined)).toBe('');
  });
});

describe('resolveQuestProgress', () => {
  const baseCtx: QuestProgressContext = {
    waterToday: 500,
    waterGoal: 2000,
    streak: 3,
    totalWater: 15000,
    logCountToday: 2,
    weeklyDays: 4,
    weeklyWater: 3500,
    weeklyLogCount: 10,
    level: 7,
  };

  it('returns progress 0 for empty target', () => {
    const result = resolveQuestProgress({ condition_type: 'level', condition_value: 0 }, baseCtx);
    expect(result.completed).toBe(false);
    expect(result.progress).toBe(0);
  });

  it('checks level quest: current level >= target', () => {
    const quest: QuestLike = { condition_type: 'level', condition_value: 5 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
    expect(result.current).toBe(7);
    expect(result.target).toBe(5);
  });

  it('checks level quest: current level < target', () => {
    const quest: QuestLike = { condition_type: 'level', condition_value: 10 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(false);
    expect(result.current).toBe(7);
    expect(result.target).toBe(10);
  });

  it('checks drink_today: waterToday >= target', () => {
    const quest: QuestLike = { condition_type: 'drink_today', condition_value: 500 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
    expect(result.current).toBe(500);
  });

  it('checks drink_today: waterToday < target', () => {
    const quest: QuestLike = { condition_type: 'drink_today', condition_value: 2000 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(false);
    expect(result.current).toBe(500);
    expect(result.target).toBe(2000);
  });

  it('checks drink_today for weekly quest: uses weeklyWater', () => {
    const quest: QuestLike = { type: 'weekly', condition_type: 'drink_today', condition_value: 3000 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.current).toBe(3500);
    expect(result.completed).toBe(true);
  });

  it('checks drink_weekly_days: days >= target', () => {
    const quest: QuestLike = { condition_type: 'drink_weekly_days', condition_value: 3 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
    expect(result.current).toBe(4);
  });

  it('checks goal_percent: correctly calculates 25% of goal', () => {
    const quest: QuestLike = { condition_type: 'goal_percent', condition_value: 25 };
    const result = resolveQuestProgress(quest, { waterToday: 500, waterGoal: 2000 });
    expect(result.current).toBe(25);
    expect(result.completed).toBe(true);
  });

  it('checks goal_percent: not completed when below target', () => {
    const quest: QuestLike = { condition_type: 'goal_percent', condition_value: 50 };
    const result = resolveQuestProgress(quest, { waterToday: 500, waterGoal: 2000 });
    expect(result.completed).toBe(false);
    expect(result.current).toBe(25);
  });

  it('checks log_count: logCountToday >= target', () => {
    const quest: QuestLike = { condition_type: 'log_count', condition_value: 2 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
  });

  it('checks log_count for weekly: uses weeklyLogCount', () => {
    const quest: QuestLike = { type: 'weekly', condition_type: 'log_count', condition_value: 7 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.current).toBe(10);
    expect(result.completed).toBe(true);
  });

  it('checks drink_streak: streak >= target', () => {
    const quest: QuestLike = { condition_type: 'drink_streak', condition_value: 3 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
    expect(result.current).toBe(3);
  });

  it('checks drink_total: totalWater >= target', () => {
    const quest: QuestLike = { condition_type: 'drink_total', condition_value: 10000 };
    const result = resolveQuestProgress(quest, baseCtx);
    expect(result.completed).toBe(true);
    expect(result.current).toBe(15000);
  });

  it('handles fallback to waterToday when ctx is empty', () => {
    const result = resolveQuestProgress({ condition_type: 'drink_today', condition_value: 100 }, {});
    expect(result.current).toBe(0);
    expect(result.completed).toBe(false);
  });

  it('guards against division by zero in goal_percent', () => {
    const result = resolveQuestProgress({ condition_type: 'goal_percent', condition_value: 50 }, { waterToday: 100, waterGoal: 0 });
    expect(result.current).toBe(0);
    expect(Number.isFinite(result.current)).toBe(true);
  });
});
