import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../store/useUIStore';
import { useAppStore } from '../store/useAppStore';

const SEEN_KEY = 'digiwell-seen-duel-results';

function getSeenResults(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  try {
    const seen = getSeenResults();
    seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

interface DuelChangePayload {
  new: {
    id: string;
    status: string;
    winner_id: string | null;
    challenger_id: string;
    opponent_id: string;
    stake_coins: number;
  } | null;
  old: {
    id: string;
    status: string;
  } | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useDuelResultWatcher() {
  const profile = useAppStore(s => s.profile);
  const userId = profile?.id;
  const setShowDuelResult = useUIStore(s => s.setShowDuelResult);
  const setDuelResultData = useUIStore(s => s.setDuelResultData);
  const refreshRef = useRef(setShowDuelResult);
  const dataRef = useRef(setDuelResultData);
  refreshRef.current = setShowDuelResult;
  dataRef.current = setDuelResultData;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('duel-result-watcher')
      .on('postgres_changes' as never, {
        event: 'UPDATE',
        schema: 'public',
        table: 'hydration_battles',
        filter: `status=eq.completed`,
      }, async (payload: unknown) => {
        const p = payload as DuelChangePayload;
        const battle = p.new;
        if (!battle) return;

        const isParticipant = battle.challenger_id === userId || battle.opponent_id === userId;
        if (!isParticipant) return;

        const seen = getSeenResults();
        if (seen.has(battle.id)) return;
        markSeen(battle.id);

        const isWin = battle.winner_id === userId;
        const isDraw = battle.winner_id === null;
        const opponentId = battle.challenger_id === userId ? battle.opponent_id : battle.challenger_id;

        let opponentName = '';
        try {
          const { data } = await supabase
            .from('public_profiles')
            .select('nickname')
            .eq('id', opponentId)
            .single();
          if (data) opponentName = data.nickname;
        } catch { /* ignore */ }

        dataRef.current({
          result: isWin ? 'won' : isDraw ? 'draw' : 'lost',
          rewardCoins: isWin || isDraw ? battle.stake_coins : 0,
          opponentName,
        });
        refreshRef.current(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}
