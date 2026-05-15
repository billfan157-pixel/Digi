export interface QuestProgressContext {
  waterToday?: number;
  waterGoal?: number;
  streak?: number;
  totalWater?: number;
  logCountToday?: number;
  weeklyDays?: number;
  weeklyWater?: number;
  weeklyLogCount?: number;
  level?: number;
}

export interface QuestLike {
  type?: string | null;
  condition_type?: string | null;
  condition_value?: number | string | null;
  title?: string | null;
}

export function normalizeQuestConditionType(conditionType?: string | null, title?: string | null): string {
  const rawType = String(conditionType || '').trim().toLowerCase();
  const rawTitle = String(title || '').trim().toLowerCase();

  if (rawType === 'level' || rawType.includes('level') || rawTitle.includes('level') || rawTitle.includes('cấp')) {
    return 'level';
  }
  if (rawType === 'drink_weekly_days' || rawType.includes('week')) {
    return 'drink_weekly_days';
  }
  if (rawType === 'drink_today' || rawType.includes('today') || rawType.includes('day')) {
    return 'drink_today';
  }
  if (rawType === 'goal_percent' || rawType.includes('percent') || rawType.includes('goal')) {
    return 'goal_percent';
  }
  if (rawType === 'log_count' || rawType.includes('count') || rawType.includes('log')) {
    return 'log_count';
  }
  if (rawType === 'drink_streak' || rawType.includes('streak')) {
    return 'drink_streak';
  }
  if (rawType === 'drink_total' || rawType.includes('total') || rawType.includes('all')) {
    return 'drink_total';
  }

  return rawType;
}

export function normalizeQuestConditionValue(quest: QuestLike): number {
  const normalizedType = normalizeQuestConditionType(quest.condition_type, quest.title);
  const rawValue = Number(quest.condition_value || 0);

  if (normalizedType === 'level' && rawValue > 100) {
    const levelInTitle = String(quest.title || '').match(/\d+/);
    if (levelInTitle) {
      return Number(levelInTitle[0]);
    }
  }

  return rawValue;
}

export function resolveQuestProgress(quest: QuestLike, ctx: QuestProgressContext) {
  const normalizedType = normalizeQuestConditionType(quest.condition_type, quest.title);
  const target = normalizeQuestConditionValue(quest);
  const normalizedQuestType = String(quest.type || '').trim().toLowerCase();
  const isWeeklyQuest = normalizedQuestType === 'weekly';

  let current = 0;

  switch (normalizedType) {
    case 'level':
      current = ctx.level || 1;
      break;
    case 'drink_weekly_days':
      current = ctx.weeklyDays || 0;
      break;
    case 'drink_today':
      current = isWeeklyQuest ? (ctx.weeklyWater || 0) : (ctx.waterToday || 0);
      break;
    case 'goal_percent':
      current = (ctx.waterGoal || 0) > 0
        ? Math.floor(((ctx.waterToday || 0) / (ctx.waterGoal || 1)) * 100)
        : 0;
      break;
    case 'log_count':
      current = isWeeklyQuest ? (ctx.weeklyLogCount || 0) : (ctx.logCountToday || 0);
      break;
    case 'drink_streak':
      current = ctx.streak || 0;
      break;
    case 'drink_total':
      current = ctx.totalWater || 0;
      break;
    default:
      current = 0;
      break;
  }

  return {
    normalizedType,
    target: target || 0,
    current,
    progress: Math.max(0, Math.min(current, target || 0)),
    completed: (target || 0) > 0 && current >= (target || 0),
  };
}
