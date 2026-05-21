import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// ── State machine ──────────────────────────────────────────

export type BottleConnectionState =
  | 'idle'          // Not connected, not trying
  | 'connecting'    // Actively establishing connection
  | 'connected'     // Connected and ready
  | 'reconnecting'  // Connection lost, auto-retrying
  | 'error';        // Failed after retries

interface BottleMetrics {
  currentVolume: number;
  batteryLevel: number;
  signalStrength: number;
  temperature: number;
}

interface SyncLog {
  id: string;
  timestamp: Date;
  action: 'drink' | 'refill' | 'sync';
  amountChange?: number;
}

export interface EquippedBottleSkin {
  id: string;
  name?: string;
  description?: string;
  rarity?: string;
  meta_value?: string | null;
  image_url?: string | null;
}

interface ProfileBottleState {
  equipped_bottle_id: string | null;
  last_bottle_volume: number | null;
}

interface HydrationRpcResponse {
  exp_gained?: number;
  total_exp?: number;
  coins_gained?: number;
  log_id?: string;
}

const HYDRATION_EVENT_NAME = 'hydrationEvent';
const BOTTLE_EQUIPPED_EVENT_NAME = 'bottleEquipped';

const clampVolume = (volume: number, capacity: number) =>
  Math.min(capacity, Math.max(0, volume));

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 16000;
const RECONNECT_MAX_ATTEMPTS = 5;

