import { describe, it, expect } from 'vitest';
import { isRealUser, toDateStr, normalizeRow } from './useWaterData';
import { calculateWaterTotal, buildPendingWaterSyncKey, getWaterEntriesStorageKey } from '@/lib/waterStorage';
import type { WaterEntry } from '@/lib/waterStorage';

describe('isRealUser', () => {
  it('returns true for string with length >= 30', () => {
    expect(isRealUser('a'.repeat(30))).toBe(true);
    expect(isRealUser('a'.repeat(35))).toBe(true);
  });

  it('returns false for string with length < 30', () => {
    expect(isRealUser('short')).toBe(false);
    expect(isRealUser('')).toBe(false);
  });

  it('returns false for non-string types', () => {
    expect(isRealUser(null)).toBe(false);
    expect(isRealUser(undefined)).toBe(false);
    expect(isRealUser(123)).toBe(false);
    expect(isRealUser({})).toBe(false);
  });
});

describe('toDateStr', () => {
  it('formats date to YYYY-MM-DD', () => {
    const d = new Date(2024, 0, 15);
    expect(toDateStr(d)).toBe('2024-01-15');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2024, 2, 5);
    expect(toDateStr(d)).toBe('2024-03-05');
  });

  it('handles December', () => {
    const d = new Date(2024, 11, 31);
    expect(toDateStr(d)).toBe('2024-12-31');
  });
});

describe('normalizeRow', () => {
  it('transforms complete row correctly', () => {
    const row = {
      id: 'abc-123',
      user_id: 'user-1',
      amount: 250,
      name: 'Trà xanh',
      day: '2024-06-15',
      exp: 25,
      created_at: '2024-06-15T10:00:00Z',
    };
    const result = normalizeRow(row);
    expect(result.id).toBe('abc-123');
    expect(result.user_id).toBe('user-1');
    expect(result.amount).toBe(250);
    expect(result.name).toBe('Trà xanh');
    expect(result.day).toBe('2024-06-15');
    expect(result.exp).toBe(25);
    expect(result.created_at).toBe('2024-06-15T10:00:00Z');
  });

  it('provides defaults for missing fields', () => {
    const row: Record<string, unknown> = {};
    const result = normalizeRow(row);
    expect(result.id).toBeTruthy();
    expect(result.user_id).toBe('');
    expect(result.amount).toBe(0);
    expect(result.name).toBe('Nuoc Loc');
    expect(result.exp).toBe(0);
    expect(result.created_at).toBeTruthy();
  });

  it('coerces numeric strings to numbers', () => {
    const row = { amount: '500', exp: '50' };
    const result = normalizeRow(row);
    expect(result.amount).toBe(500);
    expect(result.exp).toBe(50);
  });
});

describe('calculateWaterTotal', () => {
  it('sums amounts from entries', () => {
    const entries: WaterEntry[] = [
      { id: '1', amount: 250, timestamp: 1000 },
      { id: '2', amount: 500, timestamp: 2000 },
    ];
    expect(calculateWaterTotal(entries)).toBe(750);
  });

  it('prefers actual_ml over amount', () => {
    const entries: WaterEntry[] = [
      { id: '1', amount: 250, actual_ml: 300, timestamp: 1000 },
    ];
    expect(calculateWaterTotal(entries)).toBe(300);
  });

  it('returns 0 for empty array', () => {
    expect(calculateWaterTotal([])).toBe(0);
  });

  it('does not return negative', () => {
    const entries: WaterEntry[] = [
      { id: '1', amount: -100, timestamp: 1000 },
    ];
    expect(calculateWaterTotal(entries)).toBe(0);
  });
});

describe('buildPendingWaterSyncKey', () => {
  it('combines userId and day with colon', () => {
    expect(buildPendingWaterSyncKey('user-1', '2024-06-15')).toBe('user-1:2024-06-15');
  });
});

describe('getWaterEntriesStorageKey', () => {
  it('formats key with userId and day', () => {
    expect(getWaterEntriesStorageKey('user-1', '2024-06-15')).toBe('digiwell_entries_user-1_2024-06-15');
  });
});
