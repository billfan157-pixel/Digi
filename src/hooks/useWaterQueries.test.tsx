import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWaterLogsQuery, useAddWaterMutation, useDeleteWaterMutation, useUpdateWaterMutation, useProcessHydrationMutation } from './useWaterQueries';

const mockFetchWaterLogs = vi.fn();
const mockInsertWaterLog = vi.fn();
const mockDeleteWaterLog = vi.fn();
const mockUpdateWaterLog = vi.fn();
const mockProcessHydrationEvent = vi.fn();

vi.mock('@/services/water.service', () => ({
  fetchWaterLogs: (...args: unknown[]) => mockFetchWaterLogs(...args),
  insertWaterLog: (...args: unknown[]) => mockInsertWaterLog(...args),
  deleteWaterLog: (...args: unknown[]) => mockDeleteWaterLog(...args),
  updateWaterLog: (...args: unknown[]) => mockUpdateWaterLog(...args),
  processHydrationEvent: (...args: unknown[]) => mockProcessHydrationEvent(...args),
}));

vi.mock('./useWaterData', () => ({
  toDateStr: () => '2026-01-15',
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWaterLogsQuery', () => {
  it('does not fetch when userId is undefined', () => {
    const { result } = renderHook(() => useWaterLogsQuery(undefined), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchWaterLogs).not.toHaveBeenCalled();
  });

  it('does not fetch when userId is too short', () => {
    const { result } = renderHook(() => useWaterLogsQuery('short-id'), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchWaterLogs).not.toHaveBeenCalled();
  });

  it('fetches water logs when valid userId provided', async () => {
    mockFetchWaterLogs.mockResolvedValue([{ id: '1', amount: 250 }]);
    const { result } = renderHook(() => useWaterLogsQuery('valid-user-id-thirty-chars-long!'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchWaterLogs).toHaveBeenCalledWith('valid-user-id-thirty-chars-long!', '2026-01-15');
    expect(result.current.data).toEqual([{ id: '1', amount: 250 }]);
  });
});

describe('useAddWaterMutation', () => {
  it('calls insertWaterLog with correct params', async () => {
    mockInsertWaterLog.mockResolvedValue({ id: 'new-id' });
    const { result } = renderHook(() => useAddWaterMutation(), { wrapper: createWrapper() });
    result.current.mutate({ userId: 'u1', amount: 250, name: 'Nước', exp: 5, day: '2026-01-15' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInsertWaterLog).toHaveBeenCalledWith({
      user_id: 'u1', amount: 250, name: 'Nước', exp: 5, day: '2026-01-15', created_at: undefined,
    });
  });
});

describe('useDeleteWaterMutation', () => {
  it('calls deleteWaterLog with correct params', async () => {
    mockDeleteWaterLog.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteWaterMutation(), { wrapper: createWrapper() });
    result.current.mutate({ id: 'log-1', userId: 'u1', day: '2026-01-15' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteWaterLog).toHaveBeenCalledWith('log-1', 'u1');
  });
});

describe('useUpdateWaterMutation', () => {
  it('calls updateWaterLog with correct params', async () => {
    mockUpdateWaterLog.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateWaterMutation(), { wrapper: createWrapper() });
    result.current.mutate({ id: 'log-1', userId: 'u1', day: '2026-01-15', amount: 300, exp: 6 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateWaterLog).toHaveBeenCalledWith('log-1', 'u1', { amount: 300, exp: 6 });
  });
});

describe('useProcessHydrationMutation', () => {
  it('calls processHydrationEvent with params', async () => {
    mockProcessHydrationEvent.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProcessHydrationMutation(), { wrapper: createWrapper() });
    result.current.mutate({ p_user_id: 'u1', p_amount_ml: 250, p_temp_c: 25, p_exercise_mins: 0, p_is_fasting: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockProcessHydrationEvent).toHaveBeenCalledOnce();
  });
});
