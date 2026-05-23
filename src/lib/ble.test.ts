import { describe, it, expect } from 'vitest';
import {
  calculateXorChecksum,
  parseHydrationPacket,
  parseTemperature,
  parseBattery,
  computeHmacSha256,
  safeCompare,
  authenticateDevice,
  readRssi,
} from '@/lib/ble';

describe('BLE Parser Utilities', () => {
  describe('calculateXorChecksum', () => {
    it('correctly calculates XOR checksum of the first 8 bytes', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      
      // Setup bytes: [1, 2, 3, 4, 5, 6, 7, 8]
      // XOR sum: 1 ^ 2 ^ 3 ^ 4 ^ 5 ^ 6 ^ 7 ^ 8
      // 1^2 = 3
      // 3^3 = 0
      // 0^4 = 4
      // 4^5 = 1
      // 1^6 = 7
      // 7^7 = 0
      // 0^8 = 8
      for (let i = 0; i < 8; i++) {
        view.setUint8(i, i + 1);
      }
      
      expect(calculateXorChecksum(view)).toBe(8);
    });

    it('handles all zeros', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      expect(calculateXorChecksum(view)).toBe(0);
    });
  });

  describe('parseHydrationPacket', () => {
    it('successfully parses a valid 9-byte packet', () => {
      const buffer = new ArrayBuffer(9);
      const view = new DataView(buffer);
      
      const amount = 350; // 350 ml
      const timestamp = 1716382000; // Epoch timestamp
      
      view.setUint32(0, amount, true); // true = Little-Endian
      view.setUint32(4, timestamp, true); // true = Little-Endian
      
      // Calculate checksum manually
      let expectedChecksum = 0;
      for (let i = 0; i < 8; i++) {
        expectedChecksum ^= view.getUint8(i);
      }
      view.setUint8(8, expectedChecksum);

      const result = parseHydrationPacket(view);
      
      expect(result.amountMl).toBe(amount);
      expect(result.timestamp).toBe(timestamp);
      expect(result.checksumValid).toBe(true);
    });

    it('identifies invalid XOR checksum', () => {
      const buffer = new ArrayBuffer(9);
      const view = new DataView(buffer);
      
      view.setUint32(0, 500, true);
      view.setUint32(4, 1716382000, true);
      
      // Set wrong checksum
      view.setUint8(8, 99); 

      const result = parseHydrationPacket(view);
      
      expect(result.amountMl).toBe(500);
      expect(result.timestamp).toBe(1716382000);
      expect(result.checksumValid).toBe(false);
    });

    it('throws an error if package is less than 9 bytes', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      
      expect(() => parseHydrationPacket(view)).toThrowError(
        'Hydration packet must be at least 9 bytes long'
      );
    });
  });

  describe('parseTemperature', () => {
    it('parses a valid positive temperature (int16 Little-Endian)', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      
      // 25.4 Celsius is transmitted as 254
      view.setInt16(0, 254, true);
      
      expect(parseTemperature(view)).toBe(25.4);
    });

    it('parses a valid negative temperature', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      
      // -5.2 Celsius is transmitted as -52
      view.setInt16(0, -52, true);
      
      expect(parseTemperature(view)).toBe(-5.2);
    });

    it('throws an error if temperature packet is less than 2 bytes', () => {
      const buffer = new ArrayBuffer(1);
      const view = new DataView(buffer);
      
      expect(() => parseTemperature(view)).toThrowError(
        'Temperature data must be at least 2 bytes long'
      );
    });
  });

  describe('parseBattery', () => {
    it('parses a valid 1-byte battery level', () => {
      const buffer = new ArrayBuffer(1);
      const view = new DataView(buffer);
      
      view.setUint8(0, 85);
      
      expect(parseBattery(view)).toBe(85);
    });

    it('throws an error if battery packet is less than 1 byte', () => {
      const buffer = new ArrayBuffer(0);
      const view = new DataView(buffer);
      
      expect(() => parseBattery(view)).toThrowError(
        'Battery data must be at least 1 byte long'
      );
    });
  });

  describe('BLE Security & Authentication', () => {
    describe('computeHmacSha256', () => {
      it('correctly computes HMAC-SHA256 matching standard test vector', async () => {
        const encoder = new TextEncoder();
        const message = encoder.encode('hello');
        const secret = 'secret';
        
        const hmac = await computeHmacSha256(message, secret);
        
        // Convert to hex
        const hmacHex = Array.from(hmac)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
          
        expect(hmacHex).toBe('88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b');
      });
    });

    describe('safeCompare', () => {
      it('returns true for identical byte arrays', () => {
        const a = new Uint8Array([1, 2, 3, 4, 5]);
        const b = new Uint8Array([1, 2, 3, 4, 5]);
        expect(safeCompare(a, b)).toBe(true);
      });

      it('returns false for arrays of different content', () => {
        const a = new Uint8Array([1, 2, 3, 4, 5]);
        const b = new Uint8Array([1, 2, 3, 4, 6]);
        expect(safeCompare(a, b)).toBe(false);
      });

      it('returns false for arrays of different lengths', () => {
        const a = new Uint8Array([1, 2, 3, 4]);
        const b = new Uint8Array([1, 2, 3, 4, 5]);
        expect(safeCompare(a, b)).toBe(false);
      });
    });

    describe('authenticateDevice (Mock Mode)', () => {
      it('authenticates successfully for standard mock device ID', async () => {
        const result = await authenticateDevice('MOCK-DIGIBOTTLE-01', 'secret');
        expect(result).toBe(true);
      });

      it('fails authentication for specifically designed mock fail ID', async () => {
        const result = await authenticateDevice('MOCK-DIGIBOTTLE-FAIL-AUTH', 'secret');
        expect(result).toBe(false);
      });
    });
  });

  describe('BLE Connection Health', () => {
    describe('readRssi (Mock Mode)', () => {
      it('returns a mock RSSI value within typical range (-85 to -45 dBm)', async () => {
        const rssi = await readRssi('MOCK-DEVICE');
        expect(rssi).toBeGreaterThanOrEqual(-85);
        expect(rssi).toBeLessThanOrEqual(-45);
      });
    });
  });
});
