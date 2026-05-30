import { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@/i18n';
import { supabase } from '../lib/supabase';
import { fetchStreakFreezes, applyStreakFreeze } from '../lib/gamification';

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function computePastStreak(dailyTotals: Map<string, number>, waterGoal: number): number {
  const now = new Date();
  let currentPastStreak = 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const total = dailyTotals.get(toDateStr(d)) || 0;
    if (total >= waterGoal) currentPastStreak++;
    else break;
  }
  return currentPastStreak;
}

function computeFreezeCandidate(dailyTotals: Map<string, number>, waterGoal: number): string | null {
  const now = new Date();
  const yesterday = toDateStr(new Date(now.getTime() - 86400000));
  const dayBeforeYesterday = toDateStr(new Date(now.getTime() - 2 * 86400000));
  const yesterdayTotal = dailyTotals.get(yesterday) || 0;
  const dayBeforeTotal = dailyTotals.get(dayBeforeYesterday) || 0;
  return (yesterdayTotal < waterGoal && dayBeforeTotal >= waterGoal) ? yesterday : null;
}

interface StreakWaterLog {
  day: string;
  amount: number;
}

export function useStreak(userId: string | undefined, waterGoal: number, todayIntake: number, isPremium: boolean = false) {
  const queryClient = useQueryClient();

  const now = new Date();
  const startDateKey = toDateStr(new Date(now.getTime() - 30 * 86400000));
  const todayKey = toDateStr(now);

  const waterLogsQuery = useQuery({
    queryKey: ['streak', 'waterLogs', userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('water_logs')
        .select('day, amount')
        .eq('user_id', userId)
        .gte('day', startDateKey)
        .lte('day', todayKey);
      if (error) throw error;
      const dailyTotals = new Map<string, number>();
      (data || []).forEach((log: StreakWaterLog) => {
        const amt = Number(log.amount ?? 0);
        dailyTotals.set(log.day, (dailyTotals.get(log.day) || 0) + (Number.isNaN(amt) ? 0 : amt));
      });
      return dailyTotals;
    },
    enabled: !!userId && userId !== 'undefined' && waterGoal > 0,
    staleTime: 30_000,
  });

  const profileQuery = useQuery({
    queryKey: ['streak', 'profile', userId] as const,
    queryFn: async () => {
      const freezes = await fetchStreakFreezes(userId!);
      return { streakFreezes: freezes };
    },
    enabled: !!userId && userId !== 'undefined' && isPremium,
    staleTime: 30_000,
  });

  const dailyTotals = useMemo(() => waterLogsQuery.data ?? new Map<string, number>(), [waterLogsQuery.data]);
  const pastStreak = useMemo(() => computePastStreak(dailyTotals, waterGoal), [dailyTotals, waterGoal]);
  const streak = pastStreak + (todayIntake >= waterGoal ? 1 : 0);
  const freezeCandidateDay = useMemo(() => computeFreezeCandidate(dailyTotals, waterGoal), [dailyTotals, waterGoal]);

  useEffect(() => {
    if (!waterLogsQuery.isFetched || !userId) return;
    if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
      const key = `streak_milestone_${streak}_${userId}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        import('@/lib/analytics').then(({ track }) => track(`streak_${streak}`, { streak }));
        
        // Trigger confetti celebration
        import('canvas-confetti').then((confettiModule) => {
          const confetti = confettiModule.default;
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            zIndex: 9999,
            colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7']
          });
        });
        
        // Show success toast
        import('sonner').then(({ toast }) => {
          toast.success(i18n.t('home.streak_milestone', { streak }), { icon: '🎉' });
        });

        // Play success sound
        import('@/lib/audio').then(({ playSound }) => {
          playSound('streak');
        });
      }
    }
  }, [streak, userId, waterLogsQuery.isFetched]);
  const streakFreezes = profileQuery.data?.streakFreezes ?? 0;

  const needsFreeze = !!(isPremium && streakFreezes > 0 && freezeCandidateDay);

  const freezeMutation = useMutation({
    mutationFn: async () => {
      return applyStreakFreeze(userId!);
    },
    onSuccess: (data) => {
      if (typeof data?.remaining_freezes === 'number') {
        queryClient.setQueryData(['streak', 'profile', userId], { streakFreezes: data.remaining_freezes });
        queryClient.invalidateQueries({ queryKey: ['streak', 'waterLogs', userId] });
      }
    },
  });

  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (!userId || userId === 'undefined' || !isPremium || streakFreezes <= 0 || !needsFreeze) return false;
    try {
      const result = await freezeMutation.mutateAsync();
      const remaining_freezes = result?.remaining_freezes;
      if (typeof remaining_freezes !== 'number') return false;
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      const friendlyMessage = msg.includes('No active streak')
        ? i18n.t('home.no_active_streak')
        : msg.includes('already met')
        ? i18n.t('home.already_met_goal')
        : msg.includes('No streak freezes')
        ? i18n.t('home.no_streak_freezes')
        : i18n.t('home.streak_freeze_error');
      const { toast } = await import('sonner');
      toast.error(friendlyMessage);
      return false;
    }
  }, [userId, isPremium, streakFreezes, needsFreeze, freezeMutation]);

  return { streak, streakFreezes, needsFreeze, useStreakFreeze, isPremium };
}
