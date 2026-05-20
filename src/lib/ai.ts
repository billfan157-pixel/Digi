import { invokeAiGateway, invokeAiGatewayStream, type AiGatewayStreamEvent } from './aiGateway';
import { isSupabaseConfigured, supabase } from './supabase';

export type AiChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export type DigiwellAiContext = {
  nowIso: string;
  waterIntake: number;
  waterGoal: number;
  hydrationHistory?: Array<{ date: string; ml: number }>;
  weather?: { temp: number; status: string; location: string };
  watch?: { heartRate: number; steps: number };
  calendar?: { synced: boolean; nextEventTitle?: string };
  profile?: { nickname?: string; goal?: string; activity?: string; climate?: string };
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  behaviorPatterns?: Array<{
    pattern: string;
    confidence: number;
    recommendation: string;
  }>;
  calendarEvents?: Array<{
    title: string;
    startRaw: string;
    endRaw: string;
  }>;
};

type WaterAction = {
  amount: number;
  factor: number;
  name: string;
};

export type AiAdviceResponse = {
  text: string;
};

const FRIENDLY_FALLBACK_ADVICE: AiAdviceResponse = {
  text: 'Hệ thống AI đang bận một chút. Tạm thời hãy uống thêm vài ngụm nước nhỏ và nghỉ 1-2 phút nhé!',
};

function getAiErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.toLowerCase().includes('rate limit')) {
    return 'AI đang bị giới hạn tốc độ. Thử lại sau ít giây.';
  }
  if (raw.toLowerCase().includes('unauthorized')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (raw.includes('AI server chưa được cấu hình')) {
    return 'AI server chưa được cấu hình.';
  }

  return raw;
}



export async function fetchChatHistory(userId: string, limit = 20): Promise<AiChatMessage[]> {
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('[fetchChatHistory]', error.message);
    return [];
  }

  return (data ?? []).map((msg) => ({
    role: msg.role as 'user' | 'model',
    content: msg.content,
  }));
}

export function isAiConfigured(): boolean {
  return isSupabaseConfigured;
}

export async function generateHydrationAdvice(context: DigiwellAiContext): Promise<AiAdviceResponse> {
  try {
    const response = await invokeAiGateway<AiAdviceResponse>('advice', { context });

    return {
      text: response.text || FRIENDLY_FALLBACK_ADVICE.text,
    };
  } catch (error) {
    const message = getAiErrorMessage(error);
    if (message.toLowerCase().includes('rate limit')) {
      return {
        text: 'AI đang bận, tạm thời hãy uống thêm nước đều trong ngày nhé!',
      };
    }
    return FRIENDLY_FALLBACK_ADVICE;
  }
}

export async function sendAiChatMessage(
  input: string,
  context: DigiwellAiContext,
): Promise<{ reply: string; waterAction?: WaterAction }> {
  try {
    const response = await invokeAiGateway<{ reply?: string; waterAction?: WaterAction }>('chat', {
      input,
      context,
    });

    return {
      reply: response.reply?.trim() || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.',
      waterAction: response.waterAction,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    return { reply: msg || 'Hệ thống AI đang bận một chút, bạn thử lại sau nhé.' };
  }
}

export async function streamAiChatMessage(
  input: string,
  context: DigiwellAiContext,
  onEvent: (event: AiGatewayStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  await invokeAiGatewayStream('chat', { input, context }, onEvent, signal);
}
