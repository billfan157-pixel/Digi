import { isSupabaseConfigured, supabase } from './supabase';

type AiGatewayAction =
  | 'advice'
  | 'chat'
  | 'report-analysis';

type AiGatewayError = {
  error?: string;
};

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
