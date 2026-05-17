import { Capacitor } from '@capacitor/core';
import { AccessControl, NativeBiometric } from '@capgo/capacitor-native-biometric';

import { AppStorage } from '@/lib/storage';

const LEGACY_GOOGLE_PROVIDER_TOKEN_KEY = 'google_provider_token'; // Kept for one-time cleanup only
const LEGACY_BIOMETRIC_KEY = 'biometric_enabled';
const LEGACY_CACHED_PROFILE_KEY = 'cached_profile';
const LEGACY_FEED_CACHE_KEY = 'digiwell_feed_cache';

const LEGACY_GOOGLE_PROVIDER_TOKEN_PREFIX = 'digiwell_google_provider_token_'; // Kept for one-time cleanup only
const BIOMETRIC_ENABLED_PREFIX = 'digiwell_biometric_enabled_';
const CACHED_PROFILE_PREFIX = 'digiwell_cached_profile_';
const FEED_CACHE_PREFIX = 'digiwell_feed_cache_';

const USER_SCOPED_EXACT_KEYS = [
  'digiwell_prefs_',
  'digiwell_settings_',
  'digiwell_reminders_',
  'digiwell_custom_schedule_',
  'digiwell_fasting_plan_',
  'digiwell_fasting_start_',
  'digiwell_user_challenges_cache_',
  'digiwell_quests_cache_',
  'digiwell_last_spin_',
  'digiwell_offline_water_queue_',
  'digiwell_onboarded_',
];

const USER_SCOPED_PREFIX_KEYS = [
  'digiwell_entries_',
];

const GLOBAL_SESSION_KEYS = [
  'digiwell_pending_calendar_oauth',
  'digiwell_calendar_oauth_mode',
  'digiwell_pending_hydration_actions',
  'digiwell_last_active_hydration_user_id',
  'digiwell_strava_token',
  'digiwell_widget_sync',
  LEGACY_GOOGLE_PROVIDER_TOKEN_KEY,
  LEGACY_BIOMETRIC_KEY,
  LEGACY_CACHED_PROFILE_KEY,
  LEGACY_FEED_CACHE_KEY,
];

const secureServerKey = (namespace: string, userId: string) => `digiwell.${namespace}.${userId}`;
const getSessionStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage);


export const getBiometricEnabledStorageKey = (userId: string) => `${BIOMETRIC_ENABLED_PREFIX}${userId}`;
export const getCachedProfileStorageKey = (userId: string) => `${CACHED_PROFILE_PREFIX}${userId}`;
export const getFeedCacheStorageKey = (userId: string) => `${FEED_CACHE_PREFIX}${userId}`;

async function secureSetValue(server: string, username: string, value: string, webStorage: 'local' | 'session' = 'local') {
  if (!Capacitor.isNativePlatform()) {
    if (webStorage === 'session') {
      getSessionStorage()?.setItem(server, value);
    } else {
      AppStorage.setItem(server, value);
    }
    return true;
  }

  try {
    await NativeBiometric.setCredentials({
      username,
      password: value,
      server,
      accessControl: AccessControl.BIOMETRY_CURRENT_SET,
    });
    return true;
  } catch {
    return false;
  }
}

async function secureGetValue(server: string, webStorage: 'local' | 'session' = 'local'): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    if (webStorage === 'session') {
      return getSessionStorage()?.getItem(server) || '';
    }
    return AppStorage.getItem(server) || '';
  }

  try {
    const credentials = await NativeBiometric.getCredentials({ server });
    return credentials.password || '';
  } catch {
    return '';
  }
}

async function secureDeleteValue(server: string) {
  getSessionStorage()?.removeItem(server);
  AppStorage.removeItem(server);

  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.deleteCredentials({ server });
  } catch {
    // Ignore missing secure credentials.
  }
}

const SESSION_TIMEOUT_KEY = 'digiwell_last_activity';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function updateLastActivity() {
  const timestamp = Date.now().toString();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_TIMEOUT_KEY, timestamp);
  }
}

export function getLastActivity(): number {
  if (typeof window === 'undefined') return 0;
  const stored = sessionStorage.getItem(SESSION_TIMEOUT_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function isSessionTimedOut(): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

export function clearSessionActivity() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_TIMEOUT_KEY);
  }
}

/**
 * Google provider tokens are now handled server-side by the calendar-proxy Edge Function.
 * One-time cleanup of legacy client-side tokens is handled by purgeLegacySensitiveStorage().
 */
