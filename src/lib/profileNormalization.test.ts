import { describe, it, expect } from 'vitest';
import { normalizeActivity, normalizeClimate, normalizeProfileEnums, getProfileEnumPatch } from './profileNormalization';

describe('normalizeActivity', () => {
  it('maps English aliases correctly', () => {
    expect(normalizeActivity('sedentary')).toBe('sedentary');
    expect(normalizeActivity('light')).toBe('light');
    expect(normalizeActivity('moderate')).toBe('moderate');
    expect(normalizeActivity('high')).toBe('high');
    expect(normalizeActivity('athlete')).toBe('athlete');
  });

  it('maps Vietnamese alias keys (non-diacritic) correctly', () => {
    expect(normalizeActivity('it van dong')).toBe('sedentary');
    expect(normalizeActivity('van dong nhe')).toBe('light');
    expect(normalizeActivity('van dong vua')).toBe('moderate');
    expect(normalizeActivity('van dong cao')).toBe('high');
    expect(normalizeActivity('van dong vien')).toBe('athlete');
  });

  it('maps synonyms correctly', () => {
    expect(normalizeActivity('active')).toBe('high');
    expect(normalizeActivity('normal')).toBe('moderate');
    expect(normalizeActivity('hang ngay')).toBe('high');
    expect(normalizeActivity('3-5 buoi/tuan')).toBe('moderate');
  });

  it('handles case-insensitive input', () => {
    expect(normalizeActivity('  LIGHT  ')).toBe('light');
  });

  it('returns fallback for unknown values', () => {
    expect(normalizeActivity('unknown_value', 'sedentary')).toBe('sedentary');
    expect(normalizeActivity('xyz', 'athlete')).toBe('athlete');
  });

  it('returns fallback for empty/null/undefined', () => {
    expect(normalizeActivity('')).toBe('moderate');
    expect(normalizeActivity(null)).toBe('moderate');
    expect(normalizeActivity(undefined)).toBe('moderate');
    expect(normalizeActivity(123)).toBe('moderate');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeActivity('  SEDENTARY  ')).toBe('sedentary');
  });
});

describe('normalizeClimate', () => {
  it('maps English climate values', () => {
    expect(normalizeClimate('cold')).toBe('cold');
    expect(normalizeClimate('temperate')).toBe('temperate');
    expect(normalizeClimate('warm')).toBe('warm');
    expect(normalizeClimate('hot')).toBe('hot');
    expect(normalizeClimate('tropical')).toBe('tropical');
  });

  it('maps Vietnamese alias keys correctly', () => {
    expect(normalizeClimate('on hoa')).toBe('temperate');
    expect(normalizeClimate('nong am')).toBe('warm');
    expect(normalizeClimate('nhiet doi')).toBe('tropical');
    expect(normalizeClimate('lanh')).toBe('cold');
  });

  it('maps temperature range strings', () => {
    expect(normalizeClimate('20-26C')).toBe('temperate');
    expect(normalizeClimate('26-32C')).toBe('warm');
    expect(normalizeClimate('32-38C')).toBe('hot');
  });

  it('returns fallback for unknown values', () => {
    expect(normalizeClimate('mars', 'hot')).toBe('hot');
  });

  it('returns fallback for empty/null', () => {
    expect(normalizeClimate('')).toBe('temperate');
    expect(normalizeClimate(null)).toBe('temperate');
  });
});

describe('normalizeProfileEnums', () => {
  it('normalizes activity and climate fields', () => {
    const result = normalizeProfileEnums({ activity: 'it van dong', climate: 'nhiet doi' });
    expect(result.activity).toBe('sedentary');
    expect(result.climate).toBe('tropical');
  });

  it('preserves other profile fields', () => {
    const result = normalizeProfileEnums({ activity: 'high', climate: 'cold', nickname: 'Test', age: 25 });
    expect(result.nickname).toBe('Test');
    expect(result.age).toBe(25);
  });
});

describe('getProfileEnumPatch', () => {
  it('returns empty patch when already normalized', () => {
    const patch = getProfileEnumPatch({ activity: 'moderate', climate: 'temperate' });
    expect(patch).toEqual({});
  });

  it('returns patch with normalized values when mismatch', () => {
    const patch = getProfileEnumPatch({ activity: 'it van dong', climate: 'temperate' });
    expect(patch).toEqual({ activity: 'sedentary' });
  });

  it('normalizes both fields when needed', () => {
    const patch = getProfileEnumPatch({ activity: 'active', climate: 'nong am' });
    expect(patch).toEqual({ activity: 'high', climate: 'warm' });
  });
});
