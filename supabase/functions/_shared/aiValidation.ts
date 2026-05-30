// Shared Schema Validation and Logging for DigiWell AI Gateway
// Compatible with both Deno (Edge Functions) and Vite (Frontend)

export interface CalendarEventItem {
  title: string;
  startRaw: string;
  endRaw: string;
  isAllDay?: boolean;
}

export interface BehaviorPatternItem {
  pattern: string;
  confidence: number;
  recommendation: string;
}

export interface HydrationHistoryItem {
  date: string;
  ml: number;
}

export interface DigiwellAiContext {
  nowIso: string;
  waterIntake: number;
  waterGoal: number;
  hydrationHistory?: HydrationHistoryItem[];
  weather?: { temp: number; status: string; location?: string };
  watch?: { heartRate: number; steps: number };
  calendar?: { synced: boolean; nextEventTitle?: string };
  profile?: { nickname?: string; goal?: string; activity?: string; climate?: string };
  chatHistory?: Array<{ role: 'user' | 'model'; content: string }>;
  behaviorPatterns?: BehaviorPatternItem[];
  calendarEvents?: CalendarEventItem[];
}

export interface WaterAction {
  amount: number;
  factor: number;
  name: string;
}

export interface AiAdviceResponse {
  text: string;
  suggestedAmount?: number;
  nextBestAction?: {
    title: string;
    action: string;
    ml: number;
    icon: string;
  } | null;
}

export interface AiNudgeResponse {
  text: string;
  suggestedAmount: number;
}

export interface AiChatResponse {
  reply: string;
  waterAction?: WaterAction;
}

export interface AiGatewayLog {
  timestamp: string;
  action: string;
  model: string;
  userId?: string;
  latencyMs: number;
  quotaResult?: {
    allowed: boolean;
    limit: number;
    remaining: number;
  };
  fallbackUsed: boolean;
  fallbackReason?: string;
  success: boolean;
  errorMessage?: string;
  promptTokens?: number;
  completionTokens?: number;
}

// Enforce bounds and cap array lengths
export function sanitizeAndCapContext(context: Partial<DigiwellAiContext>): DigiwellAiContext {
  const nowIso = context.nowIso || new Date().toISOString();
  const waterIntake = Math.min(Math.max(Number(context.waterIntake || 0), 0), 50000);
  const waterGoal = Math.min(Math.max(Number(context.waterGoal || 2000), 1), 50000);

  // Cap arrays & entry sizes to protect prompt budget
  const hydrationHistory = Array.isArray(context.hydrationHistory)
    ? context.hydrationHistory.slice(0, 5).map(h => ({
        date: String(h.date || '').slice(0, 10),
        ml: Math.min(Math.max(Number(h.ml || 0), 0), 20000)
      }))
    : undefined;

  const behaviorPatterns = Array.isArray(context.behaviorPatterns)
    ? context.behaviorPatterns.slice(0, 5).map(bp => ({
        pattern: String(bp.pattern || '').slice(0, 100),
        confidence: Math.min(Math.max(Number(bp.confidence || 0), 0), 1),
        recommendation: String(bp.recommendation || '').slice(0, 150)
      }))
    : undefined;

  const calendarEvents = Array.isArray(context.calendarEvents)
    ? context.calendarEvents.slice(0, 5).map(ev => ({
        title: String(ev.title || '').slice(0, 80), // Cap title length
        startRaw: String(ev.startRaw || '').slice(0, 30),
        endRaw: String(ev.endRaw || '').slice(0, 30),
        isAllDay: !!ev.isAllDay
      }))
    : undefined;

  const chatHistory = Array.isArray(context.chatHistory)
    ? context.chatHistory.slice(-5).map(ch => ({
        role: ch.role === 'user' ? 'user' as const : 'model' as const,
        content: String(ch.content || '').slice(0, 500) // Cap prompt budget per message
      }))
    : undefined;

  const profile = context.profile
    ? {
        nickname: String(context.profile.nickname || '').slice(0, 50),
        goal: String(context.profile.goal || '').slice(0, 100),
        activity: String(context.profile.activity || '').slice(0, 30),
        climate: String(context.profile.climate || '').slice(0, 30)
      }
    : undefined;

  const weather = context.weather
    ? {
        temp: Math.min(Math.max(Number(context.weather.temp || 25), -50), 60),
        status: String(context.weather.status || '').slice(0, 50),
        location: context.weather.location ? String(context.weather.location).slice(0, 100) : undefined
      }
    : undefined;

  const watch = context.watch
    ? {
        heartRate: Math.min(Math.max(Number(context.watch.heartRate || 70), 30), 220),
        steps: Math.min(Math.max(Number(context.watch.steps || 0), 0), 200000)
      }
    : undefined;

  const calendar = context.calendar
    ? {
        synced: !!context.calendar.synced,
        nextEventTitle: context.calendar.nextEventTitle ? String(context.calendar.nextEventTitle).slice(0, 80) : undefined
      }
    : undefined;

  return {
    nowIso,
    waterIntake,
    waterGoal,
    hydrationHistory,
    behaviorPatterns,
    calendarEvents,
    chatHistory,
    profile,
    weather,
    watch,
    calendar
  };
}

