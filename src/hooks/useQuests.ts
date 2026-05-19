import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { claimQuestReward, provisionUserQuests, syncLevelQuestProgress } from '@/lib/questEngine';
import type { UserQuest, QuestType } from '../config/questConfig';
import { resolveQuestProgress } from '@/lib/questProgress';

const QUESTS_QUERY_KEY = (userId?: string) => ['quests', userId] as const;

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toLocaleDateString('en-CA');
}

function normalizeFetchedQuests(rows: UserQuest[], userLevel: number): UserQuest[] {
  return rows.map((uq) => {
    const quest = Array.isArray((uq as unknown as { quest: unknown }).quest)
      ? (uq as unknown as { quest: unknown[] }).quest[0]
      : (uq as unknown as { quest: Record<string, unknown> }).quest;
    if (!quest) return uq;

    const resolved = resolveQuestProgress(quest as Record<string, unknown>, { level: userLevel });
    const isLevelQuest = resolved.normalizedType === 'level';

    return {
      ...uq,
      progress: isLevelQuest ? Math.max(Number(uq.progress || 0), resolved.progress) : Number(uq.progress || 0),
      status: (uq.status === 'claimed' ? 'claimed' : isLevelQuest && resolved.completed ? 'completed' : uq.status) as UserQuest['status'],
      quest: { ...(quest as Record<string, unknown>), condition_type: resolved.normalizedType, condition_value: resolved.target },
    } as unknown as UserQuest;
  });
}

export function useQuests(userId: string | undefined, userLevel: number = 1) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUESTS_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];
      await provisionUserQuests(userId, userLevel);
      await syncLevelQuestProgress(userId, userLevel);

      const today = new Date().toLocaleDateString('en-CA');
      const weekStart = getWeekStart();

      const { data, error } = await supabase
        .from('user_quests')
        .select(`
          id, quest_id, status, progress, reset_date, completed_at, claimed_at,
          quest:quests (
            id, type, title, description, condition_type, condition_value,
            reward_exp, reward_coins, reward_badge_id, min_level
          )
        `)
        .eq('user_id', userId)
        .or(`reset_date.is.null,reset_date.eq.${today},reset_date.eq.${weekStart}`)
        .order('status', { ascending: true });
      if (error) throw error;

      const formatted = normalizeFetchedQuests((data ?? []) as unknown as UserQuest[], userLevel);
      localStorage.setItem(`digiwell_quests_cache_${userId}`, JSON.stringify(formatted));
      return formatted;
    },
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: () => {
      if (!userId) return undefined;
      try {
        const cached = localStorage.getItem(`digiwell_quests_cache_${userId}`);
        return cached ? normalizeFetchedQuests(JSON.parse(cached), userLevel) : undefined;
      } catch { return undefined; }
    },
  });

  const claimMut = useMutation({
    mutationFn: (userQuestId: string) => claimQuestReward(userId!, userQuestId),
    onSuccess: (_result, userQuestId) => {
      queryClient.setQueryData<UserQuest[]>(QUESTS_QUERY_KEY(userId), (old) =>
        (old || []).map(uq =>
          uq.id === userQuestId
            ? { ...uq, status: 'claimed' as const, claimed_at: new Date().toISOString() }
            : uq,
        ),
      );
    },
  });

  const quests = useMemo(() => query.data ?? [], [query.data]);

  const byType = useCallback((type: QuestType) => quests.filter(uq => uq.quest.type === type), [quests]);

  return {
    quests,
    loading: query.isLoading,
    dailyQuests: useMemo(() => byType('daily'), [byType]),
    weeklyQuests: useMemo(() => byType('weekly'), [byType]),
    levelQuests: useMemo(() => byType('level'), [byType]),
    claimQuest: useCallback(async (userQuestId: string): Promise<boolean> => {
      if (!userId) return false;
      try { return !!(await claimMut.mutateAsync(userQuestId)); }
      catch { return false; }
    }, [userId, claimMut]),
    refetch: useCallback(() => queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY(userId) }), [queryClient, userId]),
  };
}
