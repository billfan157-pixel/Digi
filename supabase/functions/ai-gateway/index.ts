import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';

const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

const allowedOrigins = [
  appUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  ...(Deno.env.get('EXTRA_ALLOWED_ORIGINS')?.split(',').filter(Boolean) ?? []),
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.protocol === 'capacitor:' ||
      origin === 'capacitor://localhost'
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : appUrl;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  };
}

import { getModelForAction, getMaxTokensForAction } from '../_shared/modelRouter.ts';
import {
  sanitizeAndCapContext,
  parseAdviceResponse,
  parseNudgeResponse,
  parseChatResponse,
  logStructuredEvent,
  type DigiwellAiContext,
  type WaterAction
} from '../_shared/aiValidation.ts';

const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

type AiGatewayAction = 'advice' | 'chat' | 'report-analysis' | 'agentic' | 'nudge';

type AiUsageResult = {
  allowed?: boolean;
  limit?: number;
  remaining?: number;
};

type AiMemoryMessage = {
  role: string;
  content: string;
  created_at: string;
};

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type SupabaseGatewayError = { message: string };
type SupabaseGatewayResult<T = unknown> = PromiseLike<{
  data: T | null;
  error: SupabaseGatewayError | null;
}>;
type SupabaseGatewayQuery = SupabaseGatewayResult & {
  select: (columns: string) => SupabaseGatewayQuery;
  eq: (column: string, value: unknown) => SupabaseGatewayQuery;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseGatewayQuery;
  limit: (count: number) => SupabaseGatewayQuery;
  maybeSingle: () => SupabaseGatewayResult<Record<string, unknown>>;
  single: () => SupabaseGatewayResult<Record<string, unknown>>;
  insert: (values: unknown) => SupabaseGatewayQuery;
};
type SupabaseGatewayClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => SupabaseGatewayResult;
  from: (table: string) => SupabaseGatewayQuery;
};

const json = (body: Record<string, unknown>, status = 200, origin?: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin ?? null), 'Content-Type': 'application/json' },
  });

