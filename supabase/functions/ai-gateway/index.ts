import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';

const appUrl = Deno.env.get('APP_URL') ?? 'https://digiwell-app.vercel.app';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

const allowedOrigins = [
  appUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'capacitor://localhost',
  ...(Deno.env.get('EXTRA_ALLOWED_ORIGINS')?.split(',').filter(Boolean) ?? []),
];

function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : appUrl;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  };
}

import { getModelForAction, getMaxTokensForAction } from '../_shared/modelRouter.ts';

const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

type AiGatewayAction = 'advice' | 'chat' | 'report-analysis' | 'agentic';

type AiUsageResult = {
  allowed?: boolean;
  limit?: number;
  remaining?: number;
};

type DigiwellAiContext = {
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
            .slice(-14)
            .map(day => `${day.date}: ${day.ml}ml`)
            .join('; ')}`,
        ]
      : []),
    context.weather
      ? `- Thời tiết: ${context.weather.temp}°C, ${sanitizeForPrompt(context.weather.status, 60)}, tại ${sanitizeForPrompt(context.weather.location, 60)}`
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
    ...(context.behaviorPatterns?.map(p => `- Thói quen uống: ${sanitizeForPrompt(p.pattern, 80)} (${Math.round(p.confidence * 100)}% tin cậy) — ${sanitizeForPrompt(p.recommendation, 100)}`) ?? []),
    ...(context.calendarEvents?.length ? context.calendarEvents.map(ev => `- Lịch: "${sanitizeForPrompt(ev.title, 80)}" (${ev.startRaw} → ${ev.endRaw})`) : []),
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
) {
  const dbAction = action === 'agentic' ? 'advice' : action;
  const { data, error } = await supabase.rpc('consume_ai_usage', {
    p_action: dbAction,
  });

  if (error) {
    console.error('[ai-gateway] RPC consume_ai_usage failed:', error.message, JSON.stringify(error));
    return json({ error: `Không thể kiểm tra giới hạn AI: ${error.message}` }, 500, origin);
  }

  const usage = data as AiUsageResult | null;
  if (!usage?.allowed) {
    return json({
      error: 'Bạn đã dùng hết lượt AI hôm nay.',
      limit: usage?.limit ?? 0,
      remaining: 0,
    }, 429, origin);
  }

  return null;
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
      role: message.role,
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
) {
  return sseResponse(origin, async (controller) => {
    const encoder = new TextEncoder();
    const body = await groqChatStream({
      model: getModelForAction('chat'),
      max_tokens: getMaxTokensForAction('chat'),
      tools: [recordWaterIntakeTool],
      tool_choice: 'auto',
      messages: buildChatMessages(context, input, memoryMessages),
    });

    const reader = body.getReader();
    const decoder = new TextDecoder();
    const toolCalls: Record<number, { name?: string; arguments: string }> = {};
    let buffer = '';
    let fullReply = '';
    let waterAction: WaterAction | undefined;

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

  try {
    const gatewayLimit = await checkRateLimit(`ai-gateway:${user.id}`, RATE_LIMITS.aiGateway);
    if (!gatewayLimit.allowed) {
      return json({
        error: `AI đang nhận quá nhiều yêu cầu. Thử lại sau ${gatewayLimit.retryAfterSeconds} giây.`,
      }, 429, origin);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as AiGatewayAction;

    if (!action) {
      return json({ error: 'Missing action.' }, 400, origin);
    }

    // Validate and sanitize input based on action type
    // Validate context for 'advice' action
    if (action === 'advice') {
      const context = body.context as Partial<DigiwellAiContext>;
      if (!context || typeof context !== 'object') {
        return json({ error: 'Invalid or missing context.' }, 400, origin);
      }
      // Validate numeric fields
      if (context.waterIntake !== undefined && (!Number.isFinite(context.waterIntake) || context.waterIntake < 0)) {
        return json({ error: 'Invalid waterIntake value.' }, 400, origin);
      }
      if (context.waterGoal !== undefined && (!Number.isFinite(context.waterGoal) || context.waterGoal <= 0)) {
        return json({ error: 'Invalid waterGoal value.' }, 400, origin);
      }
      // Validate weather if present
      if (context.weather) {
        if (typeof context.weather.temp !== 'number' || context.weather.temp < -50 || context.weather.temp > 60) {
          return json({ error: 'Invalid weather temperature.' }, 400, origin);
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

    const rateLimitResponse = await enforceRateLimit(supabase, action, origin);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (action === 'advice') {
      const context = body.context as DigiwellAiContext;
      const persistedMessages = await getRecentAiMessages(supabase, user.id);
      const memoryMessages = buildMemoryMessages(context, persistedMessages);
      const memoryText = memoryMessages.length
        ? `\n\nLịch sử tư vấn gần đây:\n${memoryMessages
            .map(message => `- ${message.role === 'user' ? 'Người dùng' : 'DigiCoach'}: ${message.content}`)
            .join('\n')}`
        : '';
      const response = await groqChat({
        model: getModelForAction('advice'),
        max_tokens: getMaxTokensForAction('advice'),
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý sức khỏe AI của app DigiWell, chuyên huấn luyện uống nước thông minh. ' +
              'Trả lời bằng tiếng Việt, ngắn gọn tối đa 35 chữ, thân thiện. Không dùng markdown.',
          },
          {
            role: 'user',
            content:
              `Bối cảnh hiện tại:\n${buildContextSummary(context)}${memoryText}\n\n` +
              'Đưa ra 1 lời khuyên ngắn gọn về uống nước/nghỉ ngơi. ' +
              'Nếu có lịch trình, hãy phân tích loại lịch (học, họp, tập gym, đi chơi, ngủ...) ' +
              'và đưa ra lời khuyên phù hợp với từng loại. ' +
              'Nếu thiếu nhiều nước thì nhắc uống sớm. Nếu gần đạt mục tiêu thì động viên nhẹ. ' +
              'Chỉ trả về duy nhất câu khuyên, không chào hỏi.',
          },
        ],
      });

      const text = String(response.choices?.[0]?.message?.content ?? '').replace(/\*/g, '').trim();
      return json({ text }, 200, origin);
    }

    if (action === 'chat') {
      const input = String(body.input ?? '');
      if (input.length > 2000) {
        return json({ error: 'Tin nhắn quá dài (tối đa 2000 ký tự).' }, 400, origin);
      }
      const context = body.context as DigiwellAiContext;
      const persistedMessages = await getRecentAiMessages(supabase, user.id);
      const memoryMessages = buildMemoryMessages(context, persistedMessages);

      if (body.stream === true) {
        return streamChatResponse(supabase, user.id, origin, input, context, memoryMessages);
      }

      const response = await groqChat({
        model: getModelForAction('chat'),
        max_tokens: getMaxTokensForAction('chat'),
        tools: [recordWaterIntakeTool],
        tool_choice: 'auto',
        messages: buildChatMessages(context, input, memoryMessages),
      });

      const choice = response.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

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
            await rememberAiExchange(supabase, user.id, input, reply, context, waterAction);
            return json({
              reply,
              waterAction,
            }, 200, origin);
          }
        }
      }

      const reply = String(choice?.message?.content ?? '').replace(/\*/g, '').trim();
      await rememberAiExchange(supabase, user.id, input, reply || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.', context);
      return json({ reply: reply || 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.' }, 200, origin);
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
        model: getModelForAction('report-analysis'),
        max_tokens: getMaxTokensForAction('report-analysis'),
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const parsed = JSON.parse(String(response.choices?.[0]?.message?.content ?? '{}'));
      return json({
        analysis: parsed.analysis || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      }, 200, origin);
    }

    if (action === 'agentic') {
      const context = body.context as DigiwellAiContext;
      if (!context || typeof context !== 'object') {
        return json({ error: 'Context is required for agentic workflow.' }, 400, origin);
      }

      const prompt = `Bạn là Đại lý Lập kế hoạch Hydrat hóa AI của DigiWell, trả lời bằng tiếng Việt.
