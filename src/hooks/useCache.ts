/**
 * useCache Hook
 * Client-side caching layer with localStorage + memory cache
 */
import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheOptions {
  ttl?: number; // default TTL in ms
  useLocalStorage?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCache() {
  const memoryCache = useRef<Map<string, CacheEntry<unknown>>>(new Map());

  // Set item in cache
  const set = useCallback(<T>(key: string, data: T, options: CacheOptions = {}) => {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Memory cache always
    memoryCache.current.set(key, entry);

    // LocalStorage if requested
    if (options.useLocalStorage) {
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [memoryCache]);

  // Get item from cache
  const get = useCallback(<T>(key: string): T | null => {
    // Check memory cache first
    const memEntry = memoryCache.current.get(key);
    if (memEntry) {
      const age = Date.now() - memEntry.timestamp;
      if (age < memEntry.ttl) {
        return memEntry.data as T;
      }
      memoryCache.current.delete(key);
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        const age = Date.now() - entry.timestamp;
        if (age < entry.ttl) {
          // Restore to memory cache
          memoryCache.current.set(key, entry);
          return entry.data;
        }
        localStorage.removeItem(`cache:${key}`);
      }
    } catch {
      // Storage unavailable
    }

    return null;
  }, [memoryCache]);

  // Check if key exists and is valid
  const has = useCallback((key: string): boolean => {
    const memEntry = memoryCache.current.get(key);
    if (memEntry) {
      const age = Date.now() - memEntry.timestamp;
      if (age < memEntry.ttl) return true;
    }

    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<unknown> = JSON.parse(stored);
        const age = Date.now() - entry.timestamp;
        return age < entry.ttl;
      }
    } catch {
      return false;
    }

    return false;
  }, [memoryCache]);

  // Remove specific key
  const remove = useCallback((key: string) => {
    memoryCache.current.delete(key);
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch {
      // Storage unavailable
    }
  }, [memoryCache]);

  // Clear all cache
  const clear = useCallback(() => {
    memoryCache.current.clear();
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Storage unavailable
    }
  }, [memoryCache]);

  // Get cache stats
  const getStats = useCallback(() => {
    const memSize = memoryCache.current.size;
    try {
      const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
      return {
        memoryEntries: memSize,
        localStorageEntries: localKeys.length,
        total: memSize + localKeys.length,
      };
    } catch {
      return { memoryEntries: memSize, localStorageEntries: 0, total: memSize };
    }
  }, [memoryCache]);

  // Cached fetch wrapper
  const cachedFetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> => {
    // Check cache first
    const cached = get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();
    set(key, data, options);
    return data;
  }, [get, set]);

  return {
    set,
    get,
    has,
    remove,
    clear,
    getStats,
    cachedFetch,
  };
}

// Global cache instance for shared use
let globalCacheInstance: ReturnType<typeof useCache> | null = null;

export function getGlobalCache() {
  if (!globalCacheInstance) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    globalCacheInstance = useCache();
  }
  return globalCacheInstance;
}
