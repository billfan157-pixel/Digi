import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppSystem } from '@/hooks/useAppSystem';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const mockSetView = vi.fn();
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      view: 'home' as const,
      setView: mockSetView,
      loginPrefill: null,
      setLoginPrefill: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('@/hooks/useWeatherSync', () => ({
  useWeatherSync: vi.fn(() => ({ weather: null, isLoading: false })),
}));

vi.mock('@/hooks/useCalendarSync', () => ({
  useCalendarSync: vi.fn(() => ({ isCalendarSyncing: false })),
}));

vi.mock('@/hooks/useDeviceHealth', () => ({
  useDeviceHealth: vi.fn(() => ({ health: null })),
}));

vi.mock('@/store/useConfirmDialog', () => ({
  confirmDialog: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/sessionSecurity', () => ({
  clearSessionActivity: vi.fn(),
  clearUserSessionArtifacts: vi.fn(() => Promise.resolve()),
  purgeLegacySensitiveStorage: vi.fn(),
}));

describe('useAppSystem — initial state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns default view from store', () => {
    const { result } = renderHook(() => useAppSystem());
    expect(result.current.view).toBe('welcome');
    expect(result.current.profile).toBeNull();
  });

  it('setView is a function', () => {
    const { result } = renderHook(() => useAppSystem());
    expect(typeof result.current.setView).toBe('function');
  });

  it('weather and calendar hooks return defaults', () => {
    const { result } = renderHook(() => useAppSystem());
    // useWeatherSync returns { weather: null, isLoading: false }
    // useCalendarSync returns { isCalendarSyncing: false }
    // These are spread into the return
    expect(result.current).toHaveProperty('weather');
    expect(result.current).toHaveProperty('isCalendarSyncing');
  });

  it('handleLogout does not throw', async () => {
    const { result } = renderHook(() => useAppSystem());
    await expect(result.current.handleLogout()).resolves.toBeUndefined();
  }, 10000);
});
