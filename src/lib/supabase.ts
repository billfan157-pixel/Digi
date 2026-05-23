import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. LẤY BIẾN MÔI TRƯỜNG TỪ .env (Bắt buộc phải có)
// Fallback đã được loại bỏ vì lý do bảo mật - không được phép hardcode credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. KIỂM TRA CẤU HÌNH VÀ GHI LOG
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ LỖI NGHIÊM TRỌNG: Thiếu cấu hình Supabase URL hoặc Anon Key!');
  console.error('URL hiện tại:', supabaseUrl);
  console.error('Key hiện tại:', supabaseAnonKey ? '*** (có key nhưng có thể sai)' : 'KHÔNG CÓ KEY');
} else {
  console.log('✅ Supabase Config OK:', supabaseUrl);
}

// ==========================================
// SLOW QUERY LOGGING (Sprint 1)
// ==========================================

export interface SlowQueryLog {
  query: string;
  duration: number;
  timestamp: number;
}

const SLOW_QUERY_THRESHOLD = 200; // ms
const SLOW_QUERIES_KEY = 'digiwell-slow-queries';
const MAX_SLOW_QUERIES = 50;

export function getSlowQueries(): SlowQueryLog[] {
  try {
    const stored = localStorage.getItem(SLOW_QUERIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Lỗi đọc slow queries từ localStorage:', e);
    return [];
  }
}

export function recordSlowQuery(query: string, duration: number): void {
  const logs = getSlowQueries();
  logs.push({
    query,
    duration,
    timestamp: Date.now()
  });
  
  // Keep only last 50 entries
  if (logs.length > MAX_SLOW_QUERIES) {
    logs.shift();
  }
  
  try {
    localStorage.setItem(SLOW_QUERIES_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Lỗi ghi slow queries vào localStorage:', e);
  }
}

function getQueryName(url: string | URL | Request, options?: RequestInit): string {
  try {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url;
    const urlObj = new URL(urlStr);
    const path = urlObj.pathname;
    const method = options?.method || 'GET';
    
    // Check for RPC calls
    if (path.includes('/rest/v1/rpc/')) {
      const rpcName = path.split('/rest/v1/rpc/')[1];
      return `RPC ${rpcName}`;
    }
    
    // Check for table operations
    if (path.includes('/rest/v1/')) {
      const tableName = path.split('/rest/v1/')[1].split('?')[0];
      return `${method} /${tableName}`;
    }
    
    return `${method} ${path}`;
  } catch {
    return 'Unknown query';
  }
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 800; // ms — slightly faster than 1s for snappier recovery
const FETCH_TIMEOUT_MS = 30000; // 30s max per fetch

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Detect transient network errors that benefit from retry */
function isTransientError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const msg = String(error).toLowerCase();
  const transientMarkers = [
    'failed to fetch',
    'load failed',
    'networkerror',
    'network changed',
    'quic',
    'aborted',
    'timeout',
    'temporarily',
  ];
  return transientMarkers.some((m) => msg.includes(m));
}

/** Exponential backoff with jitter to avoid thundering herd */
function backoffMs(attempt: number): number {
  const base = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * base; // ±30% jitter
  return Math.min(base + jitter, 8000); // cap at 8s
}

const customFetchWrapper = async (
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> => {
  const queryName = getQueryName(input, init);
  let attempt = 0;

  while (true) {
    attempt++;
    const startTime = performance.now();

    // AbortSignal timeout: prevent hanging fetches
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const mergedInit: RequestInit = {
      ...init,
      signal: init?.signal
        ? AbortSignal.any([init.signal, controller.signal])
        : controller.signal,
    };

    try {
      const response = await fetch(input, mergedInit);
      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(`⚠️ Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
        recordSlowQuery(queryName, duration);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      const method = init?.method || 'GET';
      const isSafeToRetry = method === 'GET' || urlStr.includes('/auth/v1/');

      if (isTransientError(error) && isSafeToRetry && attempt < MAX_RETRIES) {
        const wait = backoffMs(attempt);
        console.warn(
          `⚠️ ${queryName} network error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${Math.round(wait)}ms`
        );
        await delay(wait);
        continue;
      }

      console.error(`❌ ${queryName} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
};

// 3. KHỞI TẠO SINGLETON (Tránh lỗi Multiple Instances)
const globalAny = globalThis as unknown as { __supabaseClient?: SupabaseClient };

if (!globalAny.__supabaseClient) {
  globalAny.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.warn('Lỗi đọc localStorage:', e);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('Lỗi ghi localStorage:', e);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('Lỗi xóa localStorage:', e);
          }
        }
      }
    },
    global: {
      headers: { 
        'X-Client-Info': 'digiwell-mobile/1.0.0',
        'Content-Type': 'application/json'
      },
      fetch: customFetchWrapper
    }
  });
}

const supabaseClient = globalAny.__supabaseClient;
if (!supabaseClient) {
  throw new Error('Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}
export const supabase: SupabaseClient = supabaseClient;

// ==========================================
// THIẾT LẬP READ REPLICA CLIENT (Phase 2.1.B)
// ==========================================
const readUrl = import.meta.env.VITE_SUPABASE_READ_URL || supabaseUrl; // Fallback về primary nếu không có replica
const globalAnyRead = globalThis as unknown as { __supabaseReadClient?: SupabaseClient };

if (!globalAnyRead.__supabaseReadClient) {
  globalAnyRead.__supabaseReadClient = createClient(readUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      storageKey: 'digiwell-read-storage',
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'digiwell-mobile-read/1.0.0',
        'Content-Type': 'application/json'
      },
      fetch: customFetchWrapper
    }
  });
}
export const supabaseRead: SupabaseClient = globalAnyRead.__supabaseReadClient;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const checkSupabaseConfig = () => isSupabaseConfigured;