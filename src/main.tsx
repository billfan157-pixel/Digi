// --- SENTRY ERROR TRACKING (LAZY LOADED) ---
// Sentry is lazy loaded to reduce initial bundle size (~86KB gzipped)
// Only initialize in production builds with valid DSN
import { initWebVitals } from './lib/webVitals';

// Lazy initialize Sentry after app bootstrap
let Sentry: typeof import('./lib/sentry').Sentry | null = null;

async function loadSentry() {
  if (Sentry || import.meta.env.DEV) return;
  try {
    const sentryModule = await import('./lib/sentry');
    Sentry = sentryModule.Sentry;
    sentryModule.initSentry();
  } catch (e) {
    console.warn('Failed to load Sentry:', e);
  }
}

// --- CODE BẮT LỖI MÀN HÌNH TRẮNG (DEV MODE) ---
// DEV: overlay trực quan + forward to Sentry
// PROD: chỉ forward to Sentry (không làm hỏng UI)
if (typeof window !== 'undefined') {
  initWebVitals();
  // Load Sentry in background for production error tracking
  if (!import.meta.env.DEV) {
    loadSentry();
  }

  window.onerror = function (msg, _url, line, _col, error) {
    console.error(`LỖI: ${msg} (dòng ${line})`);
    Sentry?.captureException(error ?? new Error(String(msg)));
    if (!error && Sentry) Sentry.captureMessage(String(msg), 'error');

    if (import.meta.env.DEV) {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.9);color:white;z-index:99999;padding:20px;font:16px monospace;white-space:pre-wrap;overflow:auto';
      d.innerText = `LỖI NGHIÊM TRỌNG:\n${msg}\n\nDòng: ${line}\nFile: ${_url}`;
      document.body.appendChild(d);
    }
    return false;
  };

  window.onunhandledrejection = function (event) {
    const reason = event.reason;
    console.error(`LỖI PROMISE:`, reason);
    if (Sentry) {
      if (reason instanceof Error) Sentry.captureException(reason);
      else Sentry.captureMessage(String(reason), 'error');
    }

    if (import.meta.env.DEV) {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:orange;color:black;z-index:99999;padding:20px;font:16px monospace';
      d.innerText = `LỖI PROMISE:\n${reason}`;
      document.body.appendChild(d);
    }
  };
}
// --- HẾT CODE BẮT LỖI ---
import { AppStorage } from './lib/storage';

// 1. Nạp toàn bộ Capacitor Preferences vào RAM cache
// Bước này phải thực hiện trước khi bất kỳ file nào khác được import
// để đảm bảo các component có thể đọc Storage đồng bộ ngay lập tức.
await AppStorage.init();

// 2. Chạy app chính
await import('./bootstrap');
