import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInit = vi.fn();
const mockSetUser = vi.fn();

vi.mock('@sentry/react', () => ({
  default: { init: mockInit, setUser: mockSetUser },
  init: mockInit,
  setUser: mockSetUser,
  browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sentry exports', () => {
  it('exports Sentry', async () => {
    const { Sentry } = await import('./sentry');
    expect(Sentry).toBeDefined();
  });

  it('setSentryUser sets user when userId provided', async () => {
    const { setSentryUser } = await import('./sentry');
    setSentryUser('user-1');
    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('setSentryUser clears user when undefined', async () => {
    const { setSentryUser } = await import('./sentry');
    setSentryUser(undefined);
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  it('initSentry does not throw', async () => {
    const { initSentry } = await import('./sentry');
    expect(() => initSentry()).not.toThrow();
  });
});
