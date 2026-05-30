import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroqAI, type UseGroqAIProps } from '../useGroqAI';

const mockGenerateHydrationAdvice = vi.fn();
const mockSendAiChatMessage = vi.fn();
const mockStreamAiChatMessage = vi.fn();
const mockFetchChatHistory = vi.fn((..._args: any[]) => Promise.resolve([]));
const mockInvokeAgenticWorkflow = vi.fn((..._args: any[]) => Promise.resolve([]));
const mockGetOfflineAdvice = vi.fn((..._args: any[]) => ({ text: 'offline', suggestedAmount: 100 }));
const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockSetShowPremiumModal = vi.fn();
const mockConfirmDialog = vi.fn((..._args: any[]) => Promise.resolve(true));
const mockToastWarning = vi.fn();
const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockHandleAddWater = vi.fn(() => Promise.resolve());

vi.mock('@/lib/ai', () => ({
  generateHydrationAdvice: (...args: any[]) => mockGenerateHydrationAdvice(...args),
  sendAiChatMessage: (...args: any[]) => mockSendAiChatMessage(...args),
  streamAiChatMessage: (...args: any[]) => mockStreamAiChatMessage(...args),
  fetchChatHistory: (...args: any[]) => mockFetchChatHistory(...args),
  invokeAgenticWorkflow: (...args: any[]) => mockInvokeAgenticWorkflow(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockSupabaseRpc(...args),
    from: (...args: any[]) => mockSupabaseFrom(...args),
  },
}));

vi.mock('@/lib/offlineExpertSystem', () => ({
  getOfflineAdvice: (...args: any[]) => mockGetOfflineAdvice(...args),
}));

vi.mock('@/store/useUIStore', () => ({
  useUIStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ setShowPremiumModal: mockSetShowPremiumModal } as Record<string, unknown>),
    ),
    { getState: vi.fn(() => ({ setShowPremiumModal: mockSetShowPremiumModal })) },
  ),
}));

vi.mock('@/store/useConfirmDialog', () => ({
  confirmDialog: (...args: any[]) => mockConfirmDialog(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: any[]) => mockToastWarning(...args),
    info: (...args: any[]) => mockToastInfo(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

vi.mock('@/i18n', () => ({
  default: { t: (key: string) => key },
}));

vi.mock('@/hooks/useBehaviorAnalysis', () => ({
  useBehaviorAnalysis: () => ({ patterns: [] }),
}));

vi.mock('@shared/aiValidation', () => ({
  sanitizeAndCapContext: (ctx: unknown) => ctx,
}));

function buildQueryMock(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  return chain;
}

function makeProps(overrides?: Partial<UseGroqAIProps>): UseGroqAIProps {
  return {
    profile: { id: 'user-1' },
    waterIntake: 500,
    waterGoal: 2000,
    weatherData: null,
    watchData: null,
    isWeatherSynced: false,
    isWatchConnected: false,
    handleAddWater: mockHandleAddWater,
    weeklyHistory: [],
    calendarEvents: [],
    ...overrides,
  };
}

describe('useGroqAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default initial state', () => {
    const { result } = renderHook(() => useGroqAI(makeProps()));
    expect(result.current.aiAdvice).toBe('');
    expect(result.current.aiAdviceObj).toBeNull();
    expect(result.current.isAiLoading).toBe(false);
    expect(result.current.isChatLoading).toBe(false);
    expect(result.current.chatMessages).toHaveLength(1);
    expect(result.current.chatMessages[0].role).toBe('model');
    expect(result.current.agenticSuggestions).toEqual([]);
  });

  it('does not fetch AI advice when quota check fails', async () => {
    mockSupabaseFrom.mockReturnValue(buildQueryMock({
      data: { advice_count: 999 },
      error: null,
    }));

    const { result } = renderHook(() => useGroqAI(makeProps()));

    await act(async () => {
      await result.current.fetchAIAdvice();
    });

    expect(mockGenerateHydrationAdvice).not.toHaveBeenCalled();
  });

  it('fetches AI advice when quota is available', async () => {
    mockGenerateHydrationAdvice.mockResolvedValue({ text: 'drink water', suggestedAmount: 200 });
    mockSupabaseFrom.mockReturnValue(buildQueryMock({
      data: null,
      error: null,
    }));

    const { result } = renderHook(() => useGroqAI(makeProps()));

    await act(async () => {
      await result.current.fetchAIAdvice();
    });

    expect(mockGenerateHydrationAdvice).toHaveBeenCalledTimes(1);
    expect(result.current.aiAdvice).toBe('drink water');
  });

  it('blocks chat send when quota is exceeded', async () => {
    mockSupabaseFrom.mockReturnValue(buildQueryMock({
      data: { message_count: 999 },
      error: null,
    }));

    const { result } = renderHook(() => useGroqAI(makeProps()));

    act(() => { result.current.setChatInput('hi'); });

    await act(async () => {
      await result.current.handleSendChatMessage();
    });

    expect(mockStreamAiChatMessage).not.toHaveBeenCalled();
  });

  it('falls back to offline expert system when advice API fails', async () => {
    mockGenerateHydrationAdvice.mockRejectedValue(new Error('Network error'));
    mockGetOfflineAdvice.mockReturnValue({ text: 'offline advice', suggestedAmount: 150 });
    mockSupabaseFrom.mockReturnValue(buildQueryMock({
      data: null,
      error: null,
    }));

    const { result } = renderHook(() => useGroqAI(makeProps()));

    await act(async () => {
      await result.current.fetchAIAdvice();
    });

    expect(mockGetOfflineAdvice).toHaveBeenCalled();
    expect(result.current.aiAdvice).toBe('offline advice');
  });
});
