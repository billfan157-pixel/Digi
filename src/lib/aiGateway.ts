import { isSupabaseConfigured, supabase } from './supabase';

type AiGatewayAction =
  | 'advice'
  | 'chat'
  | 'report-analysis';

type AiGatewayError = {
  error?: string;
};

export type AiGatewayStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'waterAction'; waterAction: unknown }
  | { type: 'done' }
  | { type: 'error'; error: string };

function parseAiGatewayError(error: unknown): Error {
  const context = (error as { context?: Response }).context;
  if (context && typeof context.json === 'function') {
    return new Error('AI gateway trả về lỗi.');
  }
  return error instanceof Error
    ? error
    : new Error('Không thể kết nối AI gateway.');
}

export async function invokeAiGateway<T>(
  action: AiGatewayAction,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud AI chưa được cấu hình.');
  }

  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: { action, ...payload },
  });

  if (error) {
    // Extract the real error message from the response body if available
    // (supabase-js only gives a generic message for non-2xx responses)
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json() as AiGatewayError;
        if (body?.error) {
          if (import.meta.env.DEV) console.error('[AI Gateway] Server error:', body.error);
          throw new Error(body.error);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
      }
    }
    if (import.meta.env.DEV) console.error('[AI Gateway] Invoke error:', error.message);
    throw new Error(error.message || 'Không thể kết nối AI gateway.');
  }

  const response = data as AiGatewayError | null;
  if (response?.error) {
    throw new Error(response.error);
  }

  return data as T;
}

function dispatchSseBlock(block: string, onEvent: (event: AiGatewayStreamEvent) => void) {
  const eventLine = block.split('\n').find((line) => line.startsWith('event:'));
  const dataLines = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());

  if (!eventLine || dataLines.length === 0) return;

  const eventType = eventLine.slice(6).trim();
  const rawData = dataLines.join('\n');

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    return;
  }

  if (eventType === 'delta') {
    onEvent({ type: 'delta', text: String(payload.text ?? '') });
  } else if (eventType === 'waterAction') {
    onEvent({ type: 'waterAction', waterAction: payload.waterAction });
  } else if (eventType === 'done') {
    onEvent({ type: 'done' });
  } else if (eventType === 'error') {
    onEvent({ type: 'error', error: String(payload.error ?? 'AI streaming bị lỗi.') });
  }
}

export async function invokeAiGatewayStream(
  action: AiGatewayAction,
  payload: Record<string, unknown>,
  onEvent: (event: AiGatewayStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud AI chưa được cấu hình.');
  }

  const { data, error } = await supabase.functions.invoke<Response>('ai-gateway', {
    body: { action, ...payload, stream: true },
    headers: { Accept: 'text/event-stream' },
    signal,
  });

  if (error) {
    const parsed = parseAiGatewayError(error);
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json() as AiGatewayError;
        throw new Error(body?.error || parsed.message);
      } catch (parseErr) {
        if (parseErr instanceof Error) throw parseErr;
      }
    }
    throw parsed;
  }

  if (!(data instanceof Response) || !data.body) {
    throw new Error('AI gateway không trả về stream hợp lệ.');
  }

  const reader = data.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (signal?.aborted) {
    reader.cancel();
    return;
  }

  while (true) {
    if (signal?.aborted) {
      reader.cancel();
      return;
    }
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      if (block.trim()) dispatchSseBlock(block, onEvent);
    }
  }

  if (buffer.trim()) dispatchSseBlock(buffer, onEvent);
}
