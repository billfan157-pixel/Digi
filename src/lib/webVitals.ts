export interface WebVitals {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
}

const WEB_VITALS_KEY = 'digiwell-web-vitals';

const defaultVitals: WebVitals = {
  fcp: null,
  lcp: null,
  cls: null,
  fid: null,
  ttfb: null,
};

export function getWebVitals(): WebVitals {
  try {
    const stored = localStorage.getItem(WEB_VITALS_KEY);
    return stored ? { ...defaultVitals, ...JSON.parse(stored) } : defaultVitals;
  } catch (e) {
    console.warn('Lỗi đọc Web Vitals từ localStorage:', e);
    return defaultVitals;
  }
}

function updateWebVitals(updates: Partial<WebVitals>): void {
  try {
    const current = getWebVitals();
    const next = { ...current, ...updates };
    localStorage.setItem(WEB_VITALS_KEY, JSON.stringify(next));
    // Trigger custom event so settings UI can re-render if open
    window.dispatchEvent(new CustomEvent('digiwell-vitals-updated', { detail: next }));
  } catch (e) {
    console.warn('Lỗi ghi Web Vitals vào localStorage:', e);
  }
}

export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // 1. Check existing entries immediately (for FCP, TTFB that occurred early)
  try {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      updateWebVitals({ fcp: fcpEntry.startTime });
    }

    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      // TTFB = responseStart - startTime
      updateWebVitals({ ttfb: nav.responseStart });
    }
  } catch (e) {
    console.warn('Lỗi đọc performance entries ban đầu:', e);
  }

  // 2. Setup PerformanceObservers
  // Observer for FCP
  try {
    const paintObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      if (fcp) {
        updateWebVitals({ fcp: fcp.startTime });
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP PerformanceObserver không được hỗ trợ:', e);
  }

  // Observer for LCP
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        updateWebVitals({ lcp: lastEntry.startTime });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP PerformanceObserver không được hỗ trợ:', e);
  }

  // Observer for CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value ?? 0;
          updateWebVitals({ cls: clsValue });
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS PerformanceObserver không được hỗ trợ:', e);
  }

  // Observer for FID
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0] as PerformanceEntry & { processingStart?: number; startTime?: number };
      if (firstInput) {
        const delay = (firstInput.processingStart ?? 0) - (firstInput.startTime ?? 0);
        updateWebVitals({ fid: delay });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID PerformanceObserver không được hỗ trợ:', e);
  }
}

// Baseline standards for Web Vitals thresholds
export function getMetricStatus(
  name: keyof WebVitals,
  value: number | null
): { color: string; bg: string; label: string } {
  if (value === null) {
    return { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Chờ đo' };
  }

  switch (name) {
    case 'lcp':
      if (value <= 2500) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tốt' };
      if (value <= 4000) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cần cải thiện' };
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Kém' };

    case 'fid':
      if (value <= 100) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tốt' };
      if (value <= 300) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cần cải thiện' };
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Kém' };

    case 'cls':
      if (value <= 0.1) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tốt' };
      if (value <= 0.25) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cần cải thiện' };
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Kém' };

    case 'fcp':
      if (value <= 1800) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tốt' };
      if (value <= 3000) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cần cải thiện' };
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Kém' };

    case 'ttfb':
      if (value <= 800) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tốt' };
      if (value <= 1800) return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cần cải thiện' };
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Kém' };

    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Không xác định' };
  }
}
