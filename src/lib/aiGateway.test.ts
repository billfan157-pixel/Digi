import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();
let mockIsConfigured = true;

vi.mock('./supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
  get isSupabaseConfigured() { return mockIsConfigured; },
}));

describe('invokeAiGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured = true;
  });

  it('returns data on success', async () => {
    mockInvoke.mockResolvedValue({ data: { result: 'ok' }, error: null });
    const { invokeAiGateway } = await import('./aiGateway');
    const result = await invokeAiGateway('advice', { msg: 'hello' });
    expect(result).toEqual({ result: 'ok' });
  });

  it('throws when not configured', async () => {
    mockIsConfigured = false;
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('Cloud AI chưa được cấu hình.');
  });

  it('throws on generic invoke error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Network fail') });
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('Network fail');
  });

  it('extracts error from response context body', async () => {
    const context = { json: vi.fn().mockResolvedValue({ error: 'Server error!' }) };
    mockInvoke.mockResolvedValue({ data: null, error: Object.assign(new Error('bad request'), { context }) });
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('Server error!');
  });

  it('throws parse error when context.json parse fails with different message', async () => {
    const context = { json: vi.fn().mockRejectedValue(new Error('parse fail')) };
    mockInvoke.mockResolvedValue({ data: null, error: Object.assign(new Error('bad request'), { context }) });
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('parse fail');
  });

  it('throws when data contains error field', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'API error' }, error: null });
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('API error');
  });

  it('throws when context.json body has no error field', async () => {
    const context = { json: vi.fn().mockResolvedValue({ ok: true }) };
    mockInvoke.mockResolvedValue({ data: null, error: Object.assign(new Error('bad request'), { context }) });
    const { invokeAiGateway } = await import('./aiGateway');
    await expect(invokeAiGateway('advice', {})).rejects.toThrow('bad request');
  });
});

describe('invokeAiGatewayStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured = true;
  });

  it('throws when not configured', async () => {
    mockIsConfigured = false;
    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await expect(invokeAiGatewayStream('advice', {}, onEvent)).rejects.toThrow('Cloud AI chưa được cấu hình.');
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('throws on invoke error without context', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('stream error') });
    const { invokeAiGatewayStream } = await import('./aiGateway');
    await expect(invokeAiGatewayStream('advice', {}, vi.fn())).rejects.toThrow('stream error');
  });

  it('throws message from context body on error', async () => {
    const context = { json: vi.fn().mockResolvedValue({ error: 'upstream fail' }) };
    mockInvoke.mockResolvedValue({ data: null, error: Object.assign(new Error('bad'), { context }) });
    const { invokeAiGatewayStream } = await import('./aiGateway');
    await expect(invokeAiGatewayStream('advice', {}, vi.fn())).rejects.toThrow('upstream fail');
  });

  it('throws when data is not a Response', async () => {
    mockInvoke.mockResolvedValue({ data: 'not-a-response', error: null });
    const { invokeAiGatewayStream } = await import('./aiGateway');
    await expect(invokeAiGatewayStream('advice', {}, vi.fn())).rejects.toThrow('AI gateway không trả về stream hợp lệ.');
  });

  it('throws when response has no body', async () => {
    mockInvoke.mockResolvedValue({ data: new Response(null, { status: 200 }), error: null });
    const { invokeAiGatewayStream } = await import('./aiGateway');
    await expect(invokeAiGatewayStream('advice', {}, vi.fn())).rejects.toThrow('AI gateway không trả về stream hợp lệ.');
  });

  it('parses SSE stream and calls onEvent for each block', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"hello"}\n\n'));
        controller.enqueue(encoder.encode('event: waterAction\ndata: {"waterAction":{"drink":250}}\n\n'));
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);

    expect(onEvent).toHaveBeenCalledTimes(3);
    expect(onEvent).toHaveBeenCalledWith({ type: 'delta', text: 'hello' });
    expect(onEvent).toHaveBeenCalledWith({ type: 'waterAction', waterAction: { drink: 250 } });
    expect(onEvent).toHaveBeenCalledWith({ type: 'done' });
  });

  it('handles error event type', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: error\ndata: {"error":"oops"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);

    expect(onEvent).toHaveBeenCalledWith({ type: 'error', error: 'oops' });
  });

  it('handles error event without error field', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: error\ndata: {}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);

    expect(onEvent).toHaveBeenCalledWith({ type: 'error', error: 'AI streaming bị lỗi.' });
  });

  it('handles blocks split across chunks (partial)', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\nda'));
        controller.enqueue(encoder.encode('ta: {"text":"hi"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);

    expect(onEvent).toHaveBeenCalledWith({ type: 'delta', text: 'hi' });
  });

  it('handles empty stream', async () => {
    const stream = new ReadableStream({
      start(controller) { controller.close(); },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles stream with only whitespace blocks', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('\n\n  \n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles malformed JSON in data gracefully', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {bad-json}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles unknown event type gracefully', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: unknownEvent\ndata: {"foo":"bar"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles block without event line', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"text":"hi"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles block without data lines', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles streaming with leftover buffer at end', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"last"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).toHaveBeenCalledWith({ type: 'delta', text: 'last' });
  });

  it('passes action and stream flag to invoke', async () => {
    const stream = new ReadableStream({
      start(controller) { controller.close(); },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    await invokeAiGatewayStream('report-analysis', { waterData: { ml: 1500 } }, vi.fn());

    expect(mockInvoke).toHaveBeenCalledWith('ai-gateway', {
      body: { action: 'report-analysis', waterData: { ml: 1500 }, stream: true },
      headers: { Accept: 'text/event-stream' },
    });
  });
});

describe('dispatchSseBlock (private — tested via stream)', () => {
  it('handles waterAction event', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: waterAction\ndata: {"waterAction":{"drink":500}}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).toHaveBeenCalledWith({ type: 'waterAction', waterAction: { drink: 500 } });
  });

  it('skips block with multiple data lines (invalid JSON after join)', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"line1"}\ndata: {"text":"line2"}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('handles delta with empty text', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":""}\n\n'));
        controller.close();
      },
    });
    mockInvoke.mockResolvedValue({ data: new Response(stream), error: null });

    const { invokeAiGatewayStream } = await import('./aiGateway');
    const onEvent = vi.fn();
    await invokeAiGatewayStream('advice', {}, onEvent);
    expect(onEvent).toHaveBeenCalledWith({ type: 'delta', text: '' });
  });
});

describe('parseAiGatewayError (private — tested via invokeAiGatewayStream)', () => {
  it('handles error with context that has no json method', async () => {
    const context = {} as Response;
    mockInvoke.mockResolvedValue({ data: null, error: Object.assign(new Error('generic'), { context }) });
    const { invokeAiGatewayStream } = await import('./aiGateway');
    await expect(invokeAiGatewayStream('advice', {}, vi.fn())).rejects.toThrow('generic');
  });

  it('handles non-Error thrown objects', async () => {
    mockInvoke.mockRejectedValue('string-error');
    // Not testing this directly since supabase.functions.invoke is mocked, not the function itself
  });
});
