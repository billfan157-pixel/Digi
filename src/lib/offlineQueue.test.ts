import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveStrategy,
  queueItem,
  pushToQueue,
  removeFromQueue,
  updateInQueue,
  readQueue,
  writeQueue,
  countQueue,
  clearQueue,
  migrateLegacyQueue,
  compactQueue,
  type QueueItem,
} from './offlineQueue';

beforeEach(() => {
  localStorage.clear();
});

const userId = 'user-test-abc';

function seedQueue(items: QueueItem[]) {
  localStorage.setItem(`digiwell_offline_v2_${userId}`, JSON.stringify(items));
}

function readRaw(): QueueItem[] {
  try {
    const raw = localStorage.getItem(`digiwell_offline_v2_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

describe('resolveStrategy', () => {
  it('returns server_wins when local is null', () => {
    expect(resolveStrategy(null, { updated_at: '2024-01-01T00:00:00Z' })).toBe('server_wins');
  });

  it('returns local_wins when server is null', () => {
    const local: QueueItem = { id: '1', userId, operation: 'add', entityType: 'water_log', entityId: null, payload: {}, createdAt: '2024-01-02T00:00:00Z', retryCount: 0 };
    expect(resolveStrategy(local, null)).toBe('local_wins');
  });

  it('returns local_wins when local is newer than server', () => {
    const local: QueueItem = { id: '1', userId, operation: 'add', entityType: 'water_log', entityId: null, payload: {}, createdAt: '2024-01-02T00:00:00Z', retryCount: 0 };
    const server = { updated_at: '2024-01-01T00:00:00Z' };
    expect(resolveStrategy(local, server)).toBe('local_wins');
  });

  it('returns server_wins when server is newer than local', () => {
    const local: QueueItem = { id: '1', userId, operation: 'add', entityType: 'water_log', entityId: null, payload: {}, createdAt: '2024-01-01T00:00:00Z', retryCount: 0 };
    const server = { updated_at: '2024-01-02T00:00:00Z' };
    expect(resolveStrategy(local, server)).toBe('server_wins');
  });

  it('returns merge when timestamps are equal', () => {
    const local: QueueItem = { id: '1', userId, operation: 'add', entityType: 'water_log', entityId: null, payload: {}, createdAt: '2024-01-01T00:00:00Z', retryCount: 0 };
    const server = { updated_at: '2024-01-01T00:00:00Z' };
    expect(resolveStrategy(local, server)).toBe('merge');
  });

  it('returns server_wins when both are null', () => {
    expect(resolveStrategy(null, null)).toBe('server_wins');
  });

  it('returns local_wins when server has no updated_at', () => {
    const local: QueueItem = { id: '1', userId, operation: 'add', entityType: 'water_log', entityId: null, payload: {}, createdAt: '2024-01-01T00:00:00Z', retryCount: 0 };
    const server = {} as { updated_at?: string };
    expect(resolveStrategy(local, server)).toBe('local_wins');
  });
});

describe('queueItem', () => {
  it('creates an item with the given fields and defaults', () => {
    const item = queueItem(userId, 'add', 'water_log', null, { amount: 250 });
    expect(item.userId).toBe(userId);
    expect(item.operation).toBe('add');
    expect(item.entityType).toBe('water_log');
    expect(item.entityId).toBeNull();
    expect(item.payload).toEqual({ amount: 250 });
    expect(item.retryCount).toBe(0);
    expect(item.id).toBeTruthy();
    expect(item.createdAt).toBeTruthy();
  });
});

describe('pushToQueue', () => {
  it('adds an item to an empty queue', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {});
    pushToQueue(userId, item);
    const queue = readRaw();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(item.id);
  });

  it('appends to existing queue', () => {
    const item1 = queueItem(userId, 'add', 'water_log', null, { amount: 250 });
    pushToQueue(userId, item1);
    const item2 = queueItem(userId, 'edit', 'water_log', 'entity-1', { amount: 500 });
    pushToQueue(userId, item2);
    expect(readRaw()).toHaveLength(2);
  });

  it('does not store duplicate add operations for the same temp id', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {
      tempId: 'temp-1',
      amount: 250,
      name: 'Nuoc Loc',
      created_at: '2024-06-15T10:00:00Z',
    });
    pushToQueue(userId, item);
    pushToQueue(userId, { ...item, id: 'retry-copy', retryCount: 1 });
    expect(readRaw()).toHaveLength(1);
    expect(readRaw()[0].retryCount).toBe(1);
  });
});

describe('removeFromQueue', () => {
  it('removes item by id', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {});
    seedQueue([item]);
    removeFromQueue(userId, item.id);
    expect(readRaw()).toHaveLength(0);
  });

  it('does nothing for unknown id', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {});
    seedQueue([item]);
    removeFromQueue(userId, 'nonexistent');
    expect(readRaw()).toHaveLength(1);
  });
});

describe('updateInQueue', () => {
  it('updates existing item fields', () => {
    const item = queueItem(userId, 'add', 'water_log', null, { amount: 250 });
    seedQueue([item]);
    updateInQueue(userId, item.id, { retryCount: 2, lastError: 'timeout' });
    const updated = readRaw()[0];
    expect(updated.retryCount).toBe(2);
    expect(updated.lastError).toBe('timeout');
  });

  it('no-ops for missing id', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {});
    seedQueue([item]);
    updateInQueue(userId, 'nonexistent', { retryCount: 99 });
    expect(readRaw()[0].retryCount).toBe(0);
  });
});

describe('readQueue', () => {
  it('returns only items with retryCount < MAX_RETRIES', () => {
    const valid = queueItem(userId, 'add', 'water_log', null, {});
    const exhausted: QueueItem = { ...queueItem(userId, 'add', 'water_log', null, {}), retryCount: 3 };
    seedQueue([valid, exhausted]);
    const result = readQueue(userId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(valid.id);
  });
});

describe('writeQueue', () => {
  it('compacts duplicate failed retry entries before persisting', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {
      tempId: 'temp-retry',
      amount: 250,
      name: 'Nuoc Loc',
      created_at: '2024-06-15T10:00:00Z',
    });

    writeQueue(userId, [item, { ...item, id: 'failed-copy', retryCount: 1, lastError: 'timeout' }]);

    const queue = readRaw();
    expect(queue).toHaveLength(1);
    expect(queue[0].retryCount).toBe(1);
    expect(queue[0].lastError).toBe('timeout');
  });
});

describe('compactQueue — edge cases', () => {
  it('returns empty for empty input', () => {
    expect(compactQueue([])).toEqual([]);
  });

  it('returns single item as-is', () => {
    const item = queueItem(userId, 'add', 'water_log', null, { amount: 250 });
    expect(compactQueue([item])).toEqual([item]);
  });

  it('deduplicates by id', () => {
    const item = queueItem(userId, 'add', 'water_log', null, { amount: 250 });
    const result = compactQueue([item, item]);
    expect(result).toHaveLength(1);
  });

  it('removes a deleted temp add entirely', () => {
    const add = queueItem(userId, 'add', 'water_log', null, { tempId: 't1' });
    const del = queueItem(userId, 'delete', 'water_log', null, { tempId: 't1' });
    expect(compactQueue([add, del])).toHaveLength(0);
  });

  it('deduplicates temp add with same created_at, amount, name', () => {
    const a1 = queueItem(userId, 'add', 'water_log', null, {
      tempId: 't1', amount: 250, name: 'Nuoc', created_at: '2024-06-15T10:00:00Z',
    });
    const a2 = queueItem(userId, 'add', 'water_log', null, {
      tempId: 't2', amount: 250, name: 'Nuoc', created_at: '2024-06-15T10:00:00Z',
    });
    const result = compactQueue([a1, a2]);
    expect(result).toHaveLength(1);
  });
});

describe('compactQueue — merge/delete', () => {
  it('keeps only the latest edit for the same server entity', () => {
    const first = queueItem(userId, 'edit', 'water_log', 'log-1', { amount: 250, exp: 25 });
    const second = queueItem(userId, 'edit', 'water_log', 'log-1', { amount: 500, exp: 50 });

    const result = compactQueue([first, second]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(second.id);
    expect(result[0].payload.amount).toBe(500);
  });

  it('lets delete supersede pending edits for the same server entity', () => {
    const edit = queueItem(userId, 'edit', 'water_log', 'log-1', { amount: 500 });
    const deletion = queueItem(userId, 'delete', 'water_log', 'log-1', { amount: 250 });

    const result = compactQueue([edit, deletion]);

    expect(result).toHaveLength(1);
    expect(result[0].operation).toBe('delete');
  });

  it('ignores edits queued after a delete for the same server entity', () => {
    const deletion = queueItem(userId, 'delete', 'water_log', 'log-1', { amount: 250 });
    const edit = queueItem(userId, 'edit', 'water_log', 'log-1', { amount: 500 });

    const result = compactQueue([deletion, edit]);

    expect(result).toHaveLength(1);
    expect(result[0].operation).toBe('delete');
  });

  it('drops a temp add when the same temp entry is deleted before sync', () => {
    const add = queueItem(userId, 'add', 'water_log', null, {
      tempId: 'temp-local',
      amount: 250,
    });
    const deletion = queueItem(userId, 'delete', 'water_log', null, {
      tempId: 'temp-local',
    });

    expect(compactQueue([add, deletion])).toHaveLength(0);
  });
});

describe('countQueue', () => {
  it('returns 0 for empty queue', () => {
    expect(countQueue(userId)).toBe(0);
  });

  it('counts valid items', () => {
    const valid = queueItem(userId, 'add', 'water_log', null, {});
    seedQueue([valid]);
    expect(countQueue(userId)).toBe(1);
  });

  it('excludes exhausted retries from count', () => {
    const exhausted: QueueItem = { ...queueItem(userId, 'add', 'water_log', null, {}), retryCount: 3 };
    seedQueue([exhausted]);
    expect(countQueue(userId)).toBe(0);
  });
});

describe('clearQueue', () => {
  it('removes all items', () => {
    const item = queueItem(userId, 'add', 'water_log', null, {});
    seedQueue([item]);
    clearQueue(userId);
    expect(readRaw()).toHaveLength(0);
  });
});

describe('migrateLegacyQueue', () => {
  const legacyKey = `digiwell_offline_water_queue_${userId}`;

  it('returns 0 when no legacy queue exists', () => {
    expect(migrateLegacyQueue(userId)).toBe(0);
  });

  it('migrates legacy items to new format and removes legacy key', () => {
    const legacyItem = {
      tempId: 'legacy-1',
      user_id: userId,
      amount: 250,
      name: 'Nước lọc',
      exp: 25,
      day: '2024-06-15',
      created_at: '2024-06-15T10:00:00Z',
      tempC: 30,
      exerciseMins: 10,
      isFasting: false,
      logSynced: false,
      progressionSynced: false,
      retryCount: 1,
    };
    localStorage.setItem(legacyKey, JSON.stringify([legacyItem]));

    const count = migrateLegacyQueue(userId);
    expect(count).toBe(1);
    expect(localStorage.getItem(legacyKey)).toBeNull();

    const queue = readRaw();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('legacy-1');
    expect(queue[0].userId).toBe(userId);
    expect(queue[0].operation).toBe('add');
    expect(queue[0].entityType).toBe('water_log');
    expect(queue[0].entityId).toBeNull();
    expect(queue[0].payload.amount).toBe(250);
    expect(queue[0].payload.name).toBe('Nước lọc');
    expect(queue[0].retryCount).toBe(1);
  });

  it('removes legacy key and returns 0 for empty array', () => {
    localStorage.setItem(legacyKey, '[]');
    expect(migrateLegacyQueue(userId)).toBe(0);
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it('returns 0 on corrupt data', () => {
    localStorage.setItem(legacyKey, 'not-json');
    expect(migrateLegacyQueue(userId)).toBe(0);
  });

  it('merges with existing v2 queue items', () => {
    const existing = queueItem(userId, 'add', 'water_log', null, { amount: 100 });
    seedQueue([existing]);

    const legacyItem = {
      tempId: 'legacy-2',
      user_id: userId,
      amount: 200,
      name: 'Trà',
      exp: 20,
      day: '2024-06-16',
      created_at: '2024-06-16T10:00:00Z',
    };
    localStorage.setItem(legacyKey, JSON.stringify([legacyItem]));

    migrateLegacyQueue(userId);
    const queue = readRaw();
    expect(queue).toHaveLength(2);
  });

  it('uses 0 retryCount when legacy item has none', () => {
    const legacyItem = {
      tempId: 'legacy-3',
      user_id: userId,
      amount: 250,
      name: 'Nước',
      exp: 25,
      day: '2024-06-15',
      created_at: '2024-06-15T10:00:00Z',
    };
    localStorage.setItem(legacyKey, JSON.stringify([legacyItem]));
    migrateLegacyQueue(userId);
    expect(readRaw()[0].retryCount).toBe(0);
  });
});