// Parse advice response from JSON string
export function parseAdviceResponse(content: string): { data: AiAdviceResponse; fallbackUsed: boolean; fallbackReason?: string } {
  const fallback: AiAdviceResponse = {
    text: 'Hãy uống nước đều đặn đệ nhé! 💧',
    suggestedAmount: 0,
    nextBestAction: null
  };

  try {
    const raw = JSON.parse(content);
    if (typeof raw !== 'object' || raw === null) {
      return { data: fallback, fallbackUsed: true, fallbackReason: 'Parsed JSON is not an object' };
    }

    const text = typeof raw.text === 'string' ? raw.text.replace(/\*/g, '').trim() : fallback.text;
    let nextBestAction = raw.nextBestAction;
    let suggestedAmount = 0;

    if (nextBestAction && typeof nextBestAction === 'object') {
      let ml = Math.round(Number(nextBestAction.ml));
      if (!Number.isFinite(ml) || ml < 0) {
        ml = 0;
      } else if (ml > 2000) {
        ml = 2000;
      }

      const allowedIcons = ["droplets", "zap", "alert", "sparkles", "clock", "target", "crown", "award", "weather", "flame"];
      const icon = typeof nextBestAction.icon === 'string' && allowedIcons.includes(nextBestAction.icon)
        ? nextBestAction.icon
        : 'sparkles';

      const title = typeof nextBestAction.title === 'string' ? nextBestAction.title.slice(0, 80) : 'Hành động tiếp theo';
      const action = typeof nextBestAction.action === 'string' ? nextBestAction.action.slice(0, 200) : '';

      nextBestAction = { title, action, ml, icon };
      suggestedAmount = ml;
    } else {
      nextBestAction = null;
    }

    return {
      data: { text, suggestedAmount, nextBestAction },
      fallbackUsed: typeof raw.text !== 'string',
      fallbackReason: typeof raw.text !== 'string' ? 'Missing required "text" field' : undefined
    };
  } catch (err) {
    return { data: fallback, fallbackUsed: true, fallbackReason: `JSON parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// Parse nudge response from JSON string
export function parseNudgeResponse(content: string): { data: AiNudgeResponse; fallbackUsed: boolean; fallbackReason?: string } {
  const fallback: AiNudgeResponse = {
    text: 'Hãy uống thêm một ngụm nước để giữ sức khỏe tốt nhé! 💧',
    suggestedAmount: 250
  };

  try {
    const raw = JSON.parse(content);
    if (typeof raw !== 'object' || raw === null) {
      return { data: fallback, fallbackUsed: true, fallbackReason: 'Parsed JSON is not an object' };
    }

    const text = typeof raw.text === 'string' ? raw.text.trim() : (typeof raw.message === 'string' ? raw.message.trim() : fallback.text);
    
    let suggestedAmount = Math.round(Number(raw.suggestedAmount || raw.amount));
    if (!Number.isFinite(suggestedAmount) || suggestedAmount < 0) {
      suggestedAmount = fallback.suggestedAmount;
    } else if (suggestedAmount > 2000) {
      suggestedAmount = 2000;
    }

    return {
      data: { text, suggestedAmount },
      fallbackUsed: (!raw.text && !raw.message),
      fallbackReason: (!raw.text && !raw.message) ? 'Missing "text" or "message" field' : undefined
    };
  } catch (err) {
    return { data: fallback, fallbackUsed: true, fallbackReason: `JSON parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// Parse chat response from JSON string
export function parseChatResponse(content: string): { data: AiChatResponse; fallbackUsed: boolean; fallbackReason?: string } {
  const fallback: AiChatResponse = {
    reply: 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.'
  };

  try {
    const raw = JSON.parse(content);
    if (typeof raw !== 'object' || raw === null) {
      return { data: fallback, fallbackUsed: true, fallbackReason: 'Parsed JSON is not an object' };
    }

    const reply = typeof raw.reply === 'string' ? raw.reply.trim() : fallback.reply;
    let waterAction: WaterAction | undefined = undefined;

    if (raw.waterAction && typeof raw.waterAction === 'object') {
      const amount = Math.round(Number(raw.waterAction.amount));
      const factor = Number(raw.waterAction.factor);
      const name = typeof raw.waterAction.name === 'string' ? raw.waterAction.name.trim() : '';

      if (Number.isFinite(amount) && amount >= 30 && Number.isFinite(factor) && name !== '') {
        waterAction = {
          amount: Math.min(amount, 2000),
          factor: Math.min(Math.max(factor, -1), 1.5),
          name: name.slice(0, 80)
        };
      }
    }

    return {
      data: { reply, waterAction },
      fallbackUsed: typeof raw.reply !== 'string',
      fallbackReason: typeof raw.reply !== 'string' ? 'Missing required "reply" field' : undefined
    };
  } catch (err) {
    return { data: fallback, fallbackUsed: true, fallbackReason: `JSON parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// Structured Logger
export function logStructuredEvent(log: AiGatewayLog) {
  console.log(`[AI-GATEWAY-LOG] ${JSON.stringify(log)}`);
}
