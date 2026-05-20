import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { claimQuestReward, provisionUserQuests, syncLevelQuestProgress } from '@/lib/questEngine';
import type { UserQuest, QuestType, ConditionType, Quest } from '../config/questConfig';
import { resolveQuestProgress } from '@/lib/questProgress';
import { getWeekStart } from '@/utils/dateUtils';

const QUESTS_QUERY_KEY = (userId?: string) => ['quests', userId] as const;

function normalizeFetchedQuests(rows: UserQuest[], userLevel: number): UserQuest[] {
  return rows.map((rawUq): UserQuest => {
    const uq = rawUq as UserQuest & { quest: Record<string, unknown> | Record<string, unknown>[] };
    const quest = Array.isArray(uq.quest) ? uq.quest[0] : uq.quest;
    if (!quest) return rawUq;

    const resolved = resolveQuestProgress(quest, { level: userLevel });
    const isLevelQuest = resolved.normalizedType === 'level';

    return {
      ...rawUq,
      progress: isLevelQuest ? Math.max(Number(rawUq.progress || 0), resolved.progress) : Number(rawUq.progress || 0),
      status: (rawUq.status === 'claimed' ? 'claimed' : isLevelQuest && resolved.completed ? 'completed' : rawUq.status) as UserQuest['status'],
      quest: { ...quest, condition_type: resolved.normalizedType as ConditionType, condition_value: resolved.target } as Quest,
    };
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
