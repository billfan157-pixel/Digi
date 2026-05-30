import i18n from '@/i18n';
import { invokeAiGateway, invokeAiGatewayStream, type AiGatewayStreamEvent } from './aiGateway';
import { isSupabaseConfigured, supabase } from './supabase';

export type AiChatMessage = {
  role: 'user' | 'model';
  content: string;
};

import type { DigiwellAiContext, WaterAction } from '@shared/aiValidation';
export type { DigiwellAiContext, WaterAction };

export type AiAdviceResponse = {
  text: string;
  suggestedAmount?: number;
};

const FRIENDLY_FALLBACK_ADVICE: AiAdviceResponse = {
  text: i18n.t('ai.busy_message'),
  suggestedAmount: 200,
};

function getAiErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.toLowerCase().includes('rate limit')) {
    return i18n.t('ai.rate_limited');
  }
  if (raw.toLowerCase().includes('unauthorized')) {
    return i18n.t('ai.session_expired');
  }
  if (raw.includes('AI server chưa được cấu hình')) {
    return i18n.t('ai.not_configured');
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

export type AiNudgeResponse = {
  message: string;
  suggestedAmount: number;
};

const nudgeCache = new Map<string, { result: AiNudgeResponse; expiry: number }>();

export async function generateAiNudge(
  context: Pick<DigiwellAiContext, 'waterIntake' | 'waterGoal' | 'profile' | 'weather'> & {
    hour: number;
    streak: number;
    isFirstOpen: boolean;
    weeklyHistory?: Array<{ d: string; ml: number }>;
    calendarEvents?: Array<{ title: string; startRaw: string; endRaw: string }>;
  },
): Promise<AiNudgeResponse> {
  const cacheKey = `nudge-${context.waterIntake}-${context.waterGoal}-${context.hour}-${Math.floor(Date.now() / (30 * 60 * 1000))}`;

  const cached = nudgeCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.result;

  try {
    const fullContext: DigiwellAiContext = {
      nowIso: new Date().toISOString(),
      waterIntake: context.waterIntake,
      waterGoal: context.waterGoal,
      weather: context.weather,
      profile: context.profile,
      hydrationHistory: context.weeklyHistory?.slice(-7).map(day => ({
        date: day.d,
        ml: day.ml,
      })),
      calendarEvents: context.calendarEvents?.length ? context.calendarEvents : undefined,
      behaviorPatterns: [
        {
          pattern: `Giờ hiện tại: ${context.hour}h. Streak: ${context.streak} ngày.`,
          confidence: 0.8,
          recommendation: context.isFirstOpen ? i18n.t('ai.first_open_today') : '',
        },
      ],
    };

    const nudge = await invokeAiGateway<{ text: string; suggestedAmount?: number }>('nudge', { context: fullContext });

    const result: AiNudgeResponse = {
      message: nudge.text,
      suggestedAmount: nudge.suggestedAmount ?? 250,
    };

    nudgeCache.set(cacheKey, { result, expiry: Date.now() + 30 * 60 * 1000 });
    return result;
  } catch {
    const remaining = Math.max(0, context.waterGoal - context.waterIntake);
    return {
      message: remaining > 0
        ? i18n.t('ai.drink_more_nudge', { remaining })
        : i18n.t('ai.goal_reached_congrats'),
      suggestedAmount: Math.min(250, remaining > 0 ? remaining : 0),
    };
  }
}

export async function generateHydrationAdvice(context: DigiwellAiContext): Promise<AiAdviceResponse> {
  try {
    const response = await invokeAiGateway<AiAdviceResponse>('advice', { context });

    return {
      text: response.text || FRIENDLY_FALLBACK_ADVICE.text,
      suggestedAmount: response.suggestedAmount,
    };
  } catch (error) {
    const message = getAiErrorMessage(error);
    if (message.toLowerCase().includes('rate limit')) {
      return {
        text: i18n.t('ai.drink_more_fallback'),
      };
    }
    return FRIENDLY_FALLBACK_ADVICE;
  }
}

export type AiReportResponse = {
  analysis: string;
  recommendations: string[];
};

export async function generateWeeklyReportAdvice(
  stats: { goalsAchieved: number; totalDays: number; achievementRate: number },
  entries: Array<{ date: string; waterIntake: number; waterGoal: number; achieved: boolean }>,
  periodLabel: string,
  profile: { nickname?: string; avgHeartRate?: number },
): Promise<AiReportResponse> {
  try {
    const response = await invokeAiGateway<AiReportResponse>('report-analysis', {
      stats,
      entries,
      periodLabel,
      profile,
    });
    return {
      analysis: response.analysis || '',
      recommendations: Array.isArray(response.recommendations) ? response.recommendations : [],
    };
  } catch (error) {
    console.warn('[generateWeeklyReportAdvice] Failed:', error);
    throw error;
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
      reply: response.reply?.trim() || i18n.t('ai.dont_understand'),
      waterAction: response.waterAction,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    return { reply: msg || i18n.t('ai.busy_fallback') };
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

export type AgenticAction =
  | { type: 'adjustGoal'; reason: string; suggestedGoal: number; delta: number }
  | { type: 'createReminder'; reason: string; time: string; message: string }
  | { type: 'suggestSchedule'; reason: string; intervals: string[] };

export async function invokeAgenticWorkflow(
  context: DigiwellAiContext,
): Promise<AgenticAction[]> {
  try {
    const response = await invokeAiGateway<{ actions?: AgenticAction[] }>('agentic', { context });
    return Array.isArray(response.actions) ? response.actions : [];
  } catch (error) {
    console.warn('[invokeAgenticWorkflow] Failed:', error instanceof Error ? error.message : error);
    return [];
  }
}
