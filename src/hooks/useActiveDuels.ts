import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Battle } from '../models';

interface ActiveDuel extends Battle {
  yourProgress: number;
  opponentProgress: number;
  targetMl: number;
}

interface UseActiveDuelsReturn {
  duels: ActiveDuel[];
  loading: boolean;
  refresh: () => void;
}

export function useActiveDuels(userId?: string): UseActiveDuelsReturn {
  const [duels, setDuels] = useState<ActiveDuel[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef<() => void>(() => {});

  const fetchDuels = useCallback(async () => {
    if (!userId) {
      setDuels([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hydration_battles')
        .select(`
          *,
          challenger:public_profiles!hydration_battles_challenger_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
          opponent:public_profiles!hydration_battles_opponent_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level)
        `)
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setDuels(
          (data as Battle[])
            .filter(b => b.status === 'active')
            .map(b => ({
              ...b,
              yourProgress: b.challenger_id === userId
                ? (b.challenger?.water_today ?? 0)
                : (b.opponent?.water_today ?? 0),
              opponentProgress: b.challenger_id === userId
                ? (b.opponent?.water_today ?? 0)
                : (b.challenger?.water_today ?? 0),
              targetMl: b.target_ml,
            }))
        );
      }
    } catch (err) {
      console.error('Lỗi tải duel đang diễn ra:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  refreshRef.current = fetchDuels;

  useEffect(() => {
    fetchDuels();
  }, [fetchDuels]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`active-duels:${userId}`)
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `challenger_id=eq.${userId}`,
      }, () => refreshRef.current())
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `opponent_id=eq.${userId}`,
      }, () => refreshRef.current())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { duels, loading, refresh: fetchDuels };
}
