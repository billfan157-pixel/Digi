import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

// Custom DigiBottle BLE GATT profile constants
export const BOTTLE_SERVICE_UUID = 'd3b00000-e8f2-537e-4f6c-d104768a1214';
export const HYDRATION_CHAR_UUID = 'd3b00001-e8f2-537e-4f6c-d104768a1214';
export const AUTH_CHAR_UUID = 'd3b00002-e8f2-537e-4f6c-d104768a1214';
export const DEFAULT_SHARED_SECRET = 'digibottle-secret-v0.1';

// Standard Bluetooth GATT services/characteristics
export const BATTERY_SERVICE_UUID = numberToUUID(0x180f);
export const BATTERY_CHAR_UUID = numberToUUID(0x2a19);

export const TEMP_SERVICE_UUID = numberToUUID(0x1809); // Health Thermometer
export const TEMP_CHAR_UUID = numberToUUID(0x2a6e); // Temperature characteristic

export interface HydrationPacket {
  amountMl: number;
  timestamp: number;
  checksumValid: boolean;
  eventId?: number;
  isSecure?: boolean;
  signature?: Uint8Array;
}

/**
 * Computes a 1-byte XOR checksum of the first 8 bytes.
 * packet[8] should equal XOR sum of packet[0..7].
 */
export function calculateXorChecksum(dataView: DataView): number {
  let checksum = 0;
  for (let i = 0; i < 8; i++) {
    checksum ^= dataView.getUint8(i);
  }
  return checksum;
}

/**
 * Parses a 9-byte hydration packet in Little-Endian format.
 * Format:
 * - Bytes 0-3: amount_ml (uint32, Little-Endian)
 * - Bytes 4-7: epoch_timestamp (uint32, Little-Endian)
 * - Byte 8: XOR checksum (uint8)
 */
export function parseHydrationPacket(dataView: DataView): HydrationPacket {
  if (dataView.byteLength < 9) {
    throw new Error('Hydration packet must be at least 9 bytes long');
  }

  const amountMl = dataView.getUint32(0, true); // true = Little-Endian
  const timestamp = dataView.getUint32(4, true); // true = Little-Endian
  const expectedChecksum = dataView.getUint8(8);
  const actualChecksum = calculateXorChecksum(dataView);

  return {
    amountMl,
    timestamp,
    checksumValid: expectedChecksum === actualChecksum,
  };
}

/**
 * Parses a 44-byte secure hydration packet.
 * Format:
 * - Bytes 0-3: amountMl (uint32, Little-Endian)
 * - Bytes 4-7: eventId (uint32, Little-Endian, sequence counter)
 * - Bytes 8-11: timestamp (uint32, Little-Endian, epoch seconds)
 * - Bytes 12-43: HMAC-SHA256 signature (32 bytes)
 */
export function parseSecureHydrationPacket(dataView: DataView): HydrationPacket {
  if (dataView.byteLength < 44) {
    throw new Error('Secure hydration packet must be at least 44 bytes long');
  }

  const amountMl = dataView.getUint32(0, true);
  const eventId = dataView.getUint32(4, true);
  const timestamp = dataView.getUint32(8, true);

  const signature = new Uint8Array(
    dataView.buffer,
    dataView.byteOffset + 12,
    32
  );

  return {
    amountMl,
    timestamp,
    checksumValid: true, // Verified separately using computeHmacSha256 in hook
    eventId,
    isSecure: true,
    signature,
  };
}

/**
 * Parses a 2-byte temperature value in Celsius * 10 (int16, Little-Endian).
 */
export function parseTemperature(dataView: DataView): number {
  if (dataView.byteLength < 2) {
    throw new Error('Temperature data must be at least 2 bytes long');
  }
  const rawTemp = dataView.getInt16(0, true); // true = Little-Endian
  return rawTemp / 10.0;
}

/**
 * Parses a 1-byte battery level (uint8, 0-100).
 */
export function parseBattery(dataView: DataView): number {
  if (dataView.byteLength < 1) {
    throw new Error('Battery data must be at least 1 byte long');
  }
  return dataView.getUint8(0);
}

// ── Native BLE Skeleton Functions (Implemented for web mock fallback) ──

let isInitialized = false;

async function ensureInitialized(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  if (isInitialized) return true;
  try {
    await BleClient.initialize();
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('Không thể khởi tạo BleClient:', err);
    return false;
  }
}

export async function checkBlePermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    await ensureInitialized();
    // Capacitor BLE does not expose a direct "check permissions" check without scanning,
    // but we check if BleClient is loaded.
    return true;
  } catch {
    return false;
  }
}

export async function requestBlePermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    await ensureInitialized();
    // Triggers permission requests dynamically inside the native Capacitor library on scan
    return true;
  } catch {
    return false;
  }
}

export async function startScanning(
  onDeviceFound: (device: { id: string; name?: string }) => void
): Promise<void> {
  const native = await ensureInitialized();
  if (!native) {
    console.log('[MOCK BLE] Bắt đầu quét thiết bị...');
    // Mock device found after 1 second
    setTimeout(() => {
      onDeviceFound({ id: 'MOCK-DIGIBOTTLE-01', name: 'DigiBottle Prototype v0.1' });
    }, 1000);
    return;
  }

  try {
    await BleClient.requestLEScan(
      {
        services: [BOTTLE_SERVICE_UUID],
      },
      (result) => {
        onDeviceFound({
          id: result.device.deviceId,
          name: result.device.name || 'DigiBottle',
        });
      }
    );
  } catch (err) {
    console.error('Lỗi khi quét BLE:', err);
    throw err;
  }
}

