/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { playWaterDropSound } from '@/lib/audio';
import type { Profile } from '@/models';
import { expGainedForWater } from '@/config/questConfig';
import {
  useWaterLogsQuery,
  useAddWaterMutation,
  useProcessHydrationMutation,
  useDeleteWaterMutation,
  useUpdateWaterMutation,
} from './useWaterQueries';
import { fetchUserClubs, incrementClubIntake, insertClubActivity, findExistingWaterLog, insertWaterLog } from '@/services/water.service';

// ── Dev-only logger ────────────────────────────────────────
const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[useWaterData]', ...args);
  }
};
const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error('[useWaterData]', ...args);
  }
};

// ── Constants ──────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = 'digiwell_offline_water_queue';
const MAX_SYNC_RETRIES = 3;

// ── Types ──────────────────────────────────────────────────

export interface WaterLog {
  id:         string;
  user_id:    string;
  amount:     number;
  name:       string | null;
  exp:        number;
  day:        string;
  created_at: string;
}

interface OfflineQueueItem {
  tempId:     string;
  user_id:    string;
  amount:     number;
  name:       string;
  exp:        number;
  day:        string;
  created_at: string;
  tempC?:     number;
  exerciseMins?: number;
  isFasting?: boolean;
  logSynced?: boolean;
  progressionSynced?: boolean;
  retryCount?: number;
}

// ── Pure helpers ───────────────────────────────────────────

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

// ── Offline queue helpers ──────────────────────────────────

export function getOfflineQueueKey(userId: string) {
  return `${OFFLINE_QUEUE_KEY}_${userId}`;
}

function readRawOfflineQueue(storageKey: string): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  } catch {
    return [];
  }
}

function readScopedOfflineQueue(userId: string): OfflineQueueItem[] {
  return readRawOfflineQueue(getOfflineQueueKey(userId));
}

