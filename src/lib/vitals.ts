import { track } from './analytics';

export function initVitals() {
  // Only track in production to avoid cluttering local DB with dev metrics
  if (import.meta.env.DEV) {
    return;
  }

  const sendToAnalytics = (name: string, value: number, id: string, delta: number) => {
    track('web_vital', {
      metric_name: name,
      metric_value: value,
      metric_id: id,
      metric_delta: delta,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
  };

  try {
    // 1. TTFB (Time to First Byte)
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav) {
      sendToAnalytics('TTFB', nav.responseStart, 'ttfb-init', nav.responseStart);
    }

    // 2. FID (First Input Delay) — deprecated, kept for legacy tracking
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as PerformanceEventTiming[]) {
        const delay = entry.processingStart - entry.startTime;
        sendToAnalytics('FID', delay, entry.name || 'fid', delay);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // 2b. INP (Interaction to Next Paint) — replaces FID since 2024
    const inpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEventTiming[];
      for (const entry of entries) {
        const duration = entry.duration;
        const interactionId = (entry as unknown as { interactionId?: number }).interactionId;
        sendToAnalytics('INP', duration, interactionId?.toString() || 'inp', duration);
      }
    });
    try {
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
    } catch {
      // Fallback if browser doesn't support event observer with durationThreshold
    }

    // 3. LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        sendToAnalytics('LCP', lastEntry.startTime, 'lcp', lastEntry.startTime);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    interface LayoutShiftEntry extends PerformanceEntry {
      hadRecentInput: boolean;
      value: number;
    }
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as unknown as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          sendToAnalytics('CLS', clsValue, 'cls', entry.value);
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

  } catch (error) {
    console.error('Failed to initialize custom Core Web Vitals tracking:', error);
  }
}
