import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockIsConfigured = true;
const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('./aiGateway', () => ({
  invokeAiGateway: (...args: unknown[]) => mockInvoke(...args),
  invokeAiGatewayStream: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
  get isSupabaseConfigured() { return mockIsConfigured; },
}));

function buildChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = vi.fn((resolve: (value: unknown) => void) => resolve(result));
  return chain;
}

describe('fetchChatHistory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured = true; });

  it('returns messages on success', async () => {
    mockFrom.mockReturnValue(buildChain({
      data: [
        { role: 'user', content: 'Hello', created_at: '2026-01-01' },
        { role: 'assistant', content: 'Hi!', created_at: '2026-01-01' },
      ],
      error: null,
    }));
    const { fetchChatHistory } = await import('./ai');
    const result = await fetchChatHistory('user1');
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toBe('Hello');
    expect(result[1].role).toBe('assistant');
    expect(result[1].content).toBe('Hi!');
  });

  it('returns empty array when not configured', async () => {
    mockIsConfigured = false;
    const { fetchChatHistory } = await import('./ai');
    const result = await fetchChatHistory('user1');
    expect(result).toEqual([]);
  });

  it('returns empty array for empty userId', async () => {
    const { fetchChatHistory } = await import('./ai');
    const result = await fetchChatHistory('');
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error('fail') }));
    const { fetchChatHistory } = await import('./ai');
    const result = await fetchChatHistory('user1');
    expect(result).toEqual([]);
  });
});

describe('generateHydrationAdvice', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns text from gateway on success', async () => {
    mockInvoke.mockResolvedValue({ text: 'Uống thêm nước đi đệ!' });
    const { generateHydrationAdvice } = await import('./ai');
    const result = await generateHydrationAdvice({ nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.text).toBe('Uống thêm nước đi đệ!');
  });

  it('uses fallback when gateway returns no text', async () => {
    mockInvoke.mockResolvedValue({});
    const { generateHydrationAdvice } = await import('./ai');
    const result = await generateHydrationAdvice({ nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.text).toContain('bận');
  });

  it('returns rate limit message on rate limit error', async () => {
    mockInvoke.mockRejectedValue(new Error('rate limit exceeded'));
    const { generateHydrationAdvice } = await import('./ai');
    const result = await generateHydrationAdvice({ nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.text).toContain('bận');
  });

  it('returns fallback on generic error', async () => {
    mockInvoke.mockRejectedValue(new Error('network error'));
    const { generateHydrationAdvice } = await import('./ai');
    const result = await generateHydrationAdvice({ nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.text).toContain('bận');
  });
});

describe('sendAiChatMessage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns reply and waterAction on success', async () => {
    mockInvoke.mockResolvedValue({ reply: 'Đã ghi nhận 200ml.', waterAction: { amount: 200, factor: 1, name: 'Nước' } });
    const { sendAiChatMessage } = await import('./ai');
    const result = await sendAiChatMessage('uống nước', { nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.reply).toBe('Đã ghi nhận 200ml.');
    expect(result.waterAction?.amount).toBe(200);
  });

  it('returns fallback reply when gateway returns empty', async () => {
    mockInvoke.mockResolvedValue({});
    const { sendAiChatMessage } = await import('./ai');
    const result = await sendAiChatMessage('test', { nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.reply).toBe('Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.');
  });

  it('returns error message on failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Server error'));
    const { sendAiChatMessage } = await import('./ai');
    const result = await sendAiChatMessage('test', { nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.reply).toBe('Server error');
  });

  it('returns generic fallback on empty error', async () => {
    mockInvoke.mockRejectedValue(new Error(''));
    const { sendAiChatMessage } = await import('./ai');
    const result = await sendAiChatMessage('test', { nowIso: '', waterIntake: 500, waterGoal: 2000 });
    expect(result.reply).toContain('bận');
  });
});
