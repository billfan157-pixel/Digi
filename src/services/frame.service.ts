import { supabase } from '@/lib/supabase';
import { AppStorage } from '@/lib/storage';

const FRAME_CACHE_KEY = 'cached_frames';
const FRAME_CACHE_VERSION = 'v1';

interface CachedFrames {
  version: string;
  frames: Record<string, FrameRecord>;
  timestamp: number;
}

export interface FrameRecord {
  name: string;
  borderClasses: string;
  effectSourceId: string;
}

async function loadFramesFromServer(): Promise<Record<string, FrameRecord>> {
  try {
    const { data: shopItems, error } = await supabase
      .from('shop_items')
      .select('id, meta_value')
      .eq('category', 'frame')
      .eq('is_active', true);

    if (error) throw error;

    const frames: Record<string, FrameRecord> = {};

    for (const item of shopItems || []) {
      if (!item.meta_value) continue;
      try {
        const meta = typeof item.meta_value === 'string'
          ? JSON.parse(item.meta_value)
          : item.meta_value;

        const borderClasses = meta.borderClasses;
        const effectSourceId = meta.effectSourceId;

        if (borderClasses && effectSourceId) {
          frames[item.id] = {
            name: meta.name || item.id,
            borderClasses,
            effectSourceId,
          };
        }
      } catch {
        // skip unparseable
      }
    }

    if (Object.keys(frames).length > 0) {
      const cacheData: CachedFrames = {
        version: FRAME_CACHE_VERSION,
        frames,
        timestamp: Date.now(),
      };
      AppStorage.setItem(FRAME_CACHE_KEY, JSON.stringify(cacheData));
    }

    return frames;
  } catch (error) {
    console.error('Failed to load frames from server:', error);
    return loadFramesFromCache();
  }
}

function loadFramesFromCache(): Record<string, FrameRecord> {
  try {
    const cached = AppStorage.getItem(FRAME_CACHE_KEY);
    if (!cached) return {};

    const cacheData: CachedFrames = JSON.parse(cached);
    if (cacheData.version !== FRAME_CACHE_VERSION) return {};

    const cacheAge = Date.now() - cacheData.timestamp;
    if (cacheAge > 7 * 24 * 60 * 60 * 1000) return {};

    return cacheData.frames;
  } catch {
    return {};
  }
}

export function getFrameConfigSync(frameId: string | null | undefined): FrameRecord | null {
  if (!frameId) return null;

  const cached = loadFramesFromCache();
  if (cached[frameId]) return cached[frameId];

  return null;
}

export async function preloadFrames(): Promise<void> {
  await loadFramesFromServer();
}