function writeOfflineQueue(userId: string, queue: OfflineQueueItem[]) {
  const scopedKey = getOfflineQueueKey(userId);

  if (queue.length > 0) {
    localStorage.setItem(scopedKey, JSON.stringify(queue));
  } else {
    localStorage.removeItem(scopedKey);
  }

  const legacyQueue = readRawOfflineQueue(OFFLINE_QUEUE_KEY);
  const remainingLegacyItems = legacyQueue.filter(item => item.user_id !== userId);
  if (remainingLegacyItems.length > 0) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingLegacyItems));
  } else {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

function readOfflineQueue(userId: string): OfflineQueueItem[] {
  const scopedQueue = readScopedOfflineQueue(userId);
  const legacyQueue = readRawOfflineQueue(OFFLINE_QUEUE_KEY).filter(item => item.user_id === userId);
  return [...legacyQueue, ...scopedQueue];
}

function pushOfflineQueue(item: OfflineQueueItem) {
  const queue = readScopedOfflineQueue(item.user_id);
  queue.push(item);
  localStorage.setItem(getOfflineQueueKey(item.user_id), JSON.stringify(queue));
}

// ── Hook ───────────────────────────────────────────────────

export function useWaterData(
  profile: (Profile & { water_today?: number }) | null,
  onWaterLogged?: (optimisticAmount?: number, optimisticExp?: number) => void | Promise<void>,
  { tempC: efTempC, exerciseMins: efExerciseMins, isFasting: efIsFasting }: { tempC?: number; exerciseMins?: number; isFasting?: boolean } = {}
) {
  const [waterEntries,        setWaterEntries]        = useState<WaterLog[]>([]);
  const [isSyncing,           setIsSyncing]           = useState(false);
  const [hasPendingCloudSync, setHasPendingCloudSync] = useState(false);

  const waterIntakeRef  = useRef(0);
  const waterEntriesRef = useRef<WaterLog[]>([]);

  const today = toDateStr();
  const waterQuery = useWaterLogsQuery(isRealUser(profile?.id) ? profile.id : undefined, today);
  const addWaterMutation = useAddWaterMutation();
  const processHydrationMutation = useProcessHydrationMutation();
  const deleteWaterMutation = useDeleteWaterMutation();
  const updateWaterMutation = useUpdateWaterMutation();

  // Sync React Query data → local state (initial load + refetch)
  useEffect(() => {
    if (waterQuery.data && waterQuery.isSuccess) {
      setWaterEntries(waterQuery.data);
      setIsSyncing(false);
    }
  }, [waterQuery.data, waterQuery.isSuccess]);

  const waterIntake = useMemo(() => {
    const fromEntries = waterEntries.reduce((sum, e) => sum + e.amount, 0);
    const fromProfile = profile?.water_today || 0;
    return fromEntries > 0 ? fromEntries : fromProfile;
  }, [waterEntries, profile?.water_today]);

  useEffect(() => { waterIntakeRef.current = waterIntake; }, [waterIntake]);
  useEffect(() => { waterEntriesRef.current = waterEntries; }, [waterEntries]);

  useEffect(() => {
    if (!isRealUser(profile?.id)) {
      setTimeout(() => setHasPendingCloudSync(false), 0);
      return;
    }

    setTimeout(() => setHasPendingCloudSync(readOfflineQueue(profile.id).length > 0), 0);
  }, [profile?.id]);

  // ── Fetch ──────────────────────────────────────────────

  const fetchAllWater = useCallback(async () => {
    devLog('fetchAllWater called, profile.id:', profile?.id);
    if (!isRealUser(profile?.id)) {
      devLog('Not real user, skipping');
      return;
    }

    setIsSyncing(true);
    const result = await waterQuery.refetch();
    if (result.error) {
      devError('fetchAllWater error:', result.error);
      toast.error('Không thể tải nhật ký nước. Kiểm tra kết nối.');
    }
    setIsSyncing(false);
  }, [profile?.id, waterQuery]);

  // Auto fetch water data on mount/profile change
  useEffect(() => {
    if (profile?.id) {
      devLog('Profile changed, fetching water data');
      fetchAllWater();
    }
  }, [profile?.id, fetchAllWater]);

  // ── Listen to Smart Bottle Events for Optimistic UI ─────
  useEffect(() => {
    const handleSmartBottleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      
      if (detail?.source === 'smart_bottle' && detail?.amount_ml > 0) {
        const now = detail.occurred_at || new Date().toISOString();
        const newEntry: WaterLog = {
          id: detail.log_id || `bottle-${Date.now()}`,
          user_id: profile?.id || '',
          amount: detail.amount_ml,
          name: 'DigiBottle',
          day: toDateStr(),
          exp: detail.added_exp || 0,
          created_at: now,
        };
        
        setWaterEntries(prev => [newEntry, ...prev]);
      }
    };

    window.addEventListener('hydrationEvent', handleSmartBottleEvent);
    return () => {
      window.removeEventListener('hydrationEvent', handleSmartBottleEvent);
    };
  }, [profile?.id]);

  // ── Add water ──────────────────────────────────────────

  const handleAddWater = useCallback(
    async (amount: number, factor = 1, name = 'Nuoc Loc') => {
      if (!profile?.id) return;

      const actualAmount = Math.round(amount * factor);
      if (actualAmount <= 0) return;
      
      const { tempC, exerciseMins, isFasting } = { tempC: efTempC, exerciseMins: efExerciseMins, isFasting: efIsFasting };

      const exp    = expGainedForWater(actualAmount, profile.level || 1);
      const now    = new Date().toISOString();
      const today  = toDateStr();
      const tempId = `temp-${Date.now()}`;

      // 1. Optimistic UI
      const optimisticEntry: WaterLog = {
        id: tempId, user_id: String(profile.id),
        amount: actualAmount, name, day: today,
        exp, created_at: now,
      };
      setWaterEntries(prev => [optimisticEntry, ...prev]);
      playWaterDropSound();

      // 2. Demo mode
      if (!isRealUser(profile.id)) {
        toast.success(`Đã ghi nhận +${actualAmount}ml.`);
        return;
      }

      try {
        const data = await addWaterMutation.mutateAsync({
          userId: profile.id,
          amount: actualAmount,
          name,
          exp,
          day: today,
        });

        // [QUAN TRỌNG] Gọi RPC để backend tự cộng EXP, Level và Coin an toàn tuyệt đối
        await processHydrationMutation.mutateAsync({
          p_user_id: profile.id,
          p_amount_ml: actualAmount,
          p_temp_c: tempC || null,
          p_exercise_mins: exerciseMins || 0,
          p_is_fasting: isFasting || false,
        });

        // Swap tempId -> real ID, không cần refetch toàn bộ
        setWaterEntries(prev =>
          prev.map(e => e.id === tempId ? { ...e, id: data.id } : e),
        );

        toast.success(`Đã ghi nhận +${actualAmount}ml.`);

        // Confetti (milestones only) handled elsewhere to keep routine logs calm.

        // [FIX] Truyền actualAmount và exp để handleWaterSync cập nhật profile
        // (coins, EXP, level, water_today) ngay lập tức thay vì chờ refetch DB
        await onWaterLogged?.(actualAmount, exp);

        // Clubs sync: fire & forget, không block UI
        syncToClubs(profile.id, actualAmount).catch(devError);

      } catch (err) {
        devError('addWater:', err);
        toast.error('Không thể ghi nhận lúc này. Đã lưu offline để đồng bộ sau.');

        // Rollback optimistic entry
        setWaterEntries(prev => prev.filter(e => e.id !== tempId));

        // Lưu day ngay tại đây thay vì tính lại khi sync
        pushOfflineQueue({
          tempId, user_id: String(profile.id),
          amount: actualAmount, name, exp,
          day: today,
          created_at: now,
          tempC, exerciseMins, isFasting
        });

        setHasPendingCloudSync(true);
      }
    },
    [profile?.id, profile?.level, onWaterLogged, efTempC, efExerciseMins, efIsFasting],
  );

  // ── Delete ─────────────────────────────────────────────

  const _doDelete = useCallback(
    async (id: string, entry: WaterLog) => {
      const snapshot = waterEntriesRef.current;
      setWaterEntries(prev => prev.filter(e => e.id !== id));

      if (id.startsWith('temp') || !isRealUser(profile?.id)) {
        toast.success('Đã xóa.');
        return;
      }

      try {
        devLog('Deleting entry from DB:', id);
        await deleteWaterMutation.mutateAsync({ id, userId: profile.id, day: today });

        devLog('Delete successful, notifying parent');
        // Notify với số âm để parent trừ đúng delta
        await onWaterLogged?.(-entry.amount, -entry.exp);

        // Force refetch to ensure data consistency
        setTimeout(() => fetchAllWater(), 500);

        toast.success('Đã xóa.');
      } catch (err) {
        devError('Delete failed:', err);
        setWaterEntries(snapshot);
        toast.error('Không thể xóa. Thử lại sau.');
      }
    },
    [profile?.id, onWaterLogged, fetchAllWater],
  );

  const handleDeleteEntry = useCallback(
    async (rawId: unknown) => {
      const id = String(rawId ?? '');
      if (!id) return;

      const entry = waterEntriesRef.current.find(e => e.id === id);
      if (!entry) return;

      toast(`Xóa ${entry.amount}ml ${entry.name}?`, {
        action:   { label: 'Xác nhận', onClick: () => _doDelete(id, entry) },
        cancel:   { label: 'Hủy',      onClick: () => {} },
        duration: 5000,
      });
    },
    [_doDelete],
  );

  // ── Edit ───────────────────────────────────────────────

  const handleEditEntry = useCallback(async (id: string, newAmount: number) => {
    const originalEntry = waterEntriesRef.current.find(e => e.id === id);
    if (!originalEntry) {
      toast.error('Lỗi: Không tìm thấy mục cần sửa.');
      return;
    }

    if (Number.isNaN(newAmount) || newAmount <= 0) {
      toast.error('Lượng nước không hợp lệ.');
      return;
    }

    const newExp      = expGainedForWater(newAmount, profile?.level || 1);
    const snapshot = waterEntriesRef.current;
    // Tính delta để notify parent đúng số chênh lệch, không phải tổng mới
    const deltaAmount = newAmount - originalEntry.amount;
    const deltaExp    = newExp    - originalEntry.exp;

    setWaterEntries(prev =>
      prev.map(e => e.id === id ? { ...e, amount: newAmount, exp: newExp } : e),
    );

    if (!isRealUser(profile?.id) || id.startsWith('temp-')) return;

    try {
      await updateWaterMutation.mutateAsync({
        id,
        userId: profile.id,
        day: today,
        amount: newAmount,
        exp: newExp,
      });

      toast.success('Đã cập nhật lượng nước!');
      if (deltaAmount !== 0) await onWaterLogged?.(deltaAmount, deltaExp);
    } catch (err) {
      devError('edit failed:', err);
      setWaterEntries(snapshot);
      toast.error('Không thể cập nhật. Kiểm tra kết nối.');
    }
  }, [profile?.id, profile?.level, onWaterLogged, fetchAllWater]);

  // ── Offline sync ───────────────────────────────────────

  const syncOfflineLogs = useCallback(async () => {
    if (!isRealUser(profile?.id)) return;

    const queue = readOfflineQueue(profile.id);
    if (!queue.length) return;

    devLog('Syncing offline queue:', queue.length, 'items');

    let syncedCount = 0;
    let failedCount = 0;
    const remaining: OfflineQueueItem[] = [];

    for (const item of queue) {
      const retryCount = item.retryCount ?? 0;

      try {
        if (!item.logSynced) {
          const existingLog = await findExistingWaterLog({
            user_id: item.user_id,
            day: item.day,
            amount: item.amount,
            name: item.name,
            created_at: item.created_at,
          });

          if (!existingLog) {
            await insertWaterLog({
              user_id: item.user_id,
              amount: item.amount,
              name: item.name,
              exp: item.exp,
              day: item.day,
            });
          }
        }

        if (!item.progressionSynced) {
          await processHydrationMutation.mutateAsync({
            p_user_id: item.user_id,
            p_amount_ml: item.amount,
            p_temp_c: item.tempC || null,
            p_exercise_mins: item.exerciseMins || 0,
            p_is_fasting: item.isFasting || false,
          });
        }

        syncedCount += 1;
      } catch (err) {
        devError('sync item failed:', item.tempId, err);

        if (retryCount >= MAX_SYNC_RETRIES) {
          devLog('Dropping item after max retries:', item.tempId);
        } else {
          remaining.push({ ...item, retryCount: retryCount + 1 });
          failedCount += 1;
        }
      }
    }

    // Re-read queue before writing to preserve items added during sync
    const processedIds = new Set(queue.map(item => item.tempId));
    const currentQueue = readOfflineQueue(profile.id);
    const newItems = currentQueue.filter(item => !processedIds.has(item.tempId));
    const finalQueue = [...remaining, ...newItems];

    writeOfflineQueue(profile.id, finalQueue);
    setHasPendingCloudSync(finalQueue.length > 0);

    if (syncedCount > 0) {
      toast.success(`Đã đồng bộ ${syncedCount} mục offline.`);
      await onWaterLogged?.();
      fetchAllWater();
    }

    if (failedCount > 0 && remaining.length > 0) {
      toast.info(`Còn ${remaining.length} mục chờ đồng bộ.`);
    }
  }, [profile?.id, onWaterLogged, fetchAllWater]);

  useEffect(() => {
    if (hasPendingCloudSync) syncOfflineLogs();
  }, [hasPendingCloudSync, syncOfflineLogs]);

  // ── Return ─────────────────────────────────────────────

  return {
    waterEntries,
    waterIntake,
    handleAddWater,
    handleDeleteEntry,
    handleEditEntry,
    hasPendingCloudSync,
    isSyncing,
    waterIntakeRef,
    waterEntriesRef,
    refetchWater: fetchAllWater,
    syncOfflineLogs,
  };
}

// ── Club sync (fire & forget) ──────────────────────────────

async function syncToClubs(userId: string, amountMl: number) {
  const clubs = await fetchUserClubs(userId);

  if (!clubs?.length) return;

  await Promise.allSettled(
    clubs.map(({ club_id }) =>
      Promise.all([
        incrementClubIntake({
          p_user_id: userId, p_club_id: club_id, p_amount_to_add: amountMl,
        }),
        insertClubActivity({
          club_id, user_id: userId,
          activity_type: 'drink',
          message: `da nap them ${amountMl}ml nuoc`,
        }),
      ]),
    ),
  );
}