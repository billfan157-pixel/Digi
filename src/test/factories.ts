import type { QuestEngineContext } from '@/lib/questEngine';
import type { QuestProgressContext, QuestLike } from '@/lib/questProgress';

export function createQuestCtx(overrides?: Partial<QuestEngineContext>): QuestEngineContext {
  return {
    userId: 'user-1',
    waterToday: 1500,
    waterGoal: 2000,
    streak: 5,
    totalWater: 50000,
    logCountToday: 6,
    weeklyDays: 4,
    level: 10,
    ...overrides,
  };
}

export function createProgressCtx(overrides?: Partial<QuestProgressContext>): QuestProgressContext {
  return {
    waterToday: 1500,
    waterGoal: 2000,
    streak: 5,
    totalWater: 50000,
    logCountToday: 6,
    weeklyDays: 4,
    level: 10,
    ...overrides,
  };
}

export function createQuestLike(overrides?: Partial<QuestLike>): QuestLike {
  return {
    type: 'daily',
    condition_type: 'drink_today',
    condition_value: 2000,
    title: 'Uống đủ nước',
    ...overrides,
  };
}

export function mockSupabase() {
  const chainable: Record<string, unknown> = {
    eq: () => chainable,
    select: () => chainable,
    gte: () => chainable,
    lte: () => chainable,
    limit: () => chainable,
    order: () => chainable,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    insert: () => chainable,
    update: () => chainable,
    upsert: () => chainable,
    delete: () => chainable,
    range: () => chainable,
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null, count: null }),
  };

  return {
    from: () => chainable,
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => 'SUBSCRIBED' }),
      unsubscribe: () => Promise.resolve(),
    }),
    removeChannel: () => {},
    removeAllChannels: () => {},
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
    },
  };
}
