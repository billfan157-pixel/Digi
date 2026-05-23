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
export const MAX_RETRIES = 3;

function createQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scopedKey(userId: string): string {
  return `${QUEUE_PREFIX}_${userId}`;
}

const queueCache = new Map<string, QueueItem[]>();
const keyCache = new Map<string, CryptoKey>();
const writeChains = new Map<string, Promise<void>>();
const STATIC_SALT = 'digiwell-offline-salt-key-12345';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function clearMemoryCaches() {
  queueCache.clear();
  keyCache.clear();
  writeChains.clear();
}

async function encryptAndSaveQueue(userId: string, items: QueueItem[], key: CryptoKey): Promise<void> {
  if (items.length === 0) {
    localStorage.removeItem(scopedKey(userId));
    return;
  }

  const jsonStr = JSON.stringify(items);
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(jsonStr);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  const combinedBytes = new Uint8Array(iv.length + ciphertextBytes.length);
  combinedBytes.set(iv, 0);
  combinedBytes.set(ciphertextBytes, iv.length);

  const base64Str = uint8ArrayToBase64(combinedBytes);
  localStorage.setItem(scopedKey(userId), base64Str);
}

export async function initQueue(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + STATIC_SALT);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const key = await crypto.subtle.importKey(
      "raw",
      hash,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    keyCache.set(userId, key);

    const raw = localStorage.getItem(scopedKey(userId));
    if (!raw) {
      queueCache.set(userId, []);
      return;
    }

    try {
      const encryptedBytes = base64ToUint8Array(raw);
      if (encryptedBytes.length < 13) {
        throw new Error("Invalid cipher content length");
      }
      const iv = encryptedBytes.slice(0, 12);
      const ciphertext = encryptedBytes.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      const items = JSON.parse(decryptedText);
      queueCache.set(userId, Array.isArray(items) ? items : []);
    } catch {
      // Fallback to plain JSON parse if it was stored raw
      try {
        const items = JSON.parse(raw);
        const arrayItems = Array.isArray(items) ? items : [];
        queueCache.set(userId, arrayItems);
        // Resave as encrypted
        await encryptAndSaveQueue(userId, arrayItems, key);
      } catch {
        queueCache.set(userId, []);
      }
    }
  } catch (err) {
    console.error('[offlineQueue] Failed to initialize secure queue:', err);
    queueCache.set(userId, []);
  }
}

function readRaw<T extends QueueItem>(userId: string): T[] {
  if (queueCache.has(userId)) {
    return (queueCache.get(userId) || []) as T[];
  }
  // Synchronous fallback (e.g. for testing environments or legacy compatibility before async initialization)
  try {
    const raw = localStorage.getItem(scopedKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        queueCache.set(userId, parsed);
        return parsed as T[];
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function writeRaw(userId: string, items: QueueItem[]) {
  queueCache.set(userId, items);
  const key = keyCache.get(userId);
  if (key) {
    const currentChain = writeChains.get(userId) || Promise.resolve();
    const nextChain = currentChain.then(async () => {
      try {
        await encryptAndSaveQueue(userId, items, key);
      } catch (err) {
        console.error('[offlineQueue] Background encryption failed:', err);
      }
    });
    writeChains.set(userId, nextChain);
  } else {
    if (items.length > 0) {
      localStorage.setItem(scopedKey(userId), JSON.stringify(items));
    } else {
      localStorage.removeItem(scopedKey(userId));
    }
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