async function groqChat(body: Record<string, unknown>) {
  if (!groqApiKey.trim()) {
    throw new Error('AI server chưa được cấu hình.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Groq request failed (${response.status})`);
  }

  return data;
}

async function groqChatStream(body: Record<string, unknown>) {
  if (!groqApiKey.trim()) {
    throw new Error('AI server chưa được cấu hình.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!response.ok) {
    let message = `Groq request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.error?.message ?? message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('AI stream không khả dụng.');
  }

  return response.body;
}

function sseResponse(
  origin: string | null,
  start: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>,
) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void start(controller).catch((error) => {
        const encoder = new TextEncoder();
        const message = getErrorMessage(error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function encodeSse(event: string, body: Record<string, unknown>) {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(body)}\n\n`);
}

/**
 * Sanitize user-provided strings before interpolation into AI prompts.
 * Prevents prompt injection by removing instruction-like patterns.
 */
function sanitizeForPrompt(value: string, maxLength = 120): string {
  const trimmed = value.trim().slice(0, maxLength);
  // Remove common prompt injection patterns (case-insensitive)
  return trimmed
    .replace(/(?:ignore|bypass|override|disregard|system\s*(?:prompt|instruction)|previous\s*(?:instruction|prompt|directive)|you\s*are\s*(?:now|no\s*longer)|act\s*as|pretend\s*to\s*be)/gi, '[FILTERED]')
    .replace(/[<>{}[\]\\|`~^]/g, '') // strip chars that could break prompt structure
    .trim();
}

function buildContextSummary(context: DigiwellAiContext): string {
  const now = new Date(context.nowIso);
  const timeText = Number.isNaN(now.getTime())
    ? context.nowIso
    : new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
      }).format(now);

  return [
    `- Thời gian hiện tại: ${timeText}`,
    `- Lượng nước đã uống: ${context.waterIntake}/${context.waterGoal} ml`,
    ...(context.hydrationHistory?.length
      ? [
          `- Lịch sử uống nước gần đây: ${context.hydrationHistory
            .slice(-5)
            .map(day => `${day.date}: ${day.ml}ml`)
            .join('; ')}`,
        ]
      : []),
    context.weather
      ? `- Thời tiết: ${context.weather.temp}°C, ${sanitizeForPrompt(context.weather.status, 60)}${context.weather.location ? `, tại ${sanitizeForPrompt(context.weather.location, 60)}` : ''}`
      : '- Thời tiết: chưa đồng bộ',
    context.watch
      ? `- Đồng hồ sức khỏe: ${context.watch.heartRate} BPM, ${context.watch.steps} bước`
      : '- Đồng hồ sức khỏe: chưa đồng bộ',
    context.calendar
      ? `- Lịch: ${
          context.calendar.synced
            ? `đã đồng bộ${context.calendar.nextEventTitle ? `, sự kiện gần nhất: ${sanitizeForPrompt(context.calendar.nextEventTitle, 80)}` : ''}`
            : 'chưa đồng bộ'
        }`
      : '- Lịch: chưa đồng bộ',
    context.profile?.nickname ? `- Tên người dùng: ${sanitizeForPrompt(context.profile.nickname, 50)}` : null,
    context.profile?.goal ? `- Mục tiêu sức khỏe: ${sanitizeForPrompt(context.profile.goal, 80)}` : null,
    context.profile?.activity ? `- Mức vận động: ${sanitizeForPrompt(context.profile.activity, 50)}` : null,
    context.profile?.climate ? `- Môi trường/khí hậu: ${sanitizeForPrompt(context.profile.climate, 50)}` : null,
    ...(context.behaviorPatterns?.slice(0, 5).map(p => `- Thói quen uống: ${sanitizeForPrompt(p.pattern, 80)} (${Math.round(p.confidence * 100)}% tin cậy) — ${sanitizeForPrompt(p.recommendation, 100)}`) ?? []),
    ...(context.calendarEvents?.length ? context.calendarEvents.slice(0, 5).map(ev => `- Lịch: "${sanitizeForPrompt(ev.title, 80)}" (${ev.startRaw} → ${ev.endRaw})`) : []),
  ]
    .filter(Boolean)
    .join('\n');
}


function clampWaterAction(action: Partial<WaterAction>): WaterAction | undefined {
  const amount = Math.round(Number(action.amount));
  const factor = Number(action.factor);
  const name = typeof action.name === 'string' ? action.name.trim() : '';

  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (!Number.isFinite(factor) || name === '') return undefined;

  return {
    amount: Math.min(Math.max(amount, 30), 2000),
    factor: Math.min(Math.max(factor, -1), 1.5),
    name: name.slice(0, 80),
  };
}

const recordWaterIntakeTool = {
  type: 'function',
  function: {
    name: 'recordWaterIntake',
    description:
      'Gọi hàm này bất cứ khi nào người dùng nói họ vừa uống nước, trà, cà phê, sữa, bia, rượu hoặc muốn ghi nhận lượng uống.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'integer',
          description: 'Dung tích đồ uống tính bằng ml, ví dụ 200, 300, 500.',
        },
        factor: {
          type: 'number',
          description:
            'Hệ số hydration: nước/nước trái cây=1.0, cà phê/trà đậm=0.8, sữa/bù khoáng=1.1, bia/rượu/cồn=-0.5.',
        },
        name: {
          type: 'string',
          description: 'Tên loại đồ uống, ví dụ Nước lọc, Cà phê sữa, Trà đào, Bia.',
        },
      },
      required: ['amount', 'factor', 'name'],
    },
  },
};

function getErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key')) {
    return 'AI server key không hợp lệ.';
  }
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
    return 'AI đang bị giới hạn tốc độ. Thử lại sau ít giây.';
  }
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable')) {
    return 'AI tạm thời không khả dụng. Thử lại sau.';
  }
  if (raw.includes('AI server chưa được cấu hình')) {
    return 'AI server chưa được cấu hình.';
  }
  if (raw.toLowerCase().includes('model') && raw.toLowerCase().includes('not found')) {
    return 'Mô hình AI không khả dụng trên server.';
  }
  if (raw.toLowerCase().includes('invalid') && raw.toLowerCase().includes('json')) {
    return 'Phản hồi từ AI không đúng định dạng.';
  }

  return raw;
}

function getErrorStatus(error: unknown): number {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) return 429;
  if (raw.includes('401') || raw.toLowerCase().includes('invalid api key') || raw.toLowerCase().includes('unauthorized')) return 401;
  if (raw.includes('503') || raw.toLowerCase().includes('unavailable') || raw.toLowerCase().includes('timed out') || raw.toLowerCase().includes('timeout')) return 503;
  if (raw.includes('400') || raw.toLowerCase().includes('bad request')) return 400;
  if (raw.toLowerCase().includes('model') && raw.toLowerCase().includes('not found')) return 501;
  return 500;
}

async function enforceRateLimit(
  supabase: SupabaseGatewayClient,
  action: AiGatewayAction,
  origin: string | null,
): Promise<{
  response: Response | null;
  quotaResult?: { allowed: boolean; limit: number; remaining: number };
}> {
  const dbAction = (action === 'agentic' || action === 'nudge') ? 'advice' : action;
  const { data, error } = await supabase.rpc('consume_ai_usage', {
    p_action: dbAction,
  });

  if (error) {
    console.error('[ai-gateway] RPC consume_ai_usage failed:', error.message, JSON.stringify(error));
    return {
      response: json({ error: `Không thể kiểm tra giới hạn AI: ${error.message}` }, 500, origin),
    };
  }

  const usage = data as AiUsageResult | null;
  const allowed = !!usage?.allowed;
  const limit = usage?.limit ?? 0;
  const remaining = usage?.remaining ?? 0;
  const quotaResult = { allowed, limit, remaining };

  if (!allowed) {
    return {
      response: json({
        error: 'Bạn đã dùng hết lượt AI hôm nay.',
        limit,
        remaining,
      }, 429, origin),
      quotaResult,
    };
  }

  return { response: null, quotaResult };
}

async function getRecentAiMessages(
  supabase: SupabaseGatewayClient,
  userId: string,
): Promise<AiMemoryMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.warn('[ai-gateway] ai_messages select failed:', error.message);
    return [];
  }

  return ((data ?? []) as AiMemoryMessage[]).reverse();
}

function buildMemoryMessages(
  context: DigiwellAiContext,
  persistedMessages: AiMemoryMessage[],
): ChatCompletionMessage[] {
  const persisted = persistedMessages
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role === 'user' ? 'user' as const : 'assistant' as const,
      content: message.content.slice(0, 700),
    }));

  const clientHistory = (context.chatHistory ?? [])
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role === 'user' ? 'user' as const : 'assistant' as const,
      content: message.content.slice(0, 700),
    }));

  const merged = [...persisted, ...clientHistory];
  return merged.slice(-10);
}

async function getOrCreateAiConversation(
  supabase: SupabaseGatewayClient,
  userId: string,
  context: DigiwellAiContext,
) {
  const { data: existing, error: selectError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.warn('[ai-gateway] ai_conversations select failed:', selectError.message);
    return null;
  }

  if (existing?.id) return existing.id as string;

  const { data: inserted, error: insertError } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      title: 'DigiCoach',
      context,
    })
    .select('id')
    .single();

  if (insertError) {
    console.warn('[ai-gateway] ai_conversations insert failed:', insertError.message);
    return null;
  }

  return inserted?.id as string | null;
}

async function rememberAiExchange(
  supabase: SupabaseGatewayClient,
  userId: string,
  input: string,
  reply: string,
  context: DigiwellAiContext,
  waterAction?: WaterAction,
) {
  if (!input.trim() || !reply.trim()) return;

  const conversationId = await getOrCreateAiConversation(supabase, userId, context);
  if (!conversationId) return;

  const { error } = await supabase
    .from('ai_messages')
    .insert([
      {
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: input.slice(0, 4000),
        metadata: { source: 'chat' },
      },
      {
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content: reply.slice(0, 4000),
        metadata: waterAction ? { source: 'chat', waterAction } : { source: 'chat' },
      },
    ]);

  if (error) {
    console.warn('[ai-gateway] ai_messages insert failed:', error.message);
  }
}

function buildChatMessages(
  context: DigiwellAiContext,
  input: string,
  memoryMessages: ChatCompletionMessage[],
): ChatCompletionMessage[] {
  return [
    {
      role: 'system',
      content:
        'Bạn là trợ lý ảo AI của DigiWell. ' +
        'Trả lời bằng tiếng Việt, ngắn gọn tối đa 50 từ, thân thiện, hữu ích. ' +
        'Ưu tiên chủ đề uống nước, nghỉ ngơi, thói quen sinh hoạt, hydration coaching. ' +
        'Cá nhân hóa theo lịch sử uống nước, thói quen đã phát hiện, và các lần tư vấn gần đây. ' +
        'Nếu người dùng nói vừa uống hoặc muốn ghi nhận đồ uống, BẮT BUỘC gọi function recordWaterIntake. ' +
        'Không dùng markdown phức tạp.',
    },
    ...memoryMessages,
    {
      role: 'user',
      content: `Bối cảnh người dùng:\n${buildContextSummary(context)}\n\nTin nhắn: "${input}"`,
    },
  ];
}

async function streamChatResponse(
  supabase: SupabaseGatewayClient,
  userId: string,
  origin: string | null,
  input: string,
  context: DigiwellAiContext,
  memoryMessages: ChatCompletionMessage[],
  quotaResult?: { allowed: boolean; limit: number; remaining: number },
) {
  const streamStart = performance.now();
  const model = getModelForAction('chat');

  return sseResponse(origin, async (controller) => {
    const encoder = new TextEncoder();
    let fullReply = '';
    let waterAction: WaterAction | undefined;
    const fallbackUsed = false;
    const fallbackReason: string | undefined = undefined;

    const toolCalls: Record<number, { name?: string; arguments: string }> = {};
    let buffer = '';

    const emitDelta = (text: string) => {
      if (!text) return;
      fullReply += text;
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
    };

    const processBlock = (block: string) => {
      const dataLines = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());

      for (const dataLine of dataLines) {
        if (!dataLine || dataLine === '[DONE]') continue;

        const parsed = JSON.parse(dataLine);
        const delta = parsed.choices?.[0]?.delta;
        const content = delta?.content;
        if (typeof content === 'string') emitDelta(content);

        if (Array.isArray(delta?.tool_calls)) {
          for (const toolCall of delta.tool_calls) {
            const index = Number(toolCall.index ?? 0);
            const current = toolCalls[index] ?? { arguments: '' };
            if (toolCall.function?.name) current.name = toolCall.function.name;
            if (toolCall.function?.arguments) current.arguments += toolCall.function.arguments;
            toolCalls[index] = current;
          }
        }
      }
    };

    try {
      const body = await groqChatStream({
        model,
        max_tokens: getMaxTokensForAction('chat'),
        tools: [recordWaterIntakeTool],
        tool_choice: 'auto',
        messages: buildChatMessages(context, input, memoryMessages),
      });

      const reader = body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          if (block.trim()) processBlock(block);
        }
      }

      if (buffer.trim()) processBlock(buffer);

      const firstToolCall = toolCalls[0];
      if (firstToolCall?.name === 'recordWaterIntake') {
        let parsedArgs: Partial<WaterAction> = {};
        try {
          parsedArgs = JSON.parse(firstToolCall.arguments || '{}');
        } catch {
          parsedArgs = {};
        }

        waterAction = clampWaterAction(parsedArgs);
        if (waterAction) {
          const actionReply = `Đã ghi nhận bạn uống ${waterAction.amount}ml ${waterAction.name}.`;
          if (!fullReply.trim()) emitDelta(actionReply);
          controller.enqueue(encodeSse('waterAction', { waterAction }));
        }
      }

      const finalReply = fullReply.trim() || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.';
      await rememberAiExchange(supabase, userId, input, finalReply, context, waterAction);
      controller.enqueue(encodeSse('done', {}));
      controller.close();

      const latencyMs = Math.round(performance.now() - streamStart);
      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action: 'chat',
        model,
        userId,
        latencyMs,
        quotaResult,
        fallbackUsed,
        fallbackReason,
        success: true,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const latencyMs = Math.round(performance.now() - streamStart);
      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action: 'chat',
        model,
        userId,
        latencyMs,
        quotaResult,
        fallbackUsed: false,
        success: false,
        errorMessage: msg,
      });
      throw error;
    }
  });
}

Deno.serve(async (request) => {
  console.log('[ai-gateway] Invoked:', request.method, request.url, 'groqKeySet:', !!groqApiKey);
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Thiếu cấu hình Supabase server.' }, 500, origin);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized.' }, 401, origin);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  }) as unknown as SupabaseGatewayClient & ReturnType<typeof createClient>;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: 'Unauthorized.' }, 401, origin);
  }

  const startTime = performance.now();
  let action: AiGatewayAction | undefined = undefined;
  let model = 'unknown';
  let quotaResult: unknown = undefined;
  const userId = user.id;

  try {
    const gatewayLimit = await checkRateLimit(`ai-gateway:${user.id}`, RATE_LIMITS.aiGateway);
    if (!gatewayLimit.allowed) {
      return json({
        error: `AI đang nhận quá nhiều yêu cầu. Thử lại sau ${gatewayLimit.retryAfterSeconds} giây.`,
      }, 429, origin);
    }

    const body = (await request.json()) as Record<string, unknown>;
    action = body.action as AiGatewayAction;

    if (!action) {
      return json({ error: 'Missing action.' }, 400, origin);
    }

    try {
      model = getModelForAction(action);
    } catch {
      // Keep model as 'unknown'
    }

    // Validate and sanitize input based on action type
    // Validate context for 'advice', 'nudge', 'chat', and 'agentic' actions
    if (action === 'advice' || action === 'nudge' || action === 'chat' || action === 'agentic') {
      const context = body.context as Partial<DigiwellAiContext> | undefined;
      if (context) {
        if (typeof context !== 'object') {
          return json({ error: 'Invalid context object.' }, 400, origin);
        }
        // Validate and clamp/reject numeric fields
        if (context.waterIntake !== undefined && (!Number.isFinite(context.waterIntake) || context.waterIntake < 0 || context.waterIntake > 50000)) {
          return json({ error: 'Invalid or out of bounds waterIntake value.' }, 400, origin);
        }
        if (context.waterGoal !== undefined && (!Number.isFinite(context.waterGoal) || context.waterGoal <= 0 || context.waterGoal > 50000)) {
          return json({ error: 'Invalid or out of bounds waterGoal value.' }, 400, origin);
        }
        // Validate weather if present
        if (context.weather) {
          if (typeof context.weather.temp !== 'number' || context.weather.temp < -50 || context.weather.temp > 60) {
            return json({ error: 'Invalid weather temperature.' }, 400, origin);
          }
        }
      }
    }

    // Validate stats and entries for 'report-analysis' action
    if (action === 'report-analysis') {
      const stats = body.stats as Record<string, unknown>;
      const entries = body.entries;
      
      if (!stats || typeof stats !== 'object') {
        return json({ error: 'Invalid or missing stats.' }, 400, origin);
      }
      
      // Validate entries array
      if (!Array.isArray(entries)) {
        return json({ error: 'Invalid or missing entries array.' }, 400, origin);
      }
      if (entries.length > 100) {
        return json({ error: 'Entries array too large (max 100).' }, 400, origin);
      }
      
      // Sanitize string inputs to prevent prompt injection
      const periodLabel = String(body.periodLabel ?? '').slice(0, 50);
      if (periodLabel && periodLabel.length !== String(body.periodLabel ?? '').length) {
        body.periodLabel = periodLabel;
      }
    }

    const rateLimitCheck = await enforceRateLimit(supabase, action, origin);
    quotaResult = rateLimitCheck.quotaResult;
    if (rateLimitCheck.response) {
      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed: false,
        success: false,
        errorMessage: 'Rate limit / quota exceeded',
      });
      return rateLimitCheck.response;
    }

    const sanitizedContext = body.context ? sanitizeAndCapContext(body.context as Partial<DigiwellAiContext>) : undefined;

    if (action === 'advice') {
      if (!sanitizedContext) {
        return json({ error: 'Context is required for advice.' }, 400, origin);
      }
      const persistedMessages = await getRecentAiMessages(supabase, user.id);
      const memoryMessages = buildMemoryMessages(sanitizedContext, persistedMessages);
      const memoryText = memoryMessages.length
        ? `\n\nLịch sử tư vấn gần đây:\n${memoryMessages
            .map(message => `- ${message.role === 'user' ? 'Người dùng' : 'DigiCoach'}: ${message.content}`)
            .join('\n')}`
        : '';
      const response = await groqChat({
        model,
        max_tokens: getMaxTokensForAction('advice'),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Bạn là DigiCoach — trợ lý sức khỏe cá nhân hóa thông minh của DigiWell. Nhiệm vụ: Trả về một đối tượng JSON phân tích bối cảnh người dùng để cung cấp một lời khuyên sâu sắc và đề xuất hành động tiếp theo tốt nhất (nextBestAction).',
          },
          {
            role: 'user',
            content:
              `Bối cảnh hiện tại:\n${buildContextSummary(sanitizedContext)}${memoryText}\n\n` +
              'Yêu cầu phản hồi bằng JSON thuần với cấu trúc chính xác sau:\n' +
              '{\n' +
              '  "text": "lời khuyên (tối đa 40 chữ, thân thiện, tiếng Việt)",\n' +
              '  "nextBestAction": {\n' +
              '    "title": "tiêu đề hành động",\n' +
              '    "action": "nội dung hành động",\n' +
              '    "ml": 250,\n' +
              '    "icon": "sparkles"\n' +
              '  }\n' +
              '}\n\n' +
              'Chi tiết các trường:\n' +
              '- text: Lời khuyên huấn luyện uống nước/nghỉ ngơi thông minh, cá nhân hóa theo thói quen, lịch trình, thời tiết và lịch sử (tối đa 40 chữ, thân thiện, tiếng Việt).\n' +
              '- nextBestAction.title: Tiêu đề hành động ngắn gọn (ví dụ: "Cần bù nước gấp", "Bảo vệ chuỗi!", "Đánh thức cơ thể", "Trước khi ngủ", "Chuỗi tuyệt vời!").\n' +
              '- nextBestAction.action: Nội dung hành động cụ thể, thiết thực cho người dùng (ví dụ: "Uống 250ml nước ấm để khởi động cơ thể sau giấc ngủ dài.").\n' +
              '- nextBestAction.ml: Số nguyên (ml) khuyến nghị uống để thực hiện hành động này, hoặc 0 nếu không cần uống nước.\n' +
              '- nextBestAction.icon: Bắt buộc chỉ chọn 1 trong: "droplets" | "zap" | "alert" | "sparkles" | "clock" | "target" | "crown" | "award" | "weather" | "flame".',
          },
        ],
      });

      const rawContent = String(response.choices?.[0]?.message?.content ?? '');
      const parsedResult = parseAdviceResponse(rawContent);

      const promptTokens = response.usage?.prompt_tokens;
      const completionTokens = response.usage?.completion_tokens;

      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed: parsedResult.fallbackUsed,
        fallbackReason: parsedResult.fallbackReason,
        success: true,
        promptTokens,
        completionTokens,
      });

      return json(parsedResult.data, 200, origin);
    }

    if (action === 'chat') {
      if (!sanitizedContext) {
        return json({ error: 'Context is required for chat.' }, 400, origin);
      }
      const input = String(body.input ?? '');
      if (input.length > 2000) {
        return json({ error: 'Tin nhắn quá dài (tối đa 2000 ký tự).' }, 400, origin);
      }
      const persistedMessages = await getRecentAiMessages(supabase, user.id);
      const memoryMessages = buildMemoryMessages(sanitizedContext, persistedMessages);

      if (body.stream === true) {
        return streamChatResponse(supabase, user.id, origin, input, sanitizedContext, memoryMessages, quotaResult);
      }

      const response = await groqChat({
        model,
        max_tokens: getMaxTokensForAction('chat'),
        tools: [recordWaterIntakeTool],
        tool_choice: 'auto',
        messages: buildChatMessages(sanitizedContext, input, memoryMessages),
      });

      const choice = response.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;
      const promptTokens = response.usage?.prompt_tokens;
      const completionTokens = response.usage?.completion_tokens;

      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        const call = toolCalls[0];
        if (call.function?.name === 'recordWaterIntake') {
          let parsedArgs: Partial<WaterAction> = {};
          try {
            parsedArgs = JSON.parse(call.function.arguments ?? '{}');
          } catch {
            parsedArgs = {};
          }

          const waterAction = clampWaterAction(parsedArgs);
          if (waterAction) {
            const reply = `Đã ghi nhận bạn uống ${waterAction.amount}ml ${waterAction.name}.`;
            await rememberAiExchange(supabase, user.id, input, reply, sanitizedContext, waterAction);
            
            logStructuredEvent({
              timestamp: new Date().toISOString(),
              action,
              model,
              userId,
              latencyMs: Math.round(performance.now() - startTime),
              quotaResult,
              fallbackUsed: false,
              success: true,
              promptTokens,
              completionTokens,
            });

            return json({
              reply,
              waterAction,
            }, 200, origin);
          }
        }
      }

      const rawContent = String(choice?.message?.content ?? '').trim();
      let reply = '';
      let waterAction: WaterAction | undefined = undefined;
      let fallbackUsed = false;
      let fallbackReason: string | undefined = undefined;

      if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
        const parsedResult = parseChatResponse(rawContent);
        reply = parsedResult.data.reply;
        waterAction = parsedResult.data.waterAction;
        fallbackUsed = parsedResult.fallbackUsed;
        fallbackReason = parsedResult.fallbackReason;
      } else {
        reply = rawContent.replace(/\*/g, '').trim() || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.';
      }

      await rememberAiExchange(supabase, user.id, input, reply, sanitizedContext, waterAction);

      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed,
        fallbackReason,
        success: true,
        promptTokens,
        completionTokens,
      });

      return json({ reply, waterAction }, 200, origin);
    }

    if (action === 'report-analysis') {
      const stats = body.stats as Record<string, unknown>;
      const entries = Array.isArray(body.entries) ? body.entries : [];
      const periodLabel = sanitizeForPrompt(String(body.periodLabel ?? ''), 50);
      const profile = (body.profile ?? {}) as Record<string, unknown>;

      const entryText = entries
        .slice(0, 100)
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          const date = sanitizeForPrompt(String(row.date ?? ''), 20);
          const waterIntake = Number(row.waterIntake) || 0;
          const waterGoal = Number(row.waterGoal) || 0;
          const achieved = row.achieved === true;
          return `${date}: ${waterIntake}ml/${waterGoal}ml (${achieved ? 'đạt' : 'chưa đạt'})`;
        })
        .join('\n');

      const safeNickname = typeof profile.nickname === 'string' ? sanitizeForPrompt(profile.nickname, 50) : 'bạn';

      const prompt = `Bạn là Chuyên gia Sức khỏe AI của DigiWell — trả lời bằng tiếng Việt.
Hãy phân tích báo cáo hydrat hóa cho người dùng ${safeNickname}.

Thông tin:
- Kỳ báo cáo: ${periodLabel}
- Thành tích: ${Number(stats.goalsAchieved) || 0}/${Number(stats.totalDays) || 0} ngày đạt mục tiêu (${Number(stats.achievementRate) || 0}%).
- Nhịp tim trung bình: ${Number(profile.avgHeartRate) || 'N/A'} BPM.
- Nhật ký:
${entryText || '- Không có dữ liệu'}

Yêu cầu:
1. "analysis": Nhận xét sâu sắc, thân thiện về thói quen uống nước, sự kỷ luật, xu hướng hydrat hóa.
2. "recommendations": 3 gợi ý thực tế về cải thiện Hydration và vận động.

Trả về JSON thuần:
{
  "analysis": "...",
  "recommendations": ["...", "...", "..."]
}`;

      const response = await groqChat({
        model,
        max_tokens: getMaxTokensForAction('report-analysis'),
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = String(response.choices?.[0]?.message?.content ?? '');
      let analysis = '';
      let recommendations: string[] = [];
      let fallbackUsed = false;
      let fallbackReason: string | undefined = undefined;

      try {
        const parsed = JSON.parse(rawContent);
        analysis = typeof parsed.analysis === 'string' ? parsed.analysis : '';
        recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
        if (!analysis && recommendations.length === 0) {
          fallbackUsed = true;
          fallbackReason = 'Parsed JSON fields are empty/missing';
          analysis = 'Không có phân tích nào.';
        }
      } catch (err) {
        fallbackUsed = true;
        fallbackReason = err instanceof Error ? err.message : String(err);
        analysis = 'Không thể phân tích báo cáo lúc này.';
      }

      const promptTokens = response.usage?.prompt_tokens;
      const completionTokens = response.usage?.completion_tokens;

      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed,
        fallbackReason,
        success: true,
        promptTokens,
        completionTokens,
      });

      return json({ analysis, recommendations }, 200, origin);
    }

    if (action === 'agentic') {
      if (!sanitizedContext) {
        return json({ error: 'Context is required for agentic workflow.' }, 400, origin);
      }

      const prompt = `Bạn là Đại lý Lập kế hoạch Hydrat hóa AI của DigiWell, trả lời bằng tiếng Việt.
Nhiệm vụ của bạn là phân tích bối cảnh người dùng để đề xuất các hành động cải thiện thói quen uống nước và lên lịch thông minh.

Bối cảnh người dùng hiện tại:
${buildContextSummary(sanitizedContext)}

Dựa trên dữ liệu trên, hãy đề xuất một danh sách các hành động thích hợp (có thể trống nếu mọi thứ hoàn hảo). Bạn có thể gợi ý 3 loại hành động:
1. "adjustGoal": Nếu thời tiết nắng nóng (ví dụ >33 độ C) hoặc người dùng vận động nhiều, đề xuất tăng mục tiêu uống nước hôm nay.
2. "createReminder": Nếu lịch trình hôm nay có các buổi họp dài liên tục (>2 tiếng), các hoạt động thể thao/gym, hoặc thời gian bận rộn bối cảnh học tập/làm việc, hãy đề xuất một lời nhắc nhở uống nước với khung giờ cụ thể trước/trong buổi đó.
3. "suggestSchedule": Nếu thói quen của người dùng cho thấy họ hay quên uống nước vào một buổi nhất định hoặc lượng uống phân bổ kém, hãy đề xuất một lịch trình uống nước chia nhỏ thông minh (ví dụ 3-4 khung giờ uống nước lọc/trà).

Hãy trả về phản hồi định dạng JSON chính xác:
{
  "actions": [
    {
      "type": "adjustGoal",
      "reason": "lý do tăng mục tiêu",
      "suggestedGoal": 2500,
      "delta": 300
    },
    {
      "type": "createReminder",
      "reason": "lý do nhắc nhở",
      "time": "13:50",
      "message": "lời nhắn nhắc nhở"
    },
    {
      "type": "suggestSchedule",
      "reason": "lý do đề xuất lịch trình",
      "intervals": ["07:30", "10:00", "14:30", "17:00", "20:00"]
    }
  ]
}

Chi tiết các trường:
- actions: Mảng các hành động đề xuất.
- Đối với hành động type = "adjustGoal":
  + reason: Giải thích ngắn gọn lý do tăng mục tiêu bằng tiếng Việt (ví dụ: Nắng nóng 36°C)
  + suggestedGoal: lượng nước mục tiêu đề xuất mới (ml) dưới dạng số nguyên
  + delta: lượng nước tăng thêm so với mục tiêu hiện tại (ml) dưới dạng số nguyên
- Đối với hành động type = "createReminder":
  + reason: Giải thích lý do nhắc nhở (ví dụ: Bạn có lịch họp dài từ 14:00 đến 16:00)
  + time: định dạng HH:MM (khung giờ uống nước trước/trong sự kiện)
  + message: Lời nhắn thân thiện tiếng Việt, xưng hô đệ/DigiCoach hoặc bạn/tôi (ví dụ: "Uống 250ml nước trước khi bắt đầu buổi họp dài đệ nhé!")
- Đối với hành động type = "suggestSchedule":
  + reason: Giải thích lý do đề xuất lịch trình này
  + intervals: danh sách các mốc thời gian đề xuất (mảng các chuỗi định dạng HH:MM)`;

      const response = await groqChat({
        model,
        max_tokens: getMaxTokensForAction('agentic'),
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = String(response.choices?.[0]?.message?.content ?? '');
      let actions: unknown[] = [];
      let fallbackUsed = false;
      let fallbackReason: string | undefined = undefined;

      try {
        const parsed = JSON.parse(rawContent);
        actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      } catch (err) {
        fallbackUsed = true;
        fallbackReason = err instanceof Error ? err.message : String(err);
      }

      const promptTokens = response.usage?.prompt_tokens;
      const completionTokens = response.usage?.completion_tokens;

      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed,
        fallbackReason,
        success: true,
        promptTokens,
        completionTokens,
      });

      return json({ actions }, 200, origin);
    }

    if (action === 'nudge') {
      if (!sanitizedContext) {
        return json({ error: 'Invalid or missing context.' }, 400, origin);
      }

      const prompt = `Bạn là DigiCoach — trợ lý sức khỏe cá nhân hóa của DigiWell. Nhiệm vụ: tạo 1 nudge (lời nhắc nhở ngắn gọn) bằng tiếng Việt.

Bối cảnh hiện tại:
${buildContextSummary(sanitizedContext)}

Yêu cầu:
- Cá nhân hóa dựa trên thời tiết, lịch sử uống nước, lịch trình và thói quen.
- Ngắn gọn, thân thiện, tối đa 20 chữ. Không dùng markdown.
- Trả về JSON thuần với 2 trường: message (string) và suggestedAmount (number, ml đề xuất, 0 nếu không đề xuất).

Ví dụ:
{
  "message": "Trời nóng 35°C, đừng quên uống 300ml nước lọc trước buổi họp nhé!",
  "suggestedAmount": 300
}`;

      const response = await groqChat({
        model,
        max_tokens: getMaxTokensForAction('nudge'),
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = String(response.choices?.[0]?.message?.content ?? '');
      const parsedResult = parseNudgeResponse(rawContent);

      const promptTokens = response.usage?.prompt_tokens;
      const completionTokens = response.usage?.completion_tokens;

      logStructuredEvent({
        timestamp: new Date().toISOString(),
        action,
        model,
        userId,
        latencyMs: Math.round(performance.now() - startTime),
        quotaResult,
        fallbackUsed: parsedResult.fallbackUsed,
        fallbackReason: parsedResult.fallbackReason,
        success: true,
        promptTokens,
        completionTokens,
      });

      return json(parsedResult.data, 200, origin);
    }

    return json({ error: `Unsupported action "${action}".` }, 400, origin);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 4).join('\n') : '';
    const name = error instanceof Error ? error.name : typeof error;
    const status = getErrorStatus(error);
    console.error(
      `[ai-gateway] ${status} ${name}: ${msg}` +
        (stack ? `\n  Stack: ${stack}` : ''),
    );

    logStructuredEvent({
      timestamp: new Date().toISOString(),
      action: String(action || 'unknown'),
      model: String(model || 'unknown'),
      userId: userId || undefined,
      latencyMs: Math.round(performance.now() - startTime),
      quotaResult: quotaResult ?? undefined,
      fallbackUsed: false,
      success: false,
      errorMessage: msg,
    });

    return json({ error: getErrorMessage(error) }, status, origin);
  }
});
