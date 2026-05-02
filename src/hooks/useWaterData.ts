import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { QuestEngineContext } from '@/lib/questEngine';
import { playWaterDropSound } from '@/lib/audio';
import type { Profile } from '@/models';
import { expGainedForWater } from '@/config/questConfig';
// @ts-ignore
import confetti from 'canvas-confetti';

import { AppStorage } from '@/lib/storage';

// ── Constants ──────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = 'digiwell_offline_water_queue';

// ── Types ──────────────────────────────────────────────────

export interface WaterLog {
  id:         string;
  user_id:    string;
  amount:     number;
  name:       string;
  day:        string;
  exp:        number;
  created_at: string;
  timestamp:  string;
  factor:     number;
}

interface OfflineQueueItem {
  tempId:     string;
  user_id:    string;
  amount:     number;
  name:       string;
  exp:        number;
  day:        string;   // FIX: lưu ngay khi push, tránh sai ngày khi sync qua đêm
  created_at: string;
  factor:     number;
  tempC?:     number;
  exerciseMins?: number;
  isFasting?: boolean;
  logSynced?: boolean;
  progressionSynced?: boolean;
}

// ── Pure helpers ───────────────────────────────────────────

const isRealUser = (id: unknown): id is string =>
  typeof id === 'string' && id.length >= 30;

const toDateStr = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // Local date
const normalizeRow = (row: any): WaterLog => {
  const createdAt = row.created_at ?? new Date().toISOString();
  return {
    id:         String(row.id ?? crypto.randomUUID()),
    user_id:    String(row.user_id ?? ''),
    amount:     Number(row.amount ?? 0),
    name:       row.name ?? 'Nuoc Loc',
    day:        row.day ?? toDateStr(new Date(createdAt)),
    exp:        Number(row.exp ?? 0),
    created_at: createdAt,
    timestamp:  row.timestamp ?? createdAt,
    factor:     Number(row.factor ?? 1),
  };
};

// ── Offline queue helpers ──────────────────────────────────

function getOfflineQueueKey(userId: string) {
  return `${OFFLINE_QUEUE_KEY}_${userId}`;
}

function readRawOfflineQueue(storageKey: string): OfflineQueueItem[] {
  try {
    return JSON.parse(AppStorage.getItem(storageKey) ?? '[]');
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
    AppStorage.setItem(scopedKey, JSON.stringify(queue));
  } else {
    AppStorage.removeItem(scopedKey);
  }

  const legacyQueue = readRawOfflineQueue(OFFLINE_QUEUE_KEY);
  const remainingLegacyItems = legacyQueue.filter(item => item.user_id !== userId);
  if (remainingLegacyItems.length > 0) {
    AppStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingLegacyItems));
  } else {
    AppStorage.removeItem(OFFLINE_QUEUE_KEY);
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
  AppStorage.setItem(getOfflineQueueKey(item.user_id), JSON.stringify(queue));
}

function updateOfflineQueueItem(userId: string, tempId: string, patch: Partial<OfflineQueueItem>) {
  const queue = readOfflineQueue(userId).map(item => (
    item.tempId === tempId ? { ...item, ...patch } : item
  ));
  writeOfflineQueue(userId, queue);
}

function removeOfflineQueueItem(userId: string, tempId: string) {
  const queue = readOfflineQueue(userId).filter(item => item.tempId !== tempId);
  writeOfflineQueue(userId, queue);
}

function clearOfflineQueue(userId: string) {
  writeOfflineQueue(userId, []);
}

// ── Hook ───────────────────────────────────────────────────

