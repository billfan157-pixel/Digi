import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  },
  isSupabaseConfigured: true,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('track', () => {
  it('inserts an analytics event with user_id when session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(insertChain);

    const { track } = await import('./analytics');
    await track('page_view', { page: 'home' });

    expect(mockFrom).toHaveBeenCalledWith('analytics_events');
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      event_name: 'page_view',
      properties: { page: 'home' },
    }));
  });

  it('inserts with null user_id when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(insertChain);

    const { track } = await import('./analytics');
    await track('button_click');

    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: null,
      event_name: 'button_click',
    }));
  });

  it('does not throw on insert error', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const insertChain = { insert: vi.fn().mockRejectedValue(new Error('DB down')) };
    mockFrom.mockReturnValue(insertChain);

    const { track } = await import('./analytics');
    await expect(track('test_event')).resolves.toBeUndefined();
  });

  it('generates a session ID and persists it', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(insertChain);

    const { track } = await import('./analytics');
    await track('first_event');
    const firstSid = (insertChain.insert.mock.calls[0][0] as Record<string, unknown>).session_id;

    await track('second_event');
    const secondSid = (insertChain.insert.mock.calls[1][0] as Record<string, unknown>).session_id;

    expect(firstSid).toEqual(secondSid);
    expect(firstSid).toMatch(/^sess_/);
  });
});