export async function purgeGoogleProviderTokenLegacy(userId: string | undefined) {
  if (userId) {
    const scopedKey = `${LEGACY_GOOGLE_PROVIDER_TOKEN_PREFIX}${userId}`;
    getSessionStorage()?.removeItem(scopedKey);
    AppStorage.removeItem(scopedKey);
    await secureDeleteValue(secureServerKey('google-provider-token', userId));
  }

  getSessionStorage()?.removeItem(LEGACY_GOOGLE_PROVIDER_TOKEN_KEY);
  AppStorage.removeItem(LEGACY_GOOGLE_PROVIDER_TOKEN_KEY);
}

export async function setBiometricEnabled(userId: string | undefined, enabled: boolean) {
  if (!userId || !Capacitor.isNativePlatform()) return;

  if (enabled) {
    await secureSetValue(secureServerKey('biometric-enabled', userId), userId, 'true');
    getSessionStorage()?.removeItem(getBiometricEnabledStorageKey(userId));
    AppStorage.removeItem(getBiometricEnabledStorageKey(userId));
    AppStorage.removeItem(LEGACY_BIOMETRIC_KEY);
    return;
  }

  await clearBiometricEnabled(userId);
}

export async function getBiometricEnabled(userId: string | undefined): Promise<boolean> {
  if (!userId || !Capacitor.isNativePlatform()) return false;

  const secureValue = await secureGetValue(secureServerKey('biometric-enabled', userId));
  if (secureValue) return secureValue === 'true';

  const scopedValue =
    getSessionStorage()?.getItem(getBiometricEnabledStorageKey(userId)) ||
    AppStorage.getItem(getBiometricEnabledStorageKey(userId));
  if (scopedValue) return scopedValue === 'true';

  const legacyValue = AppStorage.getItem(LEGACY_BIOMETRIC_KEY);
  if (legacyValue === 'true') {
    await setBiometricEnabled(userId, true);
    AppStorage.removeItem(LEGACY_BIOMETRIC_KEY);
    return true;
  }

  return false;
}

export async function clearBiometricEnabled(userId: string | undefined) {
  if (userId) {
    getSessionStorage()?.removeItem(getBiometricEnabledStorageKey(userId));
    AppStorage.removeItem(getBiometricEnabledStorageKey(userId));
    await secureDeleteValue(secureServerKey('biometric-enabled', userId));
  }

  AppStorage.removeItem(LEGACY_BIOMETRIC_KEY);
}

export function writeCachedProfile(userId: string | undefined, profile: unknown) {
  if (!userId) return;
  getSessionStorage()?.setItem(getCachedProfileStorageKey(userId), JSON.stringify(profile));
  AppStorage.removeItem(getCachedProfileStorageKey(userId));
  AppStorage.removeItem(LEGACY_CACHED_PROFILE_KEY);
}

export function readCachedProfile<T>(userId: string | undefined): T | null {
  if (!userId) return null;

  const scopedKey = getCachedProfileStorageKey(userId);
  const scopedRaw = getSessionStorage()?.getItem(scopedKey) || AppStorage.getItem(scopedKey);
  if (scopedRaw) {
    try {
      if (!getSessionStorage()?.getItem(scopedKey)) {
        getSessionStorage()?.setItem(scopedKey, scopedRaw);
        AppStorage.removeItem(scopedKey);
      }
      return JSON.parse(scopedRaw) as T;
    } catch {
      getSessionStorage()?.removeItem(scopedKey);
      AppStorage.removeItem(scopedKey);
    }
  }

  const legacyRaw = AppStorage.getItem(LEGACY_CACHED_PROFILE_KEY);
  if (!legacyRaw) return null;

  try {
    const parsed = JSON.parse(legacyRaw) as { id?: string };
    if (parsed.id === userId) {
      writeCachedProfile(userId, parsed);
      AppStorage.removeItem(LEGACY_CACHED_PROFILE_KEY);
      return parsed as T;
    }
  } catch {
    AppStorage.removeItem(LEGACY_CACHED_PROFILE_KEY);
  }

  return null;
}

export function clearCachedProfile(userId: string | undefined) {
  if (userId) {
    getSessionStorage()?.removeItem(getCachedProfileStorageKey(userId));
    AppStorage.removeItem(getCachedProfileStorageKey(userId));
  }
  AppStorage.removeItem(LEGACY_CACHED_PROFILE_KEY);
}

