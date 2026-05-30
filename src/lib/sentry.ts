type SentryModule = {
  init: (options: Record<string, unknown>) => void;
  setUser: (user: { id: string } | null) => void;
  captureException: (error: unknown, hint?: unknown) => void;
  captureMessage: (message: string, level?: unknown) => void;
  setContext: (key: string, context: Record<string, unknown> | null) => void;
  getCurrentScope: () => unknown;
};

let target: Partial<SentryModule> = {};
const queue: Array<{ method: string; args: unknown[] }> = [];

function call(method: string, ...args: unknown[]) {
  const fn = target[method as keyof SentryModule];
  if (fn) {
    (fn as (...args: unknown[]) => void)(...args);
  } else {
    queue.push({ method, args });
  }
}

function flushQueue() {
  if (Object.keys(target).length === 0) return;
  for (const { method, args } of queue) {
    const fn = target[method as keyof SentryModule];
    if (fn) (fn as (...args: unknown[]) => void)(...args);
  }
  queue.length = 0;
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const mod = await import('@sentry/react');
  const { browserTracingIntegration, replayIntegration } = mod;

  mod.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || `digiwell-app@${import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || import.meta.env.VITE_GIT_COMMIT_HASH || 'unknown'}`,
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured with keys: code',
    ],
  });

  target = mod;
  flushQueue();
}

export function setSentryUser(userId: string | undefined) {
  call('setUser', userId ? { id: userId } : null);
}

export const Sentry = {
  captureException(error: unknown, hint?: unknown) {
    call('captureException', error, hint);
  },
  captureMessage(message: string, level?: unknown) {
    call('captureMessage', message, level);
  },
  setUser(user: { id: string } | null) {
    call('setUser', user);
  },
  setContext(key: string, context: Record<string, unknown> | null) {
    call('setContext', key, context);
  },
  getCurrentScope() {
    if (!target.getCurrentScope) return null;
    return target.getCurrentScope();
  },
};
