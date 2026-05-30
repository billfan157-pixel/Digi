/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { playWaterDropSound } from '@/lib/audio';
import type { Profile, WaterLog } from '@/models';
import { expGainedForWater } from '@/config/questConfig';
import {
  useWaterLogsQuery,
  useRecordHydrationMutation,
  useDeleteWaterMutation,
  useUpdateWaterMutation,
} from './useWaterQueries';
import { supabase } from '@/lib/supabase';
import { fetchUserClubs, incrementClubIntake, insertClubActivity } from '@/services/water.service';
import { queueItem, pushToQueue, readQueue, writeQueue, countQueue, clearQueue, migrateLegacyQueue, resolveStrategy, MAX_RETRIES, initQueue } from '@/lib/offlineQueue';
import { useNetworkState } from './useNetworkState';
import type { QueueItem } from '@/lib/offlineQueue';

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
  const offlineSyncInFlightRef = useRef(false);

  const today = toDateStr();
  const waterQuery = useWaterLogsQuery(isRealUser(profile?.id) ? profile.id : undefined, today);
  const waterQueryRef = useRef(waterQuery);

  // Keep latest query object in a ref (must not be assigned during render)
  useEffect(() => {
    waterQueryRef.current = waterQuery;
  }, [waterQuery]);

  const recordHydrationMutation = useRecordHydrationMutation();
  const deleteWaterMutation = useDeleteWaterMutation();
  const updateWaterMutation = useUpdateWaterMutation();

  // Sync React Query data → local state (initial load + refetch)
  useEffect(() => {
    if (waterQuery.data && waterQuery.isSuccess) {
      // avoid react-hooks/set-state-in-effect (setState directly in effect body)
      setTimeout(() => {
        setWaterEntries(waterQuery.data);
        setIsSyncing(false);
      }, 0);
    }
  }, [waterQuery.data, waterQuery.isSuccess]);

  const waterIntake = useMemo(() => {
    const fromEntries = waterEntries.reduce((sum, e) => sum + e.amount, 0);
    const fromProfile = profile?.water_today || 0;
    return fromEntries > 0 ? fromEntries : fromProfile;
  }, [waterEntries, profile?.water_today]);

  useEffect(() => { waterIntakeRef.current = waterIntake; }, [waterIntake]);
  useEffect(() => { waterEntriesRef.current = waterEntries; }, [waterEntries]);

  const { isOnline, wasOffline } = useNetworkState();

  useEffect(() => {
    if (!isRealUser(profile?.id)) {
      setTimeout(() => setHasPendingCloudSync(false), 0);
      return;
    }
    initQueue(profile.id).then(() => {
      const migrated = migrateLegacyQueue(profile.id);
      if (migrated > 0) devLog(`Migrated ${migrated} legacy queue items`);
      setTimeout(() => setHasPendingCloudSync(countQueue(profile.id) > 0), 0);
    }).catch(err => {
      devError('Failed to initialize offline queue:', err);
    });
  }, [profile?.id]);

  // ── Fetch ──────────────────────────────────────────────

  const fetchAllWater = useCallback(async () => {
    devLog('fetchAllWater called, profile.id:', profile?.id);
    if (!isRealUser(profile?.id)) {
      devLog('Not real user, skipping');
      return;
    }

    setIsSyncing(true);
    const result = await waterQueryRef.current.refetch();
    if (result.error) {
      devError('fetchAllWater error:', result.error);
        toast.error(i18n.t('water.failed_load'));
    }
    setIsSyncing(false);
  }, [profile?.id]);

  // Auto fetch water data on mount/profile change
  useEffect(() => {
    if (profile?.id) {
      devLog('Profile changed, fetching water data');
      // avoid react-hooks/set-state-in-effect by deferring execution
      setTimeout(() => fetchAllWater(), 0);
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
        toast.success(i18n.t('water.recorded', { amount: actualAmount }), {
          action: {
            label: i18n.t('water.post_drop', '💧 Đăng drop'),
            onClick: async () => {
              try {
                const { data, error } = await supabase.rpc('post_water_drop', {
                  p_water_log_id: tempId,
                  p_message: i18n.t('water.drop_default_message', '💧 Vừa uống nước xong!'),
                });
                if (error) throw error;
                if (data?.error) {
                  toast.error(data.error);
                } else {
                  toast.success(i18n.t('water.drop_posted', 'Đã đăng drop! +{points} điểm duel').replace('{points}', String(data?.points || 5)));
                }
              } catch {
                toast.error(i18n.t('water.drop_failed', 'Đăng drop thất bại'));
              }
            },
          },
        });
        return;
      }

      // Stable client event id for idempotency (crash/replay protection)
      const clientEventId = uuid();

      try {
        // Atomic: insert water_log + process hydration side effects in one server transaction
        const result = await recordHydrationMutation.mutateAsync({
          p_user_id: profile.id,
          p_amount_ml: actualAmount,
          p_temp_c: tempC || null,
          p_exercise_mins: exerciseMins || 0,
          p_is_fasting: isFasting || false,
          p_client_event_id: clientEventId,
          p_name: name,
          p_day: today,
          p_created_at: now,
        });

        const resultData = (result ?? {}) as Record<string, unknown>;
        const realId = String(resultData.log_id ?? '');

        // Swap tempId -> real ID
        if (realId) {
          setWaterEntries(prev =>
            prev.map(e => e.id === tempId ? { ...e, id: realId } : e),
          );
        }

        toast.success(i18n.t('water.recorded', { amount: actualAmount }));

        // Confetti (milestones only) handled elsewhere to keep routine logs calm.

        // [FIX] Truyền actualAmount và exp để handleWaterSync cập nhật profile
        // (coins, EXP, level, water_today) ngay lập tức thay vì chờ refetch DB
        await onWaterLogged?.(actualAmount, exp);

        // Clubs sync: fire & forget, không block UI
        syncToClubs(profile.id, actualAmount).catch(devError);

        // First water log analytics
        const firstLogKey = `first_water_logged_${profile.id}`;
        if (!localStorage.getItem(firstLogKey)) {
          localStorage.setItem(firstLogKey, '1');
          import('@/lib/analytics').then(({ track }) => track('first_water_log', { amount: actualAmount }));
        }

      } catch (err) {
        devError('addWater:', err);
        toast.error(i18n.t('water.failed_record'));

        // Rollback optimistic entry
        setWaterEntries(prev => prev.filter(e => e.id !== tempId));

        // Lưu day ngay tại đây thay vì tính lại khi sync
        pushToQueue(profile.id, queueItem(
          profile.id,
          'add',
          'water_log',
          null,
          { tempId, amount: actualAmount, name, exp, day: today, created_at: now, tempC, exerciseMins, isFasting },
        ));

        setHasPendingCloudSync(true);
      }
    },
    [profile, onWaterLogged, efTempC, efExerciseMins, efIsFasting, recordHydrationMutation],
  );

  // ── Delete ─────────────────────────────────────────────

  const _doDelete = useCallback(
    async (id: string, entry: WaterLog) => {
      const snapshot = waterEntriesRef.current;
      setWaterEntries(prev => prev.filter(e => e.id !== id));

      if (id.startsWith('temp') || !isRealUser(profile?.id)) {
        toast.success(i18n.t('water.deleted'));
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

        toast.success(i18n.t('water.deleted'));
      } catch (err) {
        devError('Delete failed:', err);
        setWaterEntries(snapshot);
        pushToQueue(profile.id, queueItem(
          profile.id,
          'delete',
          'water_log',
          id,
          { amount: entry.amount, exp: entry.exp, day: today },
        ));
        setHasPendingCloudSync(true);
        toast.error(i18n.t('water.failed_delete'));
      }
    },
    [profile, onWaterLogged, fetchAllWater, deleteWaterMutation, today],
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
        toast.error(i18n.t('water.not_found'));
      return;
    }

    if (Number.isNaN(newAmount) || newAmount <= 0) {
        toast.error(i18n.t('water.invalid_amount'));
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

        toast.success(i18n.t('water.updated'));
      if (deltaAmount !== 0) await onWaterLogged?.(deltaAmount, deltaExp);
    } catch (err) {
      devError('edit failed:', err);
      setWaterEntries(snapshot);
      pushToQueue(profile.id, queueItem(
        profile.id,
        'edit',
        'water_log',
        id,
        { amount: newAmount, exp: newExp, deltaAmount, deltaExp, day: today },
      ));
      setHasPendingCloudSync(true);
        toast.error(i18n.t('water.failed_update'));
    }
  }, [profile, onWaterLogged, today, updateWaterMutation]);

  // ── Offline sync ───────────────────────────────────────

  const syncOfflineLogs = useCallback(async () => {
    if (!isRealUser(profile?.id) || offlineSyncInFlightRef.current || !isOnline) return;

    const queue = readQueue<QueueItem>(profile.id);
    if (!queue.length) return;

    devLog('Syncing offline queue:', queue.length, 'items');
    offlineSyncInFlightRef.current = true;
    setIsSyncing(true);

    let syncedCount = 0;
    let failedCount = 0;
    const remaining: QueueItem[] = [];
    const handledIds = new Set<string>();

    try {
      for (const item of queue) {
        try {
          if (item.operation === 'add') {
            const p = item.payload as Record<string, unknown>;
            const createdAt = String(p.created_at ?? item.createdAt);

            // Atomic idempotent hydration: item.id serves as client_event_id
            await recordHydrationMutation.mutateAsync({
              p_user_id: item.userId,
              p_amount_ml: Number(p.amount ?? 0),
              p_temp_c: (p.tempC as number) || null,
              p_exercise_mins: (p.exerciseMins as number) || 0,
              p_is_fasting: (p.isFasting as boolean) || false,
              p_client_event_id: item.id,
              p_name: String(p.name ?? 'Nuoc Loc'),
              p_day: String(p.day ?? ''),
              p_created_at: createdAt,
            });
          } else if (item.operation === 'delete' && item.entityId) {
            const p = item.payload as Record<string, unknown>;
            const resolution = resolveStrategy(item, { updated_at: undefined });
            if (resolution !== 'server_wins') {
              await deleteWaterMutation.mutateAsync({
                id: item.entityId,
                userId: item.userId,
                day: String(p.day ?? ''),
              });

              await onWaterLogged?.(Number(p.amount ?? 0) * -1, Number(p.exp ?? 0) * -1);
            }
          } else if (item.operation === 'edit' && item.entityId) {
            const p = item.payload as Record<string, unknown>;

            const { data: serverData } = await supabase
              .from('water_logs')
              .select('updated_at')
              .eq('id', item.entityId)
              .maybeSingle();
            const resolution = resolveStrategy(item, { updated_at: serverData?.updated_at });
            if (resolution !== 'server_wins') {
              await updateWaterMutation.mutateAsync({
                id: item.entityId,
                userId: item.userId,
                day: String(p.day ?? ''),
                amount: Number(p.amount ?? 0),
                exp: Number(p.exp ?? 0),
              });

              const deltaAmount = Number(p.deltaAmount ?? 0);
              if (deltaAmount !== 0) await onWaterLogged?.(deltaAmount, Number(p.deltaExp ?? 0));
            }
          }

          handledIds.add(item.id);
          syncedCount += 1;
        } catch (err) {
          devError('sync item failed:', item.id, err);
          handledIds.add(item.id);
          if (item.retryCount >= MAX_RETRIES - 1) {
            devLog('Dropping item after max retries:', item.id);
          } else {
            remaining.push({ ...item, retryCount: item.retryCount + 1, lastError: String(err) });
            failedCount += 1;
          }
        }
      }

      const currentQueue = readQueue<QueueItem>(profile.id);
      const final = [...remaining, ...currentQueue.filter(i => !handledIds.has(i.id))];

      if (final.length === 0) {
        clearQueue(profile.id);
      } else {
        writeQueue(profile.id, final);
      }
      setHasPendingCloudSync(final.length > 0);

      if (syncedCount > 0) {
        toast.success(i18n.t('water.offline_synced', { count: syncedCount }));
        await onWaterLogged?.();
        fetchAllWater();
      }

      if (failedCount > 0 && remaining.length > 0) {
        toast.info(i18n.t('water.offline_pending', { count: remaining.length }));
      }
    } finally {
      offlineSyncInFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [profile, onWaterLogged, fetchAllWater, recordHydrationMutation, deleteWaterMutation, updateWaterMutation, isOnline]);

  useEffect(() => {
    if (hasPendingCloudSync && isOnline) {
      setTimeout(() => syncOfflineLogs(), 0);
    }
  }, [hasPendingCloudSync, isOnline, syncOfflineLogs]);

  useEffect(() => {
    if (wasOffline && isOnline && hasPendingCloudSync) {
      setTimeout(() => syncOfflineLogs(), 1000);
    }
  }, [wasOffline, isOnline, hasPendingCloudSync, syncOfflineLogs]);

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
          type: 'drink',
          message: `da nap them ${amountMl}ml nuoc`,
          amount: amountMl,
        }),
      ]),
    ),
  );
}
