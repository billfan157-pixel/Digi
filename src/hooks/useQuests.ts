// ============================================================
// DigiWell — useQuests Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { claimQuestReward, provisionUserQuests, syncLevelQuestProgress } from '@/lib/questEngine';
import type { UserQuest, QuestType } from '../config/questConfig';
import { resolveQuestProgress } from '@/lib/questProgress';

import { AppStorage } from '@/lib/storage';

export function useQuests(userId: string | undefined, userLevel: number = 1) {
  const [quests,  setQuests]  = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = useCallback(async () => {
    if (!userId) return;
    
    // 1. Load từ Local Cache trước (Offline-First)
    try {
      const cached = AppStorage.getItem(`digiwell_quests_cache_${userId}`);
      if (cached) {
        setQuests(normalizeFetchedQuests(JSON.parse(cached), userLevel));
        setLoading(false); // Có data rồi thì không block UI
      } else {
        setLoading(true);
      }
    } catch(e) {}

    try {
      // 2. Fetch fresh data ngầm
      await provisionUserQuests(userId, userLevel);
      await syncLevelQuestProgress(userId, userLevel);

      const today     = new Date().toLocaleDateString('en-CA');
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
        .or(
          `reset_date.is.null,reset_date.eq.${today},reset_date.eq.${weekStart}`,
        )
        .order('status', { ascending: true }); // active trước, completed sau

      if (error) throw error;

      const formattedData = normalizeFetchedQuests((data ?? []) as unknown as UserQuest[], userLevel);
      setQuests(formattedData);
      
      // 3. Cập nhật lại Cache
      AppStorage.setItem(`digiwell_quests_cache_${userId}`, JSON.stringify(formattedData));
    } catch (err) {
      console.error('[useQuests] fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userLevel]);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const claim = useCallback(async (userQuestId: string) => {
    if (!userId) return;
    const result = await claimQuestReward(userId, userQuestId);
    if (result) {
      // Update local state ngay, không cần refetch
      setQuests(prev =>
        prev.map(uq =>
          uq.id === userQuestId
            ? { ...uq, status: 'claimed', claimed_at: new Date().toISOString() }
            : uq,
        ),
      );
    }
    return result;
  }, [userId]);

  // Filter helpers
  const byType = (type: QuestType) =>
    quests.filter(uq => uq.quest.type === type);

  return {
    quests,
    loading,
    dailyQuests:   byType('daily'),
    weeklyQuests:  byType('weekly'),
    levelQuests:   byType('level'),
    claimQuest:    claim,
    refetch:       fetchQuests,
  };
}

function normalizeFetchedQuests(rows: UserQuest[], userLevel: number): UserQuest[] {
  return rows.map((uq) => {
    const quest = Array.isArray((uq as any).quest) ? (uq as any).quest[0] : uq.quest;
    if (!quest) return uq;

    const resolved = resolveQuestProgress(quest, { level: userLevel });
    const isLevelQuest = resolved.normalizedType === 'level';

    return {
      ...uq,
      progress: isLevelQuest ? Math.max(Number(uq.progress || 0), resolved.progress) : Number(uq.progress || 0),
      status: uq.status === 'claimed'
        ? 'claimed'
        : isLevelQuest && resolved.completed
          ? 'completed'
          : uq.status,
      quest: {
        ...quest,
        condition_type: resolved.normalizedType as any,
        condition_value: resolved.target,
      },
    };
  });
}

// ── Week start helper ──────────────────────────────────────

function getWeekStart(): string {
  const d   = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toLocaleDateString('en-CA');
}
