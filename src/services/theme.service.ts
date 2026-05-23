import { supabase } from '@/lib/supabase';
import { AppStorage } from '@/lib/storage';
import { APP_THEMES, type ThemeConfig } from '@/config/themes';

const THEME_CACHE_KEY = 'cached_themes';
const THEME_CACHE_VERSION = 'v1';

interface CachedThemes {
  version: string;
  themes: Record<string, ThemeConfig>;
  timestamp: number;
}

// Load themes from shop_items (server) with local cache fallback
export async function loadThemesFromServer(): Promise<Record<string, ThemeConfig>> {
  try {
    const { data: shopItems, error } = await supabase
      .from('shop_items')
      .select('id, meta_value')
      .eq('category', 'theme')
      .eq('is_active', true);

    if (error) throw error;

    const themes: Record<string, ThemeConfig> = {};

    for (const item of shopItems || []) {
      if (item.meta_value) {
        try {
          const themeConfig = typeof item.meta_value === 'string' 
            ? JSON.parse(item.meta_value) 
            : item.meta_value;
          
          // Validate theme config structure
          if (themeConfig.id && themeConfig.colors) {
            themes[themeConfig.id] = themeConfig as ThemeConfig;
          }
        } catch (parseError) {
          console.error(`Failed to parse theme config for ${item.id}:`, parseError);
        }
      }
    }

    // Cache themes locally
    if (Object.keys(themes).length > 0) {
      const cacheData: CachedThemes = {
        version: THEME_CACHE_VERSION,
        themes,
        timestamp: Date.now(),
      };
      AppStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cacheData));
    }

    return themes;
  } catch (error) {
    console.error('Failed to load themes from server:', error);
    // Fallback to cached themes
    return loadThemesFromCache();
  }
}

// Load themes from local cache
export function loadThemesFromCache(): Record<string, ThemeConfig> {
  try {
    const cached = AppStorage.getItem(THEME_CACHE_KEY);
    if (!cached) return APP_THEMES;

    const cacheData: CachedThemes = JSON.parse(cached);
    
    // Check cache version
    if (cacheData.version !== THEME_CACHE_VERSION) {
      console.log('Theme cache version mismatch, using fallback');
      return APP_THEMES;
    }

    // Check cache age (7 days max)
    const cacheAge = Date.now() - cacheData.timestamp;
    if (cacheAge > 7 * 24 * 60 * 60 * 1000) {
      console.log('Theme cache expired, using fallback');
      return APP_THEMES;
    }

    return cacheData.themes;
  } catch (error) {
    console.error('Failed to load themes from cache:', error);
    return APP_THEMES;
  }
}

// Get theme config with fallback chain: server -> cache -> hardcoded
export async function getThemeConfigAsync(themeId: string | null | undefined): Promise<ThemeConfig> {
  if (!themeId) return APP_THEMES.theme_default;

  // Try loading from server first
  const serverThemes = await loadThemesFromServer();
  if (serverThemes[themeId]) {
    return serverThemes[themeId];
  }

  // Fallback to cache
  const cachedThemes = loadThemesFromCache();
  if (cachedThemes[themeId]) {
    return cachedThemes[themeId];
  }

  // Final fallback to hardcoded themes
  return APP_THEMES[themeId] || APP_THEMES.theme_default;
}

// Synchronous version for immediate use (uses cache or fallback)
export function getThemeConfigSync(themeId: string | null | undefined): ThemeConfig {
  if (!themeId) return APP_THEMES.theme_default;

  const cachedThemes = loadThemesFromCache();
  if (cachedThemes[themeId]) {
    return cachedThemes[themeId];
  }

  return APP_THEMES[themeId] || APP_THEMES.theme_default;
}

// Preload themes on app startup
export async function preloadThemes(): Promise<void> {
  await loadThemesFromServer();
}