export async function stopScanning(): Promise<void> {
  const native = isInitialized;
  if (!native) {
    console.log('[MOCK BLE] Dừng quét thiết bị.');
    return;
  }
  try {
    await BleClient.stopLEScan();
  } catch (err) {
    console.error('Lỗi khi dừng quét BLE:', err);
  }
}

export async function connectDevice(
  deviceId: string,
  onDisconnect: () => void
): Promise<void> {
  const native = await ensureInitialized();
  if (!native) {
    console.log(`[MOCK BLE] Đang kết nối tới ${deviceId}...`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`[MOCK BLE] Đã kết nối tới ${deviceId}`);
    return;
  }

  try {
    await BleClient.connect(deviceId, onDisconnect);
  } catch (err) {
    console.error(`Lỗi kết nối tới thiết bị ${deviceId}:`, err);
    throw err;
  }
}

export async function disconnectDevice(deviceId: string): Promise<void> {
  const native = isInitialized;
  if (!native) {
    console.log(`[MOCK BLE] Ngắt kết nối khỏi ${deviceId}`);
    return;
  }
  try {
    await BleClient.disconnect(deviceId);
  } catch (err) {
    console.error(`Lỗi ngắt kết nối thiết bị ${deviceId}:`, err);
  }
}

export async function subscribeToHydration(
  deviceId: string,
  onHydrationEvent: (packet: HydrationPacket) => void
): Promise<void> {
  const native = isInitialized;
  if (!native) {
    console.log(`[MOCK BLE] Đã đăng ký nhận dữ liệu lượng nước từ ${deviceId}`);
    return;
  }

  try {
    await BleClient.startNotifications(
      deviceId,
      BOTTLE_SERVICE_UUID,
      HYDRATION_CHAR_UUID,
      (value) => {
        try {
          const packet = value.byteLength >= 44
            ? parseSecureHydrationPacket(value)
            : parseHydrationPacket(value);
          onHydrationEvent(packet);
        } catch (err) {
          console.error('Lỗi phân tích gói tin hydration từ notification:', err);
        }
      }
    );
  } catch (err) {
    console.error(`Lỗi đăng ký notification cho ${deviceId}:`, err);
    throw err;
  }
}

export async function readBatteryLevel(deviceId: string): Promise<number> {
  const native = isInitialized;
  if (!native) {
    return 100;
  }
  try {
    const value = await BleClient.read(deviceId, BATTERY_SERVICE_UUID, BATTERY_CHAR_UUID);
    return parseBattery(value);
  } catch (err) {
    console.error('Lỗi khi đọc pin BLE:', err);
    throw err;
  }
}

export async function readTemperature(deviceId: string): Promise<number> {
  const native = isInitialized;
  if (!native) {
    return 24;
  }
  try {
    const value = await BleClient.read(deviceId, TEMP_SERVICE_UUID, TEMP_CHAR_UUID);
    return parseTemperature(value);
  } catch (err) {
    console.error('Lỗi khi đọc nhiệt độ BLE:', err);
    throw err;
  }
}

/**
 * Computes HMAC-SHA256 of message using Web Crypto API.
 */
export async function computeHmacSha256(message: Uint8Array, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message as unknown as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Constant-time comparison of two Uint8Arrays to prevent timing attacks.
 */
export function safeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Challenge-Response Authentication (Software Side)
 * Returns true if the device responds with correct HMAC-SHA256 of a random challenge.
 */
export async function authenticateDevice(
  deviceId: string,
  sharedSecret: string
): Promise<boolean> {
  const native = await ensureInitialized();
  if (!native) {
    console.log(`[MOCK BLE] Đang xác thực thiết bị ${deviceId}...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (deviceId === 'MOCK-DIGIBOTTLE-FAIL-AUTH') {
      console.log(`[MOCK BLE] Xác thực thất bại cho ${deviceId}`);
      return false;
    }
    console.log(`[MOCK BLE] Xác thực thành công cho ${deviceId}`);
    return true;
  }

  try {
    // 1. Generate a 16-byte random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(16));
    
    // 2. Write challenge to device
    const challengeView = new DataView(challenge.buffer);
    await BleClient.write(
      deviceId,
      BOTTLE_SERVICE_UUID,
      AUTH_CHAR_UUID,
      challengeView
    );

    // 3. Read response from device (should be 32 bytes for HMAC-SHA256)
    const responseView = await BleClient.read(
      deviceId,
      BOTTLE_SERVICE_UUID,
      AUTH_CHAR_UUID
    );

    // 4. Convert response to Uint8Array
    const responseBytes = new Uint8Array(
      responseView.buffer,
      responseView.byteOffset,
      responseView.byteLength
    );

    // 5. Compute expected HMAC
    const expectedBytes = await computeHmacSha256(challenge, sharedSecret);

    // 6. Verify HMAC in constant time
    const isValid = safeCompare(responseBytes, expectedBytes);
    return isValid;
  } catch (err) {
    console.error(`Lỗi xác thực thiết bị ${deviceId}:`, err);
    return false;
  }
}

/**
 * Reads Received Signal Strength Indicator (RSSI) of connected device.
 */
export async function readRssi(deviceId: string): Promise<number> {
  const native = isInitialized;
  if (!native) {
    // Mock RSSI: return a random signal between -85 and -45
    const baseRssi = -45 - Math.floor(Math.random() * 40);
    return baseRssi;
  }
  try {
    return await BleClient.readRssi(deviceId);
  } catch (err) {
    console.error(`Lỗi đọc RSSI cho ${deviceId}:`, err);
    throw err;
  }
}


