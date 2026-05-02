import type { ActivityLevel, Climate } from './HydrationEngine';

const stripDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeLookupKey = (value: string) =>
  stripDiacritics(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const ACTIVITY_ALIASES: Record<string, ActivityLevel> = {
  sedentary: 'sedentary',
  light: 'light',
  moderate: 'moderate',
  high: 'high',
  athlete: 'athlete',
  active: 'high',
  normal: 'moderate',
  'binh thuong': 'moderate',
  'it van dong': 'sedentary',
  'it van dong (van phong)': 'sedentary',
  'van dong nhe': 'light',
  'di bo': 'light',
  'van dong vua': 'moderate',
  '3-5 buoi/tuan': 'moderate',
  'van dong cao': 'high',
  'hang ngay': 'high',
  'van dong vien': 'athlete',
};

const CLIMATE_ALIASES: Record<string, Climate> = {
  cold: 'cold',
  temperate: 'temperate',
  warm: 'warm',
  hot: 'hot',
  tropical: 'tropical',
  'on hoa': 'temperate',
  'mat me': 'temperate',
  '20-26c': 'temperate',
  'nong am': 'warm',
  '26-32c': 'warm',
  nong: 'hot',
  'rat nong': 'hot',
  '32-38c': 'hot',
  'nhiet doi': 'tropical',
  'nhiet doi (nong)': 'tropical',
  'nhiet doi nong am': 'tropical',
  'lanh': 'cold',
  'lanh (< 20c)': 'cold',
};

export function normalizeActivity(value: unknown, fallback: ActivityLevel = 'moderate'): ActivityLevel {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return ACTIVITY_ALIASES[normalizeLookupKey(value)] ?? fallback;
}

export function normalizeClimate(value: unknown, fallback: Climate = 'temperate'): Climate {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return CLIMATE_ALIASES[normalizeLookupKey(value)] ?? fallback;
}

export function normalizeProfileEnums<T extends { activity?: unknown; climate?: unknown }>(profile: T) {
  return {
    ...profile,
    activity: normalizeActivity(profile.activity),
    climate: normalizeClimate(profile.climate),
  };
}

export function getProfileEnumPatch(profile: { activity?: unknown; climate?: unknown }) {
  const normalizedActivity = normalizeActivity(profile.activity);
  const normalizedClimate = normalizeClimate(profile.climate);
  const patch: Partial<{ activity: ActivityLevel; climate: Climate }> = {};

  if (profile.activity !== normalizedActivity) {
    patch.activity = normalizedActivity;
  }

  if (profile.climate !== normalizedClimate) {
    patch.climate = normalizedClimate;
  }

  return patch;
}
