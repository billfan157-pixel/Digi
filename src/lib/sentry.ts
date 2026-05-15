import * as Sentry from '@sentry/react';
import { replayIntegration, browserTracingIntegration } from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.5 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured with keys: code',
    ],
  });
}

export { Sentry };