export function useWaterData(
  profile: (Profile & { water_today?: number }) | null,
  onWaterLogged?: (optimisticAmount?: number, optimisticExp?: number) => void | Promise<void>,
  envFactors: { tempC?: number; exerciseMins?: number; isFasting?: boolean } = {}
) {
  const [waterEntries,        setWaterEntries]        = useState<WaterLog[]>([]);
  const [isSyncing,           setIsSyncing]           = useState(false);
  const [hasPendingCloudSync, setHasPendingCloudSync] = useState(false);

  const mountedRef      = useRef(true);
  const waterIntakeRef  = useRef(0);
  const waterEntriesRef = useRef<WaterLog[]>([]);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // FIX 1: Calculate from waterEntries with fallback to profile
  // Primary: sum of today's waterEntries
  // Fallback: profile.water_today if entries empty (fetch failed)
  const waterIntake = useMemo(() => {
    const fromEntries = waterEntries.reduce((sum, e) => sum + e.amount, 0);
    const fromProfile = profile?.water_today || 0;
    return fromEntries > 0 ? fromEntries : fromProfile;
  }, [waterEntries, profile?.water_today]);



  useEffect(() => {
    waterIntakeRef.current  = waterIntake;
    waterEntriesRef.current = waterEntries;
  }, [waterEntries, waterIntake]);

  useEffect(() => {
    if (!isRealUser(profile?.id)) {
      setHasPendingCloudSync(false);
      return;
    }

    setHasPendingCloudSync(readOfflineQueue(profile.id).length > 0);
  }, [profile?.id]);

  // ── Fetch ──────────────────────────────────────────────

  const fetchAllWater = useCallback(async () => {
    console.log('[useWaterData] fetchAllWater called, profile.id:', profile?.id);
    if (!isRealUser(profile?.id)) {
      console.log('[useWaterData] Not real user, skipping');
      return;
    }

    const today = toDateStr();
    console.log('[useWaterData] Fetching water for today:', today);

    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('day', today)  // Only today's entries
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useWaterData] fetchAllWater error:', error);
        throw error;
      }

      console.log('[useWaterData] Fetched raw data:', data?.length || 0, 'records for today');
      const normalized = (data ?? []).map(normalizeRow);
      console.log('[useWaterData] Normalized entries:', normalized.length, normalized.slice(0, 3).map((e: WaterLog) => ({ amount: e.amount, name: e.name })));

      setWaterEntries(normalized);
      console.log('[useWaterData] Updated waterEntries state with', normalized.length, 'entries');
    } catch (err) {
      console.error('[useWaterData] fetchAllWater exception:', err);
      toast.error('Không thể tải nhật ký nước. Kiểm tra kết nối.');
      setWaterEntries([]);
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [profile?.id]);

  // Auto fetch water data on mount/profile change
  useEffect(() => {
    if (profile?.id) {
      console.log('[useWaterData] Profile changed, fetching water data');
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
          timestamp: now,
          factor: 1,
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
      
      const { tempC, exerciseMins, isFasting } = envFactors;

      const exp    = expGainedForWater(actualAmount, profile.level || 1);
      const now    = new Date().toISOString();
      const today  = toDateStr();
      const tempId = `temp-${Date.now()}`;

      // 1. Optimistic UI
      const optimisticEntry: WaterLog = {
        id: tempId, user_id: String(profile.id),
        amount: actualAmount, name, day: today,
        exp, created_at: now, timestamp: now, factor,
      };
      setWaterEntries(prev => [optimisticEntry, ...prev]);
      playWaterDropSound();

      // 2. Demo mode
      if (!isRealUser(profile.id)) {
        toast.success(`💧 +${actualAmount}ml nước!`);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('water_logs')
          .insert({ user_id: profile.id, amount: actualAmount, name, exp, day: today })
          .select('id')
          .single();

        if (error) throw error;

        // [QUAN TRỌNG] Gọi RPC để backend tự cộng EXP, Level và Coin an toàn tuyệt đối
        const rpcRes = await supabase.rpc('process_hydration_event', {
          p_user_id: profile.id,
          p_amount_ml: actualAmount,
          p_temp_c: tempC || null,
          p_exercise_mins: exerciseMins || 0,
          p_is_fasting: isFasting || false
        });
        if (rpcRes.error) {
          console.error('[useWaterData] RPC process_hydration_event error:', rpcRes.error);
        }

        // Swap tempId -> real ID, không cần refetch toàn bộ
        setWaterEntries(prev =>
          prev.map(e => e.id === tempId ? { ...e, id: String(data.id) } : e),
        );

        toast.success(`💧 +${actualAmount}ml · ⚡ +${exp} EXP!`);

        // Hiệu ứng văng tiền vàng/điểm kinh nghiệm (Coin burst)
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#60a5fa'],
          shapes: ['circle'],
          scalar: 1.2
        });

        // [FIX] Truyền actualAmount và exp để handleWaterSync cập nhật profile
        // (coins, EXP, level, water_today) ngay lập tức thay vì chờ refetch DB
        await onWaterLogged?.(actualAmount, exp);

        // Clubs sync: fire & forget, không block UI
        syncToClubs(profile.id, actualAmount).catch(console.error);

      } catch (err) {
        console.error('[useWaterData] addWater:', err);
        toast.error('⚠️ Không thể ghi nhận uống nước. Đã lưu offline để đồng bộ sau.');

        // Rollback optimistic entry
        setWaterEntries(prev => prev.filter(e => e.id !== tempId));

        // Lưu day ngay tại đây thay vì tính lại khi sync
        pushOfflineQueue({
          tempId, user_id: String(profile.id),
          amount: actualAmount, name, exp,
          day: today,
          created_at: now, factor,
          tempC, exerciseMins, isFasting
        });

        setHasPendingCloudSync(true);
      }
    },
    [profile?.id, onWaterLogged],
  );

  // ── Delete ─────────────────────────────────────────────

  const _doDelete = useCallback(
    async (id: string, entry: WaterLog) => {
      const snapshot = waterEntriesRef.current;
      setWaterEntries(prev => prev.filter(e => e.id !== id));

      if (id.startsWith('temp') || !isRealUser(profile?.id)) {
        toast.success('🗑️ Đã xóa thành công!');
        return;
      }

      try {
        console.log('[useWaterData] Deleting entry from DB:', id);
        const { error } = await supabase.from('water_logs').delete().eq('id', id);
        if (error) {
          console.error('[useWaterData] Delete error:', error);
          throw error;
        }

        console.log('[useWaterData] Delete successful, notifying parent');
        // Notify với số âm để parent trừ đúng delta
        await onWaterLogged?.(-entry.amount, -entry.exp);

        // Force refetch to ensure data consistency
        setTimeout(() => fetchAllWater(), 500);

        toast.success('🗑️ Đã xóa thành công!');
      } catch (err) {
        console.error('[useWaterData] Delete failed:', err);
        setWaterEntries(snapshot);
        toast.error('❌ Không thể xóa. Thử lại sau!');
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
      const { error } = await supabase
        .from('water_logs')
        .update({ amount: newAmount, exp: newExp })
        .eq('id', id);

      if (error) throw error;

      toast.success('Đã cập nhật lượng nước!');
      if (deltaAmount !== 0) await onWaterLogged?.(deltaAmount, deltaExp);
    } catch (err) {
      console.error('[useWaterData] edit failed:', err);
      setWaterEntries(snapshot);
      toast.error('❌ Không thể cập nhật. Kiểm tra kết nối!');
    }
  }, [profile?.id, onWaterLogged]);

  // ── Offline sync ───────────────────────────────────────

  const syncOfflineLogs = useCallback(async () => {
    if (!isRealUser(profile?.id)) return;

    const queue = readOfflineQueue(profile.id);
    if (!queue.length) return;

    console.log('[useWaterData] Syncing offline queue:', queue.length, 'items');

    try {
      let syncedCount = 0;

      for (const item of queue) {
        if (!item.logSynced) {
          const { data: existingLog, error: existingLogError } = await supabase
            .from('water_logs')
            .select('id')
            .eq('user_id', item.user_id)
            .eq('day', item.day)
            .eq('amount', item.amount)
            .eq('name', item.name)
            .eq('created_at', item.created_at)
            .maybeSingle();

          if (existingLogError) {
            console.error('[useWaterData] Existing log lookup error:', existingLogError);
            throw existingLogError;
          }

          if (!existingLog) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { tempId: _t, factor: _f, tempC: _tc, exerciseMins: _em, isFasting: _if, logSynced: _ls, progressionSynced: _ps, ...payload } = item;
            const { error: insertError } = await supabase.from('water_logs').insert(payload);
            if (insertError) {
              console.error('[useWaterData] Insert error:', insertError);
              throw insertError;
            }
          }

          updateOfflineQueueItem(profile.id, item.tempId, { logSynced: true });
        }

        if (!item.progressionSynced) {
          const { error: rpcError } = await supabase.rpc('process_hydration_event', {
            p_user_id: item.user_id,
            p_amount_ml: item.amount,
            p_temp_c: item.tempC || null,
            p_exercise_mins: item.exerciseMins || 0,
            p_is_fasting: item.isFasting || false
          });

          if (rpcError) {
            console.error('[useWaterData] RPC process_hydration_event error:', rpcError);
            throw rpcError;
          }

          updateOfflineQueueItem(profile.id, item.tempId, { progressionSynced: true });
        }

        removeOfflineQueueItem(profile.id, item.tempId);
        syncedCount += 1;
      }

      clearOfflineQueue(profile.id);
      setHasPendingCloudSync(false);
      if (syncedCount > 0) {
        toast.success(`🔄 Đã đồng bộ ${syncedCount} mục offline thành công!`);
        await onWaterLogged?.();
        fetchAllWater();
      }
    } catch (err) {
      console.error('[useWaterData] syncOfflineLogs:', err);
      setHasPendingCloudSync(readOfflineQueue(profile.id).length > 0);
      toast.error('📶 Không thể đồng bộ dữ liệu offline. Kiểm tra kết nối mạng!');
    }
  }, [profile?.id, onWaterLogged]);

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
  const { data: clubs } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);

  if (!clubs?.length) return;

  await Promise.allSettled(
    clubs.map(({ club_id }: { club_id: string }) =>
      Promise.all([
        supabase.rpc('increment_club_member_intake', {
          p_user_id: userId, p_club_id: club_id, p_amount_to_add: amountMl,
        }),
        supabase.from('club_activity').insert({
          club_id, user_id: userId,
          activity_type: 'drink',
          message: `da nap them ${amountMl}ml nuoc`,
        }),
      ]),
    ),
  );
}