export function writeFeedCache(userId: string | undefined, posts: unknown) {
  if (!userId) return;
  getSessionStorage()?.setItem(getFeedCacheStorageKey(userId), JSON.stringify(posts));
  AppStorage.removeItem(getFeedCacheStorageKey(userId));
  AppStorage.removeItem(LEGACY_FEED_CACHE_KEY);
}

export function readFeedCache<T>(userId: string | undefined): T | null {
  if (!userId) return null;

  const scopedKey = getFeedCacheStorageKey(userId);
  const scopedRaw = getSessionStorage()?.getItem(scopedKey) || AppStorage.getItem(scopedKey);
  if (scopedRaw) {
    try {
      if (!getSessionStorage()?.getItem(scopedKey)) {
        getSessionStorage()?.setItem(scopedKey, scopedRaw);
        AppStorage.removeItem(scopedKey);
      }
      return JSON.parse(scopedRaw) as T;
    } catch {
      getSessionStorage()?.removeItem(scopedKey);
      AppStorage.removeItem(scopedKey);
    }
  }

  const legacyRaw = AppStorage.getItem(LEGACY_FEED_CACHE_KEY);
  if (!legacyRaw) return null;

  try {
    const parsed = JSON.parse(legacyRaw) as T;
    writeFeedCache(userId, parsed);
    AppStorage.removeItem(LEGACY_FEED_CACHE_KEY);
    return parsed;
  } catch {
    AppStorage.removeItem(LEGACY_FEED_CACHE_KEY);
  }

  return null;
}

export function clearFeedCache(userId: string | undefined) {
  if (userId) {
    getSessionStorage()?.removeItem(getFeedCacheStorageKey(userId));
    AppStorage.removeItem(getFeedCacheStorageKey(userId));
  }
  AppStorage.removeItem(LEGACY_FEED_CACHE_KEY);
}

export function purgeLegacySensitiveStorage() {
  getSessionStorage()?.removeItem(LEGACY_GOOGLE_PROVIDER_TOKEN_KEY);
  getSessionStorage()?.removeItem(LEGACY_BIOMETRIC_KEY);
  AppStorage.removeItem(LEGACY_GOOGLE_PROVIDER_TOKEN_KEY);
  AppStorage.removeItem(LEGACY_BIOMETRIC_KEY);
  AppStorage.removeItem(LEGACY_CACHED_PROFILE_KEY);
  AppStorage.removeItem(LEGACY_FEED_CACHE_KEY);

  for (let index = AppStorage.length - 1; index >= 0; index -= 1) {
    const key = AppStorage.key(index);
    if (!key) continue;

    if (key.startsWith(LEGACY_GOOGLE_PROVIDER_TOKEN_PREFIX) || key.startsWith(BIOMETRIC_ENABLED_PREFIX)) {
      AppStorage.removeItem(key);
    }
  }
}

function clearUserPendingWaterSyncs(userId: string) {
  const pendingKey = 'digiwell_pending_water_syncs';
  const raw = AppStorage.getItem(pendingKey);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const filteredEntries = Object.entries(parsed).filter(([key]) => !key.startsWith(`${userId}:`));
    if (filteredEntries.length > 0) {
      AppStorage.setItem(pendingKey, JSON.stringify(Object.fromEntries(filteredEntries)));
    } else {
      AppStorage.removeItem(pendingKey);
    }
  } catch {
    AppStorage.removeItem(pendingKey);
  }
}

export async function clearUserSessionArtifacts(userId: string | undefined) {
  if (userId) {
    const exactKeys = [
      getCachedProfileStorageKey(userId),
      getFeedCacheStorageKey(userId),
      `${LEGACY_GOOGLE_PROVIDER_TOKEN_PREFIX}${userId}`,
      getBiometricEnabledStorageKey(userId),
      ...USER_SCOPED_EXACT_KEYS.map(prefix => `${prefix}${userId}`),
    ];

    const prefixKeys = USER_SCOPED_PREFIX_KEYS.map(prefix => `${prefix}${userId}_`);

    for (let index = AppStorage.length - 1; index >= 0; index -= 1) {
      const key = AppStorage.key(index);
      if (!key) continue;

      if (exactKeys.includes(key) || prefixKeys.some(prefix => key.startsWith(prefix))) {
        AppStorage.removeItem(key);
      }
    }

    clearUserPendingWaterSyncs(userId);
    await purgeGoogleProviderTokenLegacy(userId);
    await clearBiometricEnabled(userId);
  }

  GLOBAL_SESSION_KEYS.forEach(key => getSessionStorage()?.removeItem(key));
  GLOBAL_SESSION_KEYS.forEach(key => AppStorage.removeItem(key));
}
