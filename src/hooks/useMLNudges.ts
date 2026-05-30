import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateAiNudge, type AiNudgeResponse } from '@/lib/ai';
import { useSubscriptionTier } from '@/hooks/useIsPremium';
import { getTimeBasedNudge, type Nudge } from '@/lib/habitEngine';
import { useAppStore } from '@/store/useAppStore';

interface AiNudgeState {
  message: string;
  suggestedAmount: number;
  expiresAt: number;
}

export function useAiNudge(params: {
  hour: number;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isFirstOpen: boolean;
  weather?: { temp: number; status: string };
  weeklyHistory?: Array<{ d: string; ml: number }>;
  calendarEvents?: Array<{ title: string; startRaw: string; endRaw: string }>;
}) {
  const { hour, waterIntake, waterGoal, streak, isFirstOpen, weather, weeklyHistory, calendarEvents } = params;
  const profile = useAppStore(s => s.profile);
  const tier = useSubscriptionTier();
  const isPro = tier === 'pro';

  const [aiNudge, setAiNudge] = useState<AiNudgeState | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const lastFetchRef = useRef(0);

  const habitNudge: Nudge = getTimeBasedNudge({ hour, waterIntake, waterGoal, streak, isFirstOpen });

  const fetchAiNudge = useCallback(async () => {
    if (!isPro) return;
    if (Date.now() - lastFetchRef.current < 30 * 60 * 1000) return;

    setLoadingAi(true);
    lastFetchRef.current = Date.now();
    try {
      const result: AiNudgeResponse = await generateAiNudge({
        waterIntake,
        waterGoal,
        hour,
        streak,
        isFirstOpen,
        profile: profile ? {
          nickname: profile.nickname,
          goal: profile.goal,
          activity: profile.activity,
          climate: profile.climate,
        } : undefined,
        weather,
        weeklyHistory,
        calendarEvents,
      });
      setAiNudge({
        message: result.message,
        suggestedAmount: result.suggestedAmount,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
    } catch {
      setAiNudge(null);
    } finally {
      setLoadingAi(false);
    }
  }, [isPro, waterIntake, waterGoal, hour, streak, isFirstOpen, profile]);

  useEffect(() => {
    if (isPro && (!aiNudge || aiNudge.expiresAt < Date.now())) {
      fetchAiNudge();
    }
  }, [isPro, fetchAiNudge, aiNudge]);

  const dismiss = useCallback(() => {
    setAiNudge(null);
  }, []);

  const { t } = useTranslation();

  const display = loadingAi ? {
    title: t('ai.nudge.title', 'AI Hydration Coach'),
    message: t('ai.nudge.loading', 'AI đang suy nghĩ...'),
    tint: habitNudge.tint,
    emoji: '🤖',
    isAi: true as const,
  } : isPro && aiNudge ? {
    title: t('ai.nudge.title', 'AI Hydration Coach'),
    message: aiNudge.message,
    actionLabel: aiNudge.suggestedAmount > 0 ? `Uống ${aiNudge.suggestedAmount}ml` : undefined,
    tint: habitNudge.tint,
    emoji: '🤖',
    isAi: true as const,
  } : {
    title: habitNudge.title,
    message: habitNudge.message,
    actionLabel: habitNudge.actionLabel,
    tint: habitNudge.tint,
    emoji: habitNudge.emoji,
    isAi: false as const,
  };

  return {
    nudge: display,
    isLoading: loadingAi,
    isAi: isPro && !!aiNudge,
    dismiss,
  };
}
