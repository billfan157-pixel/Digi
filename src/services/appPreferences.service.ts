import { AppStorage } from '@/lib/storage';
export interface AppPreferences {
  calendar?: boolean;
  themeColor?: string;
  watch?: boolean;
  weather?: boolean;
}

const getPreferencesKey = (userId: string) => `digiwell_prefs_${userId}`;

export function readAppPreferences(userId: string | undefined): AppPreferences {
  if (!userId) return {};

  try {
    const raw = AppStorage.getItem(getPreferencesKey(userId));
    return raw ? (JSON.parse(raw) as AppPreferences) : {};
  } catch {
    AppStorage.removeItem(getPreferencesKey(userId));
    return {};
  }
}

export function writeAppPreferences(
  userId: string | undefined,
  patch: Partial<AppPreferences>,
): AppPreferences {
  if (!userId) return {};

  const nextValue = { ...readAppPreferences(userId), ...patch };
  AppStorage.setItem(getPreferencesKey(userId), JSON.stringify(nextValue));
  return nextValue;
}

export function readThemePreference(userId: string | undefined, fallback = '#06b6d4') {
  return readAppPreferences(userId).themeColor || fallback;
}
