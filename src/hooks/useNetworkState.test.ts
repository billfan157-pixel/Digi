import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockChannel = {
  subscribe: vi.fn((callback: (status: string) => void) => {
    setTimeout(() => callback('SUBSCRIBED'), 0);
    return 'channel-1';
  }),
  unsubscribe: vi.fn(),
};
const mockRemoveChannel = vi.fn();
const mockChannelFn = vi.fn(() => mockChannel);

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: mockChannelFn,
    removeChannel: mockRemoveChannel,
  },
}));

async function importUseNetworkState() {
  vi.resetModules();
  return import('./useNetworkState');
}

describe('useNetworkState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns isOnline = true when navigator.onLine', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { useNetworkState } = await importUseNetworkState();
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('returns isOnline = false when navigator.onLine is false', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { useNetworkState } = await importUseNetworkState();
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isOnline).toBe(false);
  });

  it('subscribes to a Realtime channel on mount', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { useNetworkState } = await importUseNetworkState();
    renderHook(() => useNetworkState());
    await vi.advanceTimersByTimeAsync(10);
    expect(mockChannelFn).toHaveBeenCalledWith('network-state');
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('checkNow returns current navigator.onLine', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { useNetworkState } = await importUseNetworkState();
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.checkNow()).toBe(true);
  });
});

describe('useNetworkState — event listeners', () => {
  let listeners: Record<string, () => void>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    listeners = {};
    addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      listeners[event as string] = handler as () => void;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('listens for online/offline events', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { useNetworkState } = await importUseNetworkState();
    renderHook(() => useNetworkState());
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('updates wasOffline when going offline then back online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { useNetworkState } = await importUseNetworkState();
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.wasOffline).toBe(false);

    // Go offline
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await act(async () => {
      if (listeners.offline) listeners.offline();
    });
    expect(result.current.isOnline).toBe(false);

    // Come back online
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    await act(async () => {
      if (listeners.online) listeners.online();
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
