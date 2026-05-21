import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function makeChain(overrides: Record<string, unknown> = {}) {
  const data = 'data' in overrides ? overrides.data : [];
  const error = 'error' in overrides ? overrides.error : null;
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'in', 'order', 'range', 'filter', 'limit', 'single', 'maybeSingle', 'delete', 'update', 'insert'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.filter = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: data as unknown ?? null, error: null }));
  chain.single = vi.fn(() => Promise.resolve({ data: data as unknown ?? null, error: null }));
  chain.delete = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (value: unknown) => void) => resolve({ data, error }));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('water.service', () => {
  describe('fetchWaterLogs', () => {
    it('returns water logs for a user on a given day', async () => {
      const logs = [{ id: '1', amount: 250, day: '2026-01-01' }];
      mockFrom.mockReturnValue(makeChain({ data: logs }));
      const { fetchWaterLogs } = await import('./water.service');
      const result = await fetchWaterLogs('user-1', '2026-01-01');
      expect(mockFrom).toHaveBeenCalledWith('water_logs');
      expect(result).toEqual(logs);
    });

    it('returns empty array when no logs', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null }));
      const { fetchWaterLogs } = await import('./water.service');
      const result = await fetchWaterLogs('user-1', '2026-01-01');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }));
      const { fetchWaterLogs } = await import('./water.service');
      await expect(fetchWaterLogs('user-1', '2026-01-01')).rejects.toThrow('DB error');
    });
  });

  describe('insertWaterLog', () => {
    it('inserts a water log and returns id', async () => {
      mockFrom.mockReturnValue(makeChain({ data: { id: 'new-id' } }));
      const { insertWaterLog } = await import('./water.service');
      const result = await insertWaterLog({ user_id: 'user-1', amount: 250, name: 'Nước lọc', exp: 5, day: '2026-01-01' });
      expect(mockFrom).toHaveBeenCalledWith('water_logs');
      expect(result).toEqual({ id: 'new-id' });
    });
  });

  describe('processHydrationEvent', () => {
    it('calls process_hydration_event RPC', async () => {
      mockRpc.mockResolvedValue({ error: null });
      const { processHydrationEvent } = await import('./water.service');
      await processHydrationEvent({ p_user_id: 'u1', p_amount_ml: 250, p_temp_c: 25, p_exercise_mins: 0, p_is_fasting: false });
      expect(mockRpc).toHaveBeenCalledWith('process_hydration_event', { p_user_id: 'u1', p_amount_ml: 250, p_temp_c: 25, p_exercise_mins: 0, p_is_fasting: false });
    });
  });

  describe('recordHydrationEvent', () => {
    it('calls record_hydration_event RPC with idempotency key', async () => {
      mockRpc.mockResolvedValue({ data: { success: true, log_id: 'log-1' }, error: null });
      const { recordHydrationEvent } = await import('./water.service');
      const result = await recordHydrationEvent({
        p_user_id: 'u1', p_amount_ml: 250, p_temp_c: 25, p_exercise_mins: 0, p_is_fasting: false,
        p_client_event_id: 'evt-1', p_name: 'Nước', p_day: '2026-01-01', p_created_at: '2026-01-01T00:00:00Z',
      });
      expect(mockRpc).toHaveBeenCalledWith('record_hydration_event', {
        p_user_id: 'u1', p_amount_ml: 250, p_temp_c: 25, p_exercise_mins: 0, p_is_fasting: false,
        p_client_event_id: 'evt-1', p_name: 'Nước', p_day: '2026-01-01', p_created_at: '2026-01-01T00:00:00Z',
      });
      expect(result).toEqual({ success: true, log_id: 'log-1' });
    });
  });

  describe('deleteWaterLog', () => {
    it('deletes a water log by id and user_id', async () => {
      const chain = makeChain();
      mockFrom.mockReturnValue(chain);
      const { deleteWaterLog } = await import('./water.service');
      await deleteWaterLog('log-1', 'user-1');
      expect(mockFrom).toHaveBeenCalledWith('water_logs');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'log-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('updateWaterLog', () => {
    it('updates a water log by id and user_id', async () => {
      const chain = makeChain();
      mockFrom.mockReturnValue(chain);
      const { updateWaterLog } = await import('./water.service');
      await updateWaterLog('log-1', 'user-1', { amount: 300, exp: 6 });
      expect(mockFrom).toHaveBeenCalledWith('water_logs');
      expect(chain.update).toHaveBeenCalledWith({ amount: 300, exp: 6 });
      expect(chain.eq).toHaveBeenCalledWith('id', 'log-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('findExistingWaterLog', () => {
    it('returns matching log when found', async () => {
      mockFrom.mockReturnValue(makeChain({ data: { id: 'log-1' } }));
      const { findExistingWaterLog } = await import('./water.service');
      const result = await findExistingWaterLog({ user_id: 'u1', day: '2026-01-01', amount: 250, name: 'Nước lọc', created_at: '2026-01-01T00:00:00Z' });
      expect(result).toEqual({ id: 'log-1' });
    });

    it('returns null when no match', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null }));
      const { findExistingWaterLog } = await import('./water.service');
      const result = await findExistingWaterLog({ user_id: 'u1', day: '2026-01-01', amount: 250, name: 'Nước lọc', created_at: '2026-01-01T00:00:00Z' });
      expect(result).toBeNull();
    });
  });

  describe('fetchUserClubs', () => {
    it('returns club memberships', async () => {
      mockFrom.mockReturnValue(makeChain({ data: [{ club_id: 'club-1' }] }));
      const { fetchUserClubs } = await import('./water.service');
      const result = await fetchUserClubs('user-1');
      expect(result).toEqual([{ club_id: 'club-1' }]);
    });
  });

  describe('incrementClubIntake', () => {
    it('calls increment_club_member_intake RPC', async () => {
      mockRpc.mockResolvedValue({ error: null });
      const { incrementClubIntake } = await import('./water.service');
      await incrementClubIntake({ p_user_id: 'u1', p_club_id: 'club-1', p_amount_to_add: 250 });
      expect(mockRpc).toHaveBeenCalledWith('increment_club_member_intake', { p_user_id: 'u1', p_club_id: 'club-1', p_amount_to_add: 250 });
    });
  });

  describe('insertClubActivity', () => {
    it('inserts club activity record', async () => {
      const chain = makeChain();
      mockFrom.mockReturnValue(chain);
      const { insertClubActivity } = await import('./water.service');
      await insertClubActivity({ club_id: 'club-1', user_id: 'u1', type: 'water', message: 'đã uống nước', amount: 250 });
      expect(mockFrom).toHaveBeenCalledWith('club_activity');
      expect(chain.insert).toHaveBeenCalledWith({ club_id: 'club-1', user_id: 'u1', type: 'water', message: 'đã uống nước', amount: 250 });
    });
  });
});
