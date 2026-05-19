export type QueueOperation = 'add' | 'edit' | 'delete';

export interface QueueItem {
  id: string;
  userId: string;
  operation: QueueOperation;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export type ConflictStrategy = 'local_wins' | 'server_wins' | 'merge';

export function resolveStrategy(
  local: QueueItem | null,
  server: { updated_at?: string } | null,
): ConflictStrategy {
  if (!local) return 'server_wins';
  if (!server) return 'local_wins';

  const localTime = new Date(local.createdAt).getTime();
  const serverTime = server.updated_at ? new Date(server.updated_at).getTime() : 0;

  if (localTime > serverTime) return 'local_wins';
  if (serverTime > localTime) return 'server_wins';
  return 'merge';
}

const QUEUE_PREFIX = 'digiwell_offline_v2';
const MAX_RETRIES = 3;

function createQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scopedKey(userId: string): string {
  return `${QUEUE_PREFIX}_${userId}`;
}

function readRaw<T extends QueueItem>(userId: string): T[] {
  try {
    const raw = localStorage.getItem(scopedKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRaw(userId: string, items: QueueItem[]) {
  if (items.length > 0) {
    localStorage.setItem(scopedKey(userId), JSON.stringify(items));
  } else {
    localStorage.removeItem(scopedKey(userId));
  }
}

export function queueItem(userId: string, operation: QueueOperation, entityType: string, entityId: string | null, payload: Record<string, unknown>): QueueItem {
  return {
    id: createQueueId(),
    userId,
    operation,
    entityType,
    entityId,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
}

export function pushToQueue(userId: string, item: QueueItem) {
  const queue = compactQueue([...readRaw(userId), item]);
  writeRaw(userId, queue);
}

export function removeFromQueue(userId: string, itemId: string) {
  const queue = readRaw(userId);
  writeRaw(userId, queue.filter(i => i.id !== itemId));
}

export function updateInQueue(userId: string, itemId: string, update: Partial<QueueItem>) {
  const queue = readRaw(userId);
  const idx = queue.findIndex(i => i.id === itemId);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...update };
    writeRaw(userId, queue);
  }
}

export function readQueue<T extends QueueItem>(userId: string): T[] {
  return readRaw<T>(userId).filter(i => i.retryCount < MAX_RETRIES);
}

export function writeQueue(userId: string, items: QueueItem[]) {
  writeRaw(userId, compactQueue(items));
}

export function countQueue(userId: string): number {
  return readQueue(userId).length;
}

export function clearQueue(userId: string) {
  writeRaw(userId, []);
}

export function migrateLegacyQueue(userId: string): number {
  const legacyKey = `digiwell_offline_water_queue_${userId}`;
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return 0;
    const legacyItems: Array<{
      tempId: string; user_id: string; amount: number; name: string;
      exp: number; day: string; created_at: string;
      tempC?: number; exerciseMins?: number; isFasting?: boolean;
      logSynced?: boolean; progressionSynced?: boolean; retryCount?: number;
    }> = JSON.parse(raw);

    if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
      localStorage.removeItem(legacyKey);
      return 0;
    }

    const newItems: QueueItem[] = legacyItems.map(item => ({
      id: item.tempId,
      userId: item.user_id,
      operation: 'add' as QueueOperation,
      entityType: 'water_log',
      entityId: null,
      payload: {
        amount: item.amount,
        name: item.name,
        exp: item.exp,
        day: item.day,
        created_at: item.created_at,
        tempC: item.tempC,
        exerciseMins: item.exerciseMins,
        isFasting: item.isFasting,
        logSynced: item.logSynced,
        progressionSynced: item.progressionSynced,
      },
      createdAt: item.created_at,
      retryCount: item.retryCount ?? 0,
    }));

    const existing = readRaw<QueueItem>(userId);
    const merged = compactQueue([...existing, ...newItems]);
    writeRaw(userId, merged);
    localStorage.removeItem(legacyKey);
    return newItems.length;
  } catch {
    return 0;
  }
}

export function compactQueue(items: QueueItem[]): QueueItem[] {
  const compacted: QueueItem[] = [];
  const seenIds = new Set<string>();
  const deletedEntities = new Set<string>();

  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    const entityKey = item.entityId ? `${item.entityType}:${item.entityId}` : '';
    const tempKey = typeof item.payload.tempId === 'string'
      ? `${item.entityType}:temp:${item.payload.tempId}`
      : '';

    if (entityKey && deletedEntities.has(entityKey)) continue;

    const duplicateAddIndex = item.operation === 'add'
      ? compacted.findIndex((existing) => {
          if (existing.operation !== 'add' || existing.entityType !== item.entityType) return false;
          const existingTempId = existing.payload.tempId;
          if (tempKey && existingTempId === item.payload.tempId) return true;
          return existing.userId === item.userId
            && existing.payload.created_at === item.payload.created_at
            && existing.payload.amount === item.payload.amount
            && existing.payload.name === item.payload.name;
        })
      : -1;

    if (duplicateAddIndex !== -1) {
      compacted[duplicateAddIndex] = {
        ...compacted[duplicateAddIndex],
        retryCount: Math.max(compacted[duplicateAddIndex].retryCount, item.retryCount),
        lastError: item.lastError ?? compacted[duplicateAddIndex].lastError,
      };
      continue;
    }

    if (entityKey && item.operation === 'edit') {
      const deleteIndex = compacted.findIndex(
        (existing) => existing.operation === 'delete'
          && existing.entityType === item.entityType
          && existing.entityId === item.entityId,
      );
      if (deleteIndex !== -1) continue;

      const editIndex = compacted.findIndex(
        (existing) => existing.operation === 'edit'
          && existing.entityType === item.entityType
          && existing.entityId === item.entityId,
      );
      if (editIndex !== -1) {
        compacted[editIndex] = item;
        continue;
      }
    }

    if (entityKey && item.operation === 'delete') {
      deletedEntities.add(entityKey);
      for (let index = compacted.length - 1; index >= 0; index -= 1) {
        const existing = compacted[index];
        if (existing.entityType === item.entityType && existing.entityId === item.entityId) {
          compacted.splice(index, 1);
        }
      }
    }

    if (tempKey && item.operation === 'delete') {
      for (let index = compacted.length - 1; index >= 0; index -= 1) {
        const existing = compacted[index];
        if (existing.operation === 'add'
          && existing.entityType === item.entityType
          && existing.payload.tempId === item.payload.tempId) {
          compacted.splice(index, 1);
        }
      }
      continue;
    }

    compacted.push(item);
  }

  return compacted;
}
