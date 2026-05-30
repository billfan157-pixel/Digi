import i18n from '@/i18n';
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import {
  requestBlePermissions,
  startScanning,
  stopScanning,
  connectDevice as bleConnectDevice,
  disconnectDevice as bleDisconnectDevice,
  subscribeToHydration,
  readBatteryLevel,
  readTemperature,
  authenticateDevice,
  readRssi,
  DEFAULT_SHARED_SECRET,
  parseSecureHydrationPacket,
  computeHmacSha256,
  safeCompare,
} from '../lib/ble';

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
  latencyMs: number;
  healthScore: number;
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
  bottle_auth_key?: string | null;
  paired_device_id?: string | null;
  last_event_id?: number | null;
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

  const [bottleAuthKey, setBottleAuthKey] = useState<string | null>(null);
  const [pairedDeviceId, setPairedDeviceId] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<number>(0);
  const [simulateAttackType, setSimulateAttackType] = useState<'none' | 'replay' | 'tampering'>('none');
  const [metrics, setMetrics] = useState<BottleMetrics>({
    currentVolume: capacity,
    batteryLevel: 100,
    signalStrength: 100,
    temperature: 24,
    latencyMs: 24,
    healthScore: 100,
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [equippedBottle, setEquippedBottle] = useState<EquippedBottleSkin | null>(null);
  const metricsRef = useRef(metrics);
  const mountedRef = useRef(true);

  // BLE Connection refs
  const connectedDeviceIdRef = useRef<string | null>(null);
  const telemetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStateRef = useRef<BottleConnectionState>('idle');

  // Reconnection state
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consecutiveLowHealthRef = useRef(0);
  const lastHydrationTimeRef = useRef<number>(0);
  const handleDrinkEventRef = useRef<(amount: number, eventId?: number, timestamp?: number) => Promise<void>>(async () => {});
  const handleBleDisconnectRef = useRef<(() => void) | null>(null);
  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  // Derived values for backward compatibility
  const isConnected = connectionState === 'connected';

  const cancelReconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
  }, []);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelReconnect();
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
        telemetryIntervalRef.current = null;
      }
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
        healthIntervalRef.current = null;
      }
      const deviceId = connectedDeviceIdRef.current;
      if (deviceId && Capacitor.isNativePlatform()) {
        void bleDisconnectDevice(deviceId).catch(err => console.error('Lỗi khi cleanup BLE:', err));
      }
    };
  }, [cancelReconnect]);

  // ── Simulated periodic signal check (demo mode on Web) ─────────

  useEffect(() => {
    if (connectionState !== 'connected' || Capacitor.isNativePlatform()) return;

    consecutiveLowHealthRef.current = 0;

    const interval = setInterval(() => {
      if (connectionState !== 'connected') return;

      setMetrics(prev => {
        const currentRssiPct = Math.max(10, prev.signalStrength - Math.floor(Math.random() * 15) - 2);
        const mockLatency = Math.round(20 + Math.random() * 80);
        const latencyScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, (mockLatency - 100) / 9))));
        const currentScore = Math.round(0.7 * currentRssiPct + 0.3 * latencyScore);

        const nextHealth = Math.round(0.35 * currentScore + 0.65 * (prev.healthScore ?? 100));

        if (nextHealth < 30) {
          consecutiveLowHealthRef.current += 1;
        } else {
          consecutiveLowHealthRef.current = 0;
        }

        return {
          ...prev,
          signalStrength: currentRssiPct,
          latencyMs: mockLatency,
          healthScore: nextHealth,
          batteryLevel: Math.max(15, prev.batteryLevel - Math.floor(Math.random() * 2)),
        };
      });

      // Trigger proactive reconnect on Web Demo as well!
      if (consecutiveLowHealthRef.current >= 3) {
        const timeSinceLastDrink = Date.now() - lastHydrationTimeRef.current;
        if (timeSinceLastDrink > 5000) {
          console.warn(`[MOCK BLE Connection Health] MOCK Health under 30% for 3 consecutive intervals. Triggering mock reconnect.`);
          toast.warning(i18n.t('device.mock_signal_weak'));
          consecutiveLowHealthRef.current = 0;
          handleBleDisconnectRef.current?.();
          scheduleReconnectRef.current?.();
        } else {
          console.log('[MOCK BLE Connection Health] MOCK Low health but suppressed due to recent drink event.');
        }
      }
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // ── BLE Telemetry Polling (battery & temperature) ─────────

  const startTelemetryPolling = useCallback((deviceId: string) => {
    if (telemetryIntervalRef.current) {
      clearInterval(telemetryIntervalRef.current);
    }
    
    const fetchTelemetry = async () => {
      if (!mountedRef.current || connectionStateRef.current !== 'connected') return;
      try {
        const [battery, temp] = await Promise.all([
          readBatteryLevel(deviceId),
          readTemperature(deviceId)
        ]);
        if (mountedRef.current) {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery,
            temperature: temp,
          }));
        }
      } catch (err) {
        console.error('Lỗi đọc telemetry BLE:', err);
      }
    };

    void fetchTelemetry();
    telemetryIntervalRef.current = setInterval(fetchTelemetry, 30000);
  }, []);

  // ── BLE Connection Health Polling (RSSI & Latency) ─────────

  const startHealthPolling = useCallback((deviceId: string) => {
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
    }

    consecutiveLowHealthRef.current = 0;

    const runHealthCheck = async () => {
      if (!mountedRef.current || connectionStateRef.current !== 'connected') return;

      const startTime = performance.now();
      try {
        // 1. Read RSSI
        const rssi = await readRssi(deviceId);
        const latency = Math.round(performance.now() - startTime);

        // 2. Map RSSI percentage (-90 = 0%, -30 = 100%)
        const rssiScore = Math.max(0, Math.min(100, Math.round(((rssi + 90) / 60) * 100)));

        // 3. Map Latency score (100ms = 100%, 1000ms = 0%)
        const latencyScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, (latency - 100) / 9))));

        // 4. Calculate current interval score (70% RSSI, 30% Latency)
        const currentScore = Math.round(0.7 * rssiScore + 0.3 * latencyScore);

        if (mountedRef.current) {
          setMetrics(prev => {
            const lastHealth = prev.healthScore ?? 100;
            // EMA calculation (smoothing alpha = 0.3)
            const nextHealth = Math.round(0.3 * currentScore + 0.7 * lastHealth);
            
            // Check for low health reconnect trigger
            if (nextHealth < 30) {
              consecutiveLowHealthRef.current += 1;
            } else {
              consecutiveLowHealthRef.current = 0;
            }

            return {
              ...prev,
              signalStrength: rssiScore,
              latencyMs: latency,
              healthScore: nextHealth,
            };
          });

          // Check if proactive reconnect is needed
          if (consecutiveLowHealthRef.current >= 3) {
            const timeSinceLastDrink = Date.now() - lastHydrationTimeRef.current;
            if (timeSinceLastDrink > 5000) {
              console.warn(`[BLE Connection Health] Health under 30% for 3 consecutive intervals. Triggering proactive reconnect.`);
              toast.warning(i18n.t('device.signal_weak'));
              consecutiveLowHealthRef.current = 0;
              void (async () => {
                try {
                  await bleDisconnectDevice(deviceId);
                } catch (e) {
                  console.error('Lỗi khi disconnect chủ động:', e);
                }
                handleBleDisconnectRef.current?.();
                scheduleReconnectRef.current?.();
              })();
            } else {
              console.log('[BLE Connection Health] Low health but suppressed due to recent drink event.');
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra sức khỏe kết nối BLE:', err);
        // Treat error as 0 score
        if (mountedRef.current) {
          setMetrics(prev => {
            const lastHealth = prev.healthScore ?? 100;
            const nextHealth = Math.round(0.7 * lastHealth); // Decay health by 30% on error
            
            if (nextHealth < 30) {
              consecutiveLowHealthRef.current += 1;
            } else {
              consecutiveLowHealthRef.current = 0;
            }

            return {
              ...prev,
              healthScore: nextHealth,
              latencyMs: 999,
            };
          });

          if (consecutiveLowHealthRef.current >= 3) {
            const timeSinceLastDrink = Date.now() - lastHydrationTimeRef.current;
            if (timeSinceLastDrink > 5000) {
              console.warn(`[BLE Connection Health] Health under 30% on consecutive errors. Triggering proactive reconnect.`);
              toast.warning(i18n.t('device.signal_lost'));
              consecutiveLowHealthRef.current = 0;
              void (async () => {
                try {
                  await bleDisconnectDevice(deviceId);
                } catch (e) {
                  console.error('Lỗi khi disconnect chủ động:', e);
                }
                handleBleDisconnectRef.current?.();
                scheduleReconnectRef.current?.();
              })();
            }
          }
        }
      }
    };

    // Run first check after 1s, then poll every 10s
    const initialTimeout = setTimeout(runHealthCheck, 1000);
    const interval = setInterval(runHealthCheck, 10000);

    healthIntervalRef.current = interval;

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBleDisconnect = useCallback(() => {
    if (telemetryIntervalRef.current) {
      clearInterval(telemetryIntervalRef.current);
      telemetryIntervalRef.current = null;
    }
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
      healthIntervalRef.current = null;
    }
    connectedDeviceIdRef.current = null;
    if (mountedRef.current) {
      setConnectionState('idle');
      toast.info(i18n.t('device.disconnected'));
    }
  }, []);

  useEffect(() => {
    handleBleDisconnectRef.current = handleBleDisconnect;
  }, [handleBleDisconnect]);

  // ── Reconnection engine ────────────────────────────────

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    const attempt = reconnectAttemptRef.current + 1;

    if (attempt > RECONNECT_MAX_ATTEMPTS) {
      setConnectionState('error');
      setLastError(i18n.t('device.reconnect_failed', { count: RECONNECT_MAX_ATTEMPTS }));
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
        const lastDeviceId = connectedDeviceIdRef.current;
        if (lastDeviceId && Capacitor.isNativePlatform()) {
          await bleConnectDevice(lastDeviceId, () => {
            handleBleDisconnect();
          });

          // Authenticate on reconnect
          const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
          const isAuthSuccess = await authenticateDevice(lastDeviceId, sharedSecret);
          if (!isAuthSuccess) {
            toast.error(i18n.t('device.auth_failed_reconnect'));
            await bleDisconnectDevice(lastDeviceId).catch(() => {});
            handleBleDisconnect();
            if (mountedRef.current) {
              setConnectionState('error');
              setLastError(i18n.t('device.auth_failed_reconnect'));
            }
            setIsSyncing(false);
            return;
          }
          
          if (!mountedRef.current) return;
          setConnectionState('connected');
          setLastError(null);
          cancelReconnect();
          
          await subscribeToHydration(lastDeviceId, async (packet) => {
            // SECURITY CHECK
            if (packet.isSecure) {
              const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
              const headerBuffer = new ArrayBuffer(12);
              const headerView = new DataView(headerBuffer);
              headerView.setUint32(0, packet.amountMl, true);
              headerView.setUint32(4, packet.eventId || 0, true);
              headerView.setUint32(8, packet.timestamp, true);
              const headerBytes = new Uint8Array(headerBuffer);

              const expectedBytes = await computeHmacSha256(headerBytes, sharedSecret);
              const isSignatureValid = safeCompare(packet.signature || new Uint8Array(), expectedBytes);

              if (!isSignatureValid) {
                console.error('Lỗi xác thực chữ ký gói tin BLE! Ngắt kết nối thiết bị.');
                toast.error(i18n.t('device.packet_tampered'));
                void bleDisconnectDevice(lastDeviceId).catch(() => {});
                handleBleDisconnect();
                return;
              }
            } else {
              // Gói 9-byte: cấm ở production cho non-developer
              const isMock = lastDeviceId.startsWith('MOCK-');
              const { data: devCheck } = await supabase.from('profiles').select('is_developer').eq('id', userId).single();
              const isDeveloper = devCheck?.is_developer ?? false;

              if (!isMock && !isDeveloper && Capacitor.isNativePlatform()) {
                console.warn('Giao thức 9-byte không an toàn bị cấm ở production. Ngắt kết nối.');
                toast.error(i18n.t('device.unsafe_protocol'));
                void bleDisconnectDevice(lastDeviceId).catch(() => {});
                handleBleDisconnect();
                return;
              }

              if (!packet.checksumValid) {
                console.warn('Gói tin hydration nhận được từ BLE có checksum không hợp lệ');
                return;
              }
            }

            void handleDrinkEventRef.current(packet.amountMl, packet.eventId, packet.timestamp);
          });
          startTelemetryPolling(lastDeviceId);
          startHealthPolling(lastDeviceId);
        } else {
          // Mock reconnect
          await new Promise(resolve => setTimeout(resolve, 800));
          if (!mountedRef.current) return;

          // Authenticate mock on reconnect
          const mockId = lastDeviceId || 'MOCK-DIGIBOTTLE-01';
          const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
          const isAuthSuccess = await authenticateDevice(mockId, sharedSecret);
          if (!isAuthSuccess) {
            setConnectionState('error');
            setLastError(i18n.t('device.mock_auth_failed'));
            toast.error(i18n.t('device.mock_auth_failed'));
            setIsSyncing(false);
            return;
          }

          setConnectionState('connected');
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.max(20, prev.batteryLevel - 5),
            signalStrength: 90,
            healthScore: 100,
            latencyMs: 24,
          }));
          setLastError(null);
          cancelReconnect();
        }
        setIsSyncing(false);
      } catch {
        if (!mountedRef.current) return;
        scheduleReconnect();
      }
    }, delay);
  }, [cancelReconnect, handleBleDisconnect, startTelemetryPolling, bottleAuthKey, startHealthPolling, userId]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  // ── Database state synchronization ────────────────────────────────

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
          .select('equipped_bottle_id, last_bottle_volume, bottle_auth_key, paired_device_id, last_event_id')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const profileData = data as ProfileBottleState | null;

        const nextVolume =
          profileData?.last_bottle_volume === null || profileData?.last_bottle_volume === undefined
            ? capacity
            : clampVolume(profileData.last_bottle_volume, capacity);

        setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));
        setBottleAuthKey(profileData?.bottle_auth_key ?? null);
        setPairedDeviceId(profileData?.paired_device_id ?? null);
        setLastEventId(Number(profileData?.last_event_id ?? 0));
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

  // ── Core Operations ────────────────────────────────

  const handleDrinkEvent = useCallback(async (amount: number, eventId?: number, timestamp?: number) => {
    if (connectionStateRef.current !== 'connected' || !userId) {
      toast.error(i18n.t('device.not_connected'));
      return;
    }

    lastHydrationTimeRef.current = Date.now();
    setIsSyncing(true);

    const clientEventId = eventId ? `ble-${userId}-${eventId}` : `bottle-${userId}-${Date.now()}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const eventTimeIso = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();

    try {
      const { data, error } = await supabase.rpc('record_hydration_event', {
        p_user_id: userId,
        p_amount_ml: amount,
        p_client_event_id: clientEventId,
        p_name: 'DigiBottle',
        p_day: todayStr,
        p_event_id: eventId ? BigInt(eventId) : null,
        p_event_timestamp: eventTimeIso,
      });

      if (error) {
        if (error.message.includes('Duplicate or replayed') || error.message.includes('Future-dated')) {
          console.warn(`[BLE Replay/Security Blocked]: ${error.message}`);
          toast.warning(i18n.t('device.event_blocked', { message: error.message }));
          return;
        }
        throw error;
      }

      const rpcData = (data ?? {}) as HydrationRpcResponse;
      const nextVolume = clampVolume(metricsRef.current.currentVolume - amount, capacity);

      setMetrics(prev => ({ ...prev, currentVolume: nextVolume }));

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ last_bottle_volume: nextVolume })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Lỗi lưu last_bottle_volume:', profileUpdateError);
        toast.warning(i18n.t('device.sync_warning'));
      }

      if (eventId) {
        setLastEventId(eventId);
      }

      setSyncLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date(eventTimeIso), action: 'drink', amountChange: amount },
        ...prev,
      ]);

      window.dispatchEvent(new CustomEvent(HYDRATION_EVENT_NAME, {
        detail: {
          source: 'smart_bottle',
          amount_ml: amount,
          current_volume: nextVolume,
          added_exp: rpcData.exp_gained ?? 0,
          new_total_exp: rpcData.total_exp ?? 0,
          new_coins: rpcData.coins_gained ?? 0,
          refresh_profile: true,
          refresh_water: true,
          occurred_at: eventTimeIso,
          log_id: rpcData.log_id || clientEventId,
        },
      }));
    } catch (error) {
      console.error('Lỗi xử lý uống nước từ RPC:', error);
      toast.error(i18n.t('device.sync_failed'));

      if (connectionStateRef.current === 'connected') {
        scheduleReconnect();
      }
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, userId, scheduleReconnect]);

  // Update ref after handleDrinkEvent is defined
  useEffect(() => {
    handleDrinkEventRef.current = handleDrinkEvent;
  }, [handleDrinkEvent]);

  const disconnectDevice = useCallback(async () => {
    cancelReconnect();
    const deviceId = connectedDeviceIdRef.current;
    if (deviceId && Capacitor.isNativePlatform()) {
      setIsSyncing(true);
      try {
        await bleDisconnectDevice(deviceId);
      } catch (err) {
        console.error('Lỗi ngắt kết nối BLE:', err);
      }
    }
    handleBleDisconnect();
    setIsSyncing(false);
  }, [cancelReconnect, handleBleDisconnect]);

  // ── Simulator BLE notification dispatcher ──
  const simulateMockBleNotification = useCallback(async (amount: number) => {
    if (connectionStateRef.current !== 'connected') {
      toast.error(i18n.t('device.mock_not_connected'));
      return;
    }

    let eventId = lastEventId + 1;
    if (simulateAttackType === 'replay') {
      eventId = lastEventId; // Replay same event ID
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Build 44-byte buffer
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    view.setUint32(0, amount, true);
    view.setUint32(4, eventId, true);
    view.setUint32(8, timestamp, true);

    const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
    const headerBytes = new Uint8Array(buffer, 0, 12);
    let signatureBytes = await computeHmacSha256(headerBytes, sharedSecret);

    if (simulateAttackType === 'tampering') {
      signatureBytes = new Uint8Array(32); // Send zeros (invalid signature)
    }

    const signatureDest = new Uint8Array(buffer, 12, 32);
    signatureDest.set(signatureBytes);

    console.log(`[MOCK BLE Dispatch] secure packet: amount=${amount}ml, eventId=${eventId}, timestamp=${timestamp}, attack=${simulateAttackType}`);

    const packet = parseSecureHydrationPacket(view);

    // Verify signature in simulation
    if (packet.isSecure) {
      const expectedBytes = await computeHmacSha256(headerBytes, sharedSecret);
      const computedValid = safeCompare(packet.signature || new Uint8Array(), expectedBytes);

      if (!computedValid) {
        console.error('[MOCK BLE Security] Lỗi xác thực chữ ký gói tin mô phỏng! Ngắt kết nối.');
        toast.error('Gói tin mô phỏng bị giả mạo! Ngắt kết nối thiết bị.');
        void disconnectDevice();
        return;
      }
    }

    void handleDrinkEvent(packet.amountMl, packet.eventId, packet.timestamp);
  }, [lastEventId, simulateAttackType, bottleAuthKey, disconnectDevice, handleDrinkEvent]);

  const handleDrinkClick = useCallback(async (amount: number) => {
    if (!Capacitor.isNativePlatform() && connectionStateRef.current === 'connected') {
      await simulateMockBleNotification(amount);
    } else {
      await handleDrinkEvent(amount);
    }
  }, [simulateMockBleNotification, handleDrinkEvent]);

  // Update refs
  useEffect(() => {
    handleDrinkEventRef.current = handleDrinkEvent;
  }, [handleDrinkEvent]);

  const connectDevice = useCallback(async () => {
    if (connectionStateRef.current === 'connected') return;

    cancelReconnect();
    setConnectionState('connecting');
    setIsSyncing(true);
    setLastError(null);

    if (!Capacitor.isNativePlatform()) {
      // Mock connection for Web
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (mountedRef.current) {
          const deviceIdToConnect = pairedDeviceId || _deviceId;
          const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
          const isAuthSuccess = await authenticateDevice(deviceIdToConnect, sharedSecret);
          if (!isAuthSuccess) {
            setConnectionState('error');
            setLastError(i18n.t('device.mock_auth_failed'));
              toast.error(i18n.t('device.mock_auth_failed'));
            setIsSyncing(false);
            return;
          }
          setConnectionState('connected');
          if (!pairedDeviceId && userId) {
            setPairedDeviceId(deviceIdToConnect);
            await supabase.from('profiles').update({ paired_device_id: deviceIdToConnect }).eq('id', userId);
          }
          setMetrics(prev => ({
            ...prev,
            batteryLevel: 85,
            signalStrength: 92,
            temperature: 20,
            healthScore: 100,
            latencyMs: 24,
          }));
          toast.info(i18n.t('device.simulation_connected'));
        }
      } catch {
        if (mountedRef.current) {
          setConnectionState('error');
          setLastError(i18n.t('device.connect_failed_generic'));
        }
      } finally {
        if (mountedRef.current) {
          setIsSyncing(false);
        }
      }
      return;
    }

    // Real Native BLE connection
    try {
      const hasPermission = await requestBlePermissions();
      if (!hasPermission) {
        throw new Error(i18n.t('device.bluetooth_permission_denied'));
      }

      // Auto-connect to paired device
      if (pairedDeviceId) {
        toast.info(i18n.t('device.auto_connecting'));
        try {
          await bleConnectDevice(pairedDeviceId, () => {
            handleBleDisconnect();
          });

          const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
          toast.info(i18n.t('device.authenticating'));
          const isAuthSuccess = await authenticateDevice(pairedDeviceId, sharedSecret);

          if (isAuthSuccess) {
            connectedDeviceIdRef.current = pairedDeviceId;
            setConnectionState('connected');
            setLastError(null);
            toast.success(i18n.t('device.auto_connect_success'));

            await subscribeToHydration(pairedDeviceId, async (packet) => {
              if (packet.isSecure) {
                const headerBuffer = new ArrayBuffer(12);
                const headerView = new DataView(headerBuffer);
                headerView.setUint32(0, packet.amountMl, true);
                headerView.setUint32(4, packet.eventId || 0, true);
                headerView.setUint32(8, packet.timestamp, true);
                const headerBytes = new Uint8Array(headerBuffer);

                const expectedBytes = await computeHmacSha256(headerBytes, sharedSecret);
                const isSignatureValid = safeCompare(packet.signature || new Uint8Array(), expectedBytes);

                if (!isSignatureValid) {
                  console.error('Lỗi xác thực chữ ký gói tin BLE! Ngắt kết nối thiết bị.');
                    toast.error(i18n.t('device.packet_tampered'));
                    void disconnectDevice();
                    return;
                  }
                } else {
                  const isMock = device.id.startsWith('MOCK-');
                  const { data: devCheck } = await supabase.from('profiles').select('is_developer').eq('id', userId).single();
                  const isDeveloper = devCheck?.is_developer ?? false;

                  if (!isMock && !isDeveloper && Capacitor.isNativePlatform()) {
                    console.warn('Giao thức 9-byte không an toàn bị cấm ở production. Ngắt kết nối.');
                    toast.error(i18n.t('device.unsafe_protocol'));
                  void disconnectDevice();
                  return;
                }

                if (!packet.checksumValid) {
                  console.warn('Gói tin hydration nhận được từ BLE có checksum không hợp lệ');
                  return;
                }
              }

              void handleDrinkEventRef.current(packet.amountMl, packet.eventId, packet.timestamp);
            });

            startTelemetryPolling(pairedDeviceId);
            startHealthPolling(pairedDeviceId);
            setIsSyncing(false);
            return;
          } else {
            console.warn('Xác thực thiết bị đã pair thất bại, chuyển sang quét thiết bị.');
            await bleDisconnectDevice(pairedDeviceId).catch(() => {});
          }
        } catch (err) {
          console.warn('Lỗi kết nối tự động bình đã pair:', err);
        }
      }

      let foundDevice = false;
      toast.info(i18n.t('device.scanning'));

      await startScanning((device) => {
        if (foundDevice) return;
        foundDevice = true;

        stopScanning().catch(err => console.error('Lỗi dừng quét BLE:', err));

        void (async () => {
          try {
            toast.info(i18n.t('device.connecting', { name: device.name || 'DigiBottle' }));
            await bleConnectDevice(device.id, () => {
              handleBleDisconnect();
            });

            const sharedSecret = bottleAuthKey || DEFAULT_SHARED_SECRET;
            toast.info(i18n.t('device.authenticating'));
            const isAuthSuccess = await authenticateDevice(device.id, sharedSecret);

            if (!isAuthSuccess) {
              toast.error(i18n.t('device.auth_failed'));
              await bleDisconnectDevice(device.id).catch(() => {});
              handleBleDisconnect();
              if (mountedRef.current) {
                setConnectionState('error');
                setLastError(i18n.t('device.auth_failed'));
              }
              setIsSyncing(false);
              return;
            }

            connectedDeviceIdRef.current = device.id;
            setPairedDeviceId(device.id);
            if (userId) {
              await supabase.from('profiles').update({ paired_device_id: device.id }).eq('id', userId);
            }

            if (mountedRef.current) {
              setConnectionState('connected');
              setLastError(null);
              toast.success(i18n.t('device.connected', { name: device.name || 'DigiBottle' }));

              await subscribeToHydration(device.id, async (packet) => {
                if (packet.isSecure) {
                  const headerBuffer = new ArrayBuffer(12);
                  const headerView = new DataView(headerBuffer);
                  headerView.setUint32(0, packet.amountMl, true);
                  headerView.setUint32(4, packet.eventId || 0, true);
                  headerView.setUint32(8, packet.timestamp, true);
                  const headerBytes = new Uint8Array(headerBuffer);

                  const expectedBytes = await computeHmacSha256(headerBytes, sharedSecret);
                  const isSignatureValid = safeCompare(packet.signature || new Uint8Array(), expectedBytes);

                  if (!isSignatureValid) {
                    console.error('Lỗi xác thực chữ ký gói tin BLE! Ngắt kết nối thiết bị.');
                    toast.error(i18n.t('device.packet_tampered'));
                    void disconnectDevice();
                    return;
                  }
                } else {
                  const isMock = device.id.startsWith('MOCK-');
                  const { data: devCheck } = await supabase.from('profiles').select('is_developer').eq('id', userId).single();
                  const isDeveloper = devCheck?.is_developer ?? false;

                  if (!isMock && !isDeveloper && Capacitor.isNativePlatform()) {
                    console.warn('Giao thức 9-byte không an toàn bị cấm ở production. Ngắt kết nối.');
                    toast.error(i18n.t('device.unsafe_protocol'));
                    void disconnectDevice();
                    return;
                  }

                  if (!packet.checksumValid) {
                    console.warn('Gói tin hydration nhận được từ BLE có checksum không hợp lệ');
                    return;
                  }
                }

                void handleDrinkEventRef.current(packet.amountMl, packet.eventId, packet.timestamp);
              });

              startTelemetryPolling(device.id);
              startHealthPolling(device.id);
            }
          } catch (err) {
            console.error('Lỗi kết nối BLE native:', err);
            if (mountedRef.current) {
              setConnectionState('error');
              setLastError(i18n.t('device.cannot_connect'));
            }
          } finally {
            if (mountedRef.current) {
              setIsSyncing(false);
            }
          }
        })();
      });

      setTimeout(() => {
        if (!foundDevice) {
          stopScanning().catch(() => {});
          if (mountedRef.current && connectionStateRef.current === 'connecting') {
            setConnectionState('error');
            setLastError(i18n.t('device.device_not_found_scan'));
            setIsSyncing(false);
            toast.error(i18n.t('device.not_found'));
          }
        }
      }, 10000);

    } catch (err) {
      console.error('Lỗi thiết lập BLE native:', err);
      if (mountedRef.current) {
        setConnectionState('error');
        setLastError(err instanceof Error ? err.message : i18n.t('device.connection_setup_error'));
        setIsSyncing(false);
      }
    }
  }, [cancelReconnect, handleBleDisconnect, startTelemetryPolling, bottleAuthKey, startHealthPolling, _deviceId, pairedDeviceId, userId, disconnectDevice]);

  const retryConnection = useCallback(() => {
    setConnectionState('idle');
    setLastError(null);
    reconnectAttemptRef.current = 0;
    void connectDevice();
  }, [connectDevice]);

  const refillBottle = useCallback(async () => {
    if (connectionStateRef.current !== 'connected' || !userId) return;

    setIsSyncing(true);

    try {
      setMetrics(prev => ({ ...prev, currentVolume: capacity }));
      const { error } = await supabase.from('profiles').update({ last_bottle_volume: capacity }).eq('id', userId);
      if (error) throw error;
      setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'refill' }, ...prev]);
      toast.success(i18n.t('device.water_filled'));
    } catch (err) {
      console.error(err);
      toast.error(i18n.t('device.fill_update_failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [capacity, userId]);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), action: 'sync' }, ...prev]);
    
    const deviceId = connectedDeviceIdRef.current;
    if (deviceId && Capacitor.isNativePlatform()) {
      try {
        const [battery, temp] = await Promise.all([
          readBatteryLevel(deviceId),
          readTemperature(deviceId)
        ]);
        setMetrics(prev => ({
          ...prev,
          batteryLevel: battery,
          temperature: temp
        }));
        toast.success(i18n.t('device.params_synced'));
      } catch (err) {
        console.error(err);
        toast.error(i18n.t('device.params_sync_failed'));
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(i18n.t('device.simulation_synced'));
    }
    
    setIsSyncing(false);
  }, []);

  const unpairDevice = useCallback(async () => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ paired_device_id: null, last_event_id: 0 })
        .eq('id', userId);
      if (error) throw error;
      setPairedDeviceId(null);
      setLastEventId(0);
      toast.success(i18n.t('device.unlinked'));
      if (connectionStateRef.current === 'connected') {
        await disconnectDevice();
      }
    } catch (err) {
      console.error('Lỗi khi hủy liên kết bình nước:', err);
      toast.error(i18n.t('device.unlink_failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [userId, disconnectDevice]);

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
    handleDrinkEvent: handleDrinkClick,
    refillBottle,
    forceSync,
    equippedBottle,
    isDemoMode: !Capacitor.isNativePlatform(),
    pairedDeviceId,
    lastEventId,
    simulateAttackType,
    setSimulateAttackType,
    unpairDevice,
    bottleAuthKey,
  };
};