Nhiệm vụ của bạn là phân tích bối cảnh người dùng để đề xuất các hành động cải thiện thói quen uống nước và lên lịch thông minh.

Bối cảnh người dùng hiện tại:
${buildContextSummary(context)}

Dựa trên dữ liệu trên, hãy đề xuất một danh sách các hành động thích hợp (có thể trống nếu mọi thứ hoàn hảo). Bạn có thể gợi ý 3 loại hành động:
1. "adjustGoal": Nếu thời tiết nắng nóng (ví dụ >33 độ C) hoặc người dùng vận động nhiều, đề xuất tăng mục tiêu uống nước hôm nay.
2. "createReminder": Nếu lịch trình hôm nay có các buổi họp dài liên tục (>2 tiếng), các hoạt động thể thao/gym, hoặc thời gian bận rộn bối cảnh học tập/làm việc, hãy đề xuất một lời nhắc nhở uống nước với khung giờ cụ thể trước/trong buổi đó.
3. "suggestSchedule": Nếu thói quen của người dùng cho thấy họ hay quên uống nước vào một buổi nhất định hoặc lượng uống phân bổ kém, hãy đề xuất một lịch trình uống nước chia nhỏ thông minh (ví dụ 3-4 khung giờ uống nước lọc/trà).

Hãy trả về phản hồi định dạng JSON chính xác:
{
  "actions": [
    {
      "type": "adjustGoal",
      "reason": "Giải thích ngắn gọn lý do tăng mục tiêu bằng tiếng Việt (ví dụ: Nắng nóng 36°C)",
      "suggestedGoal": 2500, // lượng nước mục tiêu đề xuất mới (ml)
      "delta": 300 // lượng nước tăng thêm so với mục tiêu hiện tại (ml)
    },
    {
      "type": "createReminder",
      "reason": "Giải thích lý do nhắc nhở (ví dụ: Bạn có lịch họp dài từ 14:00 đến 16:00)",
      "time": "13:50", // định dạng HH:MM
      "message": "Uống 250ml nước trước khi bắt đầu buổi họp dài đệ nhé!" // Lời nhắn thân thiện tiếng Việt, xưng hô đệ/DigiCoach hoặc bạn/tôi
    },
    {
      "type": "suggestSchedule",
      "reason": "Giải thích lý do đề xuất lịch trình này",
      "intervals": ["07:30", "10:00", "14:30", "17:00", "20:00"] // danh sách các mốc thời gian đề xuất
    }
  ]
}`;

      const response = await groqChat({
        model: getModelForAction('agentic'),
        max_tokens: getMaxTokensForAction('agentic'),
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const parsed = JSON.parse(String(response.choices?.[0]?.message?.content ?? '{}'));
      return json({
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      }, 200, origin);
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
    return json({ error: getErrorMessage(error) }, status, origin);
  }
});
