import { Preferences } from '@capacitor/preferences';

/**
 * AppStorage là một wrapper cho @capacitor/preferences kết hợp với in-memory cache.
 * Giúp đọc dữ liệu đồng bộ (synchronous) thay thế hoàn toàn cho localStorage
 * mà không phá vỡ kiến trúc UI / Zustand store hiện tại.
 */
class StorageManager {
  private static cache: Record<string, string> = {};
  private static initialized = false;
  private static readonly initTimeoutMs = 1200;

  private static async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error('Preferences init timeout')), timeoutMs);
      }),
    ]);
  }

  private static hydrateFromLocalStorage() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        this.cache[key] = localStorage.getItem(key) || '';
      }
    }
  }

  /**
   * MUST be called at the root level (e.g. main.tsx) before any React render.
   * Nạp toàn bộ Preferences vào RAM.
   */
  static async init() {
    if (this.initialized) return;
    
    try {
      const { keys } = await this.withTimeout(Preferences.keys(), this.initTimeoutMs);
      for (const key of keys) {
        const { value } = await this.withTimeout(Preferences.get({ key }), this.initTimeoutMs);
        if (value !== null) {
          this.cache[key] = value;
        }
      }
      this.initialized = true;
      console.log(`[AppStorage] Initialized with ${keys.length} keys`);
    } catch (err) {
      console.error('[AppStorage] Failed to init Preferences', err);
      // Fallback to localstorage if capacitor plugin fails (e.g., SSR or weird web environments)
      this.initialized = true;
      this.hydrateFromLocalStorage();
    }
  }

  static getItem(key: string): string | null {
    if (!this.initialized) {
      console.warn(`[AppStorage] Accessing key "${key}" before initialization. Falling back to localStorage.`);
      return localStorage.getItem(key);
    }
    return this.cache[key] !== undefined ? this.cache[key] : null;
  }

  static setItem(key: string, value: string) {
    this.cache[key] = value;
    // Async write to native storage
    Preferences.set({ key, value }).catch(err => {
      console.error(`[AppStorage] Failed to set ${key}`, err);
    });
    // Fallback: also write to localStorage for web redundancy
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore quota exceeded
    }
  }

  static removeItem(key: string) {
    delete this.cache[key];
    Preferences.remove({ key }).catch(err => {
      console.error(`[AppStorage] Failed to remove ${key}`, err);
    });
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }

  static key(index: number): string | null {
    const keys = Object.keys(this.cache);
    return keys[index] ?? null;
  }

  static get length() {
    return Object.keys(this.cache).length;
  }

  static clear() {
    this.cache = {};
    Preferences.clear().catch(console.error);
    try {
      localStorage.clear();
    } catch (e) {}
  }
}

export const AppStorage = StorageManager;
