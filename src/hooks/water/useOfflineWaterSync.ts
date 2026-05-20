/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { findExistingWaterLog, insertWaterLog } from '@/services/water.service';
import { readQueue, clearQueue, writeQueue, resolveStrategy, MAX_RETRIES } from '@/lib/offlineQueue';
import type { QueueItem } from '@/lib/offlineQueue';
import { devLog, devError, isRealUser } from './waterHelpers';

export function useOfflineWaterSync({
  profileId,
  isOnline,
  wasOffline,
  onWaterLogged,
  fetchAllWater,
  processHydrationMutation,
  deleteWaterMutation,
  updateWaterMutation,
}: {
  profileId: string | undefined;
  isOnline: boolean;
  wasOffline: boolean;
  onWaterLogged?: (optimisticAmount?: number, optimisticExp?: number) => void | Promise<void>;
  fetchAllWater: () => Promise<void>;
  processHydrationMutation: any;
  deleteWaterMutation: any;
  updateWaterMutation: any;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingCloudSync, setHasPendingCloudSync] = useState(false);
  const offlineSyncInFlightRef = useRef(false);

  const syncOfflineLogs = useCallback(async () => {
    if (!profileId || !isRealUser(profileId) || offlineSyncInFlightRef.current || !isOnline) return;

    const queue = readQueue<QueueItem>(profileId);
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
            const existingLog = await findExistingWaterLog({
              user_id: item.userId,
              day: String(p.day ?? ''),
              amount: Number(p.amount ?? 0),
              name: String(p.name ?? 'Nuoc Loc'),
              created_at: createdAt,
            });

            if (!existingLog) {
              await insertWaterLog({
                user_id: item.userId,
                amount: Number(p.amount ?? 0),
                name: String(p.name ?? 'Nuoc Loc'),
                exp: Number(p.exp ?? 0),
                day: String(p.day ?? ''),
                created_at: createdAt,
              });
            }

            await processHydrationMutation.mutateAsync({
              p_user_id: item.userId,
              p_amount_ml: Number(p.amount ?? 0),
              p_temp_c: (p.tempC as number) || null,
              p_exercise_mins: (p.exerciseMins as number) || 0,
              p_is_fasting: (p.isFasting as boolean) || false,
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
              .select('created_at')
              .eq('id', item.entityId)
              .maybeSingle();
            const resolution = resolveStrategy(item, { updated_at: serverData?.created_at });
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

      const currentQueue = readQueue<QueueItem>(profileId);
      const final = [...remaining, ...currentQueue.filter(i => !handledIds.has(i.id))];

      if (final.length === 0) {
        clearQueue(profileId);
      } else {
        writeQueue(profileId, final);
      }
      setHasPendingCloudSync(final.length > 0);

      if (syncedCount > 0) {
        toast.success(`Đã đồng bộ ${syncedCount} mục offline.`);
        await onWaterLogged?.();
        fetchAllWater();
      }

      if (failedCount > 0 && remaining.length > 0) {
        toast.info(`Còn ${remaining.length} mục chờ đồng bộ.`);
      }
    } finally {
      offlineSyncInFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [profileId, isOnline, processHydrationMutation, deleteWaterMutation, updateWaterMutation, onWaterLogged, fetchAllWater]);

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

  return {
    isSyncing,
    hasPendingCloudSync,
    setHasPendingCloudSync,
    syncOfflineLogs,
  };
}