export const useSmartBottle = (userId: string | undefined, _deviceId: string, capacity: number = 750) => {
  // State machine
  const [connectionState, setConnectionState] = useState<BottleConnectionState>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const [equippedBottle, setEquippedBottle] = useState<EquippedBottleSkin | null>(null);
  const [metrics, setMetrics] = useState<BottleMetrics>({
    currentVolume: capacity,
    batteryLevel: 100,
    signalStrength: 100,
    temperature: 24,
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const metricsRef = useRef(metrics);
  const mountedRef = useRef(true);

  // Reconnection state
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived values for backward compatibility
  const isConnected = connectionState === 'connected';

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => () => {
    mountedRef.current = false;
    cancelReconnect();
  }, [cancelReconnect]);

  // ── Reconnection engine ────────────────────────────────

  function cancelReconnect() {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
  }

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    const attempt = reconnectAttemptRef.current + 1;

    if (attempt > RECONNECT_MAX_ATTEMPTS) {
      setConnectionState('error');
      setLastError(`Không thể kết nối lại sau ${RECONNECT_MAX_ATTEMPTS} lần thử.`);
      setIsSyncing(false);
      return;
    }

    setConnectionState('reconnecting');
    reconnectAttemptRef.current = attempt;

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, attempt - 1),
      RECONNECT_MAX_MS,
    );

    reconnectTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      setConnectionState('connecting');
      setIsSyncing(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (!mountedRef.current) return;

        setConnectionState('connected');
        setMetrics(prev => ({
          ...prev,
          batteryLevel: Math.max(20, prev.batteryLevel - 5),
          signalStrength: 90,
        }));
        setLastError(null);
        cancelReconnect();
        setIsSyncing(false);
      } catch {
        if (!mountedRef.current) return;
        scheduleReconnect();
      }
    }, delay);
  }, [cancelReconnect]);

  // ── Simulate periodic signal check (demo mode) ─────────

  useEffect(() => {
    if (connectionState !== 'connected') return;

    const interval = setInterval(() => {
      if (connectionState !== 'connected') return;
      setMetrics(prev => ({
        ...prev,
        signalStrength: Math.max(40, prev.signalStrength - Math.floor(Math.random() * 5)),
        batteryLevel: Math.max(15, prev.batteryLevel - Math.floor(Math.random() * 2)),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionState]);

  const fetchEquippedBottle = useCallback(async (equippedBottleId?: string | null) => {
    if (!equippedBottleId) {
      setEquippedBottle(null);
      return;
    }

    const { data, error } = await supabase
      .from('shop_items')
      .select('id, name, description, rarity, meta_value, image_url')
      .eq('id', equippedBottleId)
      .maybeSingle();

    if (error) throw error;

    setEquippedBottle(data);
  }, []);

  useEffect(() => {
    if (!userId) {
      setEquippedBottle(null);
      setMetrics(prev => ({ ...prev, currentVolume: capacity }));
      return;
    }

    const fetchInitialState = async () => {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('equipped_bottle_id, last_bottle_volume')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const profileData = data as ProfileBottleState | null;

        const nextVolume =
          profileData?.last_bottle_volume === null || profileData?.last_bottle_volume === undefined
            ? capacity
            : clampVolume(profileData.last_bottle_volume, capacity);

        setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));
        await fetchEquippedBottle(profileData?.equipped_bottle_id);
    } catch (err) {
        console.error('Lỗi lấy dữ liệu khởi tạo bình:', err);
      }
    };

    void fetchInitialState();
  }, [capacity, fetchEquippedBottle, userId]);

  useEffect(() => {
    const handleBottleEquipped = (event: Event) => {
      const customEvent = event as CustomEvent<{ equipped_bottle_id?: string | null }>;
      void fetchEquippedBottle(customEvent.detail?.equipped_bottle_id ?? null);
    };

    window.addEventListener(BOTTLE_EQUIPPED_EVENT_NAME, handleBottleEquipped);

    return () => {
      window.removeEventListener(BOTTLE_EQUIPPED_EVENT_NAME, handleBottleEquipped);
    };
  }, [fetchEquippedBottle]);

  const connectDevice = useCallback(async () => {
    if (connectionState === 'connected') return;

    cancelReconnect();
    setConnectionState('connecting');
    setIsSyncing(true);
    setLastError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setConnectionState('connected');
      setMetrics(prev => ({ ...prev, batteryLevel: 85, signalStrength: 92, temperature: 20 }));
      toast.info('Đã kết nối DigiBottle (chế độ mô phỏng).');
    } catch {
      setConnectionState('error');
      setLastError('Kết nối thất bại. Vui lòng thử lại.');
    } finally {
      setIsSyncing(false);
    }
  }, [cancelReconnect, connectionState]);

  const disconnectDevice = useCallback(() => {
    cancelReconnect();
    setConnectionState('idle');
    setLastError(null);
    setIsSyncing(false);
    toast.info('Đã ngắt kết nối bình nước');
  }, [cancelReconnect]);

  const retryConnection = useCallback(() => {
    setConnectionState('idle');
    setLastError(null);
    reconnectAttemptRef.current = 0;
    void connectDevice();
  }, [connectDevice]);

  const handleDrinkEvent = useCallback(async (amount: number) => {
    if (connectionState !== 'connected' || !userId) {
      toast.error('Bình chưa được kết nối!');
      return;
    }

    setIsSyncing(true);

    // Stable event id for idempotency (prevents duplicate hydration on retry/crash)
    const clientEventId = `bottle-${userId}-${Date.now()}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      // Atomic: insert water_log + process hydration side effects in one transaction
      const { data, error } = await supabase.rpc('record_hydration_event', {
        p_user_id: userId,
        p_amount_ml: amount,
        p_client_event_id: clientEventId,
        p_name: 'DigiBottle',
        p_day: todayStr,
      });

      if (error) throw error;

      const rpcData = (data ?? {}) as HydrationRpcResponse;
      const nextVolume = clampVolume(metricsRef.current.currentVolume - amount, capacity);

      setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ last_bottle_volume: nextVolume })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Lỗi lưu last_bottle_volume:', profileUpdateError);
      }

      setSyncLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date(), action: 'drink', amountChange: amount },
        ...prev,
      ]);

      window.dispatchEvent(new CustomEvent(HYDRATION_EVENT_NAME, {
        detail: {
          source: 'smart_bottle_demo',
          amount_ml: amount,
          current_volume: nextVolume,
          added_exp: rpcData.exp_gained ?? 0,
          new_total_exp: rpcData.total_exp ?? 0,
          new_coins: rpcData.coins_gained ?? 0,
          refresh_profile: true,
          refresh_water: true,
          occurred_at: new Date().toISOString(),
          log_id: rpcData.log_id || clientEventId,
        },
      }));
    } catch (error) {
      console.error('Lỗi xử lý uống nước từ RPC:', error);
      toast.error('Không thể đồng bộ DigiBottle. Kiểm tra mạng rồi thử lại.');

      // Simulate connection drop on network failure
      if (connectionState === 'connected') {
        scheduleReconnect();
      }
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, connectionState, userId, scheduleReconnect]);

  const refillBottle = useCallback(async () => {
    if (connectionState !== 'connected' || !userId) return;

    setIsSyncing(true);

    try {
      setMetrics(prev => ({ ...prev, currentVolume: capacity }));
      await supabase.from('profiles').update({ last_bottle_volume: capacity }).eq('id', userId);
      setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'refill' }, ...prev]);
      toast.success('Đã đổ đầy bình nước!');
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái đổ đầy.');
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, connectionState, userId]);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'sync' }, ...prev]);
    setTimeout(() => setIsSyncing(false), 1000);
  }, []);

  return {
    connectionState,
    isConnected,
    isSyncing,
    lastError,
    metrics,
    syncLogs,
    connectDevice,
    disconnectDevice,
    retryConnection,
    handleDrinkEvent,
    refillBottle,
    forceSync,
    equippedBottle,
    isDemoMode: true,
  };
};
