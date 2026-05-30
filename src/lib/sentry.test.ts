import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

const mockInit = vi.fn();
const mockSetUser = vi.fn();
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();
const mockSetContext = vi.fn();

vi.mock('@sentry/react', () => ({
  default: { init: mockInit, setUser: mockSetUser },
  init: mockInit,
  setUser: mockSetUser,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setContext: mockSetContext,
  getCurrentScope: vi.fn(() => ({ setTag: vi.fn(), setContext: vi.fn() })),
  browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}));

const OLD_DSN = process.env.VITE_SENTRY_DSN;

beforeAll(() => {
  process.env.VITE_SENTRY_DSN = 'https://test@sentry.io/test';
});

afterAll(() => {
  if (OLD_DSN) {
    process.env.VITE_SENTRY_DSN = OLD_DSN;
  } else {
    delete process.env.VITE_SENTRY_DSN;
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sentry lazy wrapper', () => {
  it('captureException is flushed after init', async () => {
    const { Sentry, initSentry } = await import('./sentry');

    Sentry.captureException(new Error('test'));
    await initSentry();

    expect(mockInit).toHaveBeenCalledOnce();
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });

  it('setSentryUser flushes after init', async () => {
    const { setSentryUser, initSentry } = await import('./sentry');

    setSentryUser('user-1');
    await initSentry();

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('captureMessage flushes after init', async () => {
    const { Sentry, initSentry } = await import('./sentry');

    Sentry.captureMessage('test message');
    await initSentry();

    expect(mockCaptureMessage).toHaveBeenCalledWith('test message', undefined);
  });

  it('setContext flushes after init', async () => {
    const { Sentry, initSentry } = await import('./sentry');

    Sentry.setContext('test', { key: 'value' });
    await initSentry();

    expect(mockSetContext).toHaveBeenCalledWith('test', { key: 'value' });
  });
});
