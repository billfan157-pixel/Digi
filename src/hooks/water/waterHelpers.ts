import type { WaterLog } from '@/models';

export const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[useWaterData]', ...args);
  }
};

export const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error('[useWaterData]', ...args);
  }
};

export const isRealUser = (id: unknown): id is string =>
  typeof id === 'string' && id.length >= 30;

export const toDateStr = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // Local date

const uuid = (): string =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const normalizeRow = (row: Record<string, unknown>): WaterLog => {
  const createdAt = String(row.created_at ?? new Date().toISOString());
  return {
    id:         String(row.id ?? uuid()),
    user_id:    String(row.user_id ?? ''),
    amount:     Number(row.amount ?? 0),
    name:       String(row.name ?? 'Nuoc Loc'),
    day:        String(row.day ?? toDateStr(new Date(createdAt))),
    exp:        Number(row.exp ?? 0),
    created_at: createdAt,
  };
};
