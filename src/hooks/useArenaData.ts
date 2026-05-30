import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Profile, Battle } from '@/models';
import { calculateWpDelta, type MatchResult } from '@/lib/arenaEngine';

export interface ArenaStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  rank: number;
  wp: number;
  totalCoins: number;
}

export interface PostMatchResult {
  status: 'won' | 'loss' | 'draw';
  reward: number;
  bonus: number;
  win_streak: number;
  wp_delta: number;
}

export interface MatchedData {
  battle_id: string;
  opponent_id: string;
  opponent_elo: number;
  opponent_nickname?: string;
  opponent_avatar_url?: string | null;
  opponent_level?: number;
}

export interface QueueStatus {
  queueId: string;
  mode: string;
  stake: number;
  joinedAt: number;
}

const BOT_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
];

export function useArenaData(profile: Profile | null) {
  const { t } = useTranslation();
  const profileId = profile?.id;

  const [battles, setBattles] = useState<Battle[]>([]);
  const [stats, setStats] = useState<ArenaStats>({
    wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0, rank: 999, wp: 0, totalCoins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBotMatching, setIsBotMatching] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [isQueueTransitioning, setIsQueueTransitioning] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null);
  const [showPostMatchResult, setShowPostMatchResult] = useState<PostMatchResult | null>(null);
  const [showBattleDetail, setShowBattleDetail] = useState<Battle | null>(null);
  const [showGroupChallenge, setShowGroupChallenge] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'daily' | 'quick' | 'tournament' | null>(null);
  const [now, setNow] = useState(Date.now());

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetching ──────────────────────────────────────────

  const fetchArenaData = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const [battlesRes, rankRes, historyRes] = await Promise.all([
        supabase
          .from('hydration_battles')
          .select(`
            *,
            challenger:public_profiles!hydration_battles_challenger_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
            opponent:public_profiles!hydration_battles_opponent_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
            duel_match_history(elo_challenger_before, elo_challenger_after, elo_opponent_before, elo_opponent_after)
          `)
          .or(`challenger_id.eq.${profileId},opponent_id.eq.${profileId}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('public_profiles')
          .select('id, wp')
          .order('wp', { ascending: false }),
        supabase
          .from('duel_match_history')
          .select('*')
          .or(`challenger_id.eq.${profileId},opponent_id.eq.${profileId}`),
      ]);

      if (battlesRes.error) throw battlesRes.error;

      const data = battlesRes.data ?? [];
      setBattles(data);

      let wins = 0, losses = 0, draws = 0;
      data.forEach((b: Battle) => {
        if (b.status === 'completed') {
          if (b.winner_id === profileId) wins++;
          else if (b.winner_id === null) draws++;
          else losses++;
        }
      });

      // Rank position
      let currentRankPosition = 999;
      if (rankRes.data) {
        const myIdx = rankRes.data.findIndex((x: { id: string }) => x.id === profileId);
        if (myIdx >= 0) currentRankPosition = myIdx + 1;
      }
      if (rankRes.error) {
        console.error('Error fetching leaderboard rank position:', rankRes.error);
      }

      // Best streak
      let bestStreak = 0;
      if (historyRes.data) {
        let currentStreak = 0;
        const sortedHistory = [...historyRes.data].sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        );
        sortedHistory.forEach((h: { winner_id?: string | null }) => {
          if (h.winner_id === profileId) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else if (h.winner_id !== null) {
            currentStreak = 0;
          }
        });
      }
      if (historyRes.error) {
        console.error('Error calculating best streak:', historyRes.error);
      }

      setStats({
        wins,
        losses,
        draws,
        winStreak: profile?.duel_win_streak ?? 0,
        bestStreak: bestStreak || (profile?.duel_win_streak ?? 0),
        rank: currentRankPosition,
        wp: profile?.wp ?? 0,
        totalCoins: profile?.coins ?? 0,
      });
    } catch (err) {
      console.error(err);
      toast.error(t('battle.load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [profileId, profile?.duel_win_streak, profile?.wp, profile?.coins, t]);

  const fetchArenaDataRef = useRef(fetchArenaData);
  fetchArenaDataRef.current = fetchArenaData;

  // ── Realtime subscription ─────────────────────────────────

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase.channel(`battles:${profileId}`)
      .on('postgres_changes' as never, {
        event: '*', schema: 'public', table: 'hydration_battles',
        filter: `challenger_id=eq.${profileId}`,
      }, () => { fetchArenaDataRef.current(); })
      .on('postgres_changes' as never, {
        event: '*', schema: 'public', table: 'hydration_battles',
        filter: `opponent_id=eq.${profileId}`,
      }, () => { fetchArenaDataRef.current(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  // ── Initial fetch ─────────────────────────────────────────

  useEffect(() => {
    fetchArenaData();
  }, [fetchArenaData]);

  // ── 1-second timer for active duels ───────────────────────

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ── Polling helpers ───────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // ── Matchmaking ─────────────────────────────────────────

  const buildMatchedData = useCallback(async (matchData: {
    opponent_id: string;
    opponent_elo: number;
    battle_id: string;
  }) => {
    let opponentNickname = t('battle.opponent_label');
    let opponentAvatar: string | null = null;
    let opponentLevel = 1;
    try {
      const { data: oppProfile } = await supabase
        .from('public_profiles')
        .select('nickname, avatar_url, level')
        .eq('id', matchData.opponent_id)
        .single();
      if (oppProfile) {
        opponentNickname = oppProfile.nickname;
        opponentAvatar = oppProfile.avatar_url;
        opponentLevel = oppProfile.level || 1;
      }
    } catch (e) {
      console.error('Error fetching opponent details:', e);
    }
    setMatchedData({
      battle_id: matchData.battle_id,
      opponent_id: matchData.opponent_id,
      opponent_elo: matchData.opponent_elo,
      opponent_nickname: opponentNickname,
      opponent_avatar_url: opponentAvatar,
      opponent_level: opponentLevel,
    });
  }, [t]);

  const startPolling = useCallback((mode: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data: matchData, error: matchError } = await supabase.rpc('find_ranked_match', {
          p_mode_type: mode,
        });
        if (matchError) {
          console.error('Matchmaking poll error:', matchError);
          return;
        }
        if (matchData?.matched) {
          stopPolling();
          buildMatchedData(matchData);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);
  }, [stopPolling, buildMatchedData]);

  const handleEnterQueue = useCallback(async (mode: 'daily' | 'quick' | 'tournament', stake: number) => {
    if (!profileId || isQueueTransitioning) return;
    setIsQueueTransitioning(true);
    setIsQueuing(true);
    try {
      const { data, error } = await supabase.rpc('enter_matchmaking_queue', {
        p_mode_type: mode,
        p_stake_coins: stake,
        p_elo_tolerance: 200,
      });
      if (error) throw error;

      if (data?.error) {
        // Recover if already in queue
        if (data.error.includes(t('battle.queue_term'))) {
          try {
            const { data: queueRow } = await supabase
              .from('duel_matchmaking_queue')
              .select('id, mode_type, stake_coins, queue_started_at')
              .eq('user_id', profileId)
              .single();
            if (queueRow) {
              toast.info(t('battle.resuming_queue'));
              setQueueStatus({
                queueId: queueRow.id,
                mode: queueRow.mode_type,
                stake: queueRow.stake_coins,
                joinedAt: Date.now(),
              });
              setSelectedMode(null);
              startPolling(queueRow.mode_type);
              return;
            }
          } catch (recoverErr) {
            console.error('Failed to recover queue state:', recoverErr);
          }
        }
        toast.error(data.error);
        setIsQueuing(false);
        return;
      }

      toast.success(t('battle.entered_queue'));
      setQueueStatus({ queueId: data.queue_id, mode, stake, joinedAt: Date.now() });
      setSelectedMode(null);
      startPolling(mode);
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { message?: string })?.message || '';
      if (msg.includes('PGRST202') || msg.includes('Could not find the function')) {
        toast.error(t('battle.ranking_upgrading'));
      } else {
        toast.error(err instanceof Error ? err.message : t('battle.ranking_error'));
      }
      setIsQueuing(false);
    } finally {
      setIsQueueTransitioning(false);
    }
  }, [profileId, isQueueTransitioning, t, startPolling]);

  const handleCancelQueue = useCallback(async () => {
    if (!queueStatus || isQueueTransitioning) return;
    setIsQueueTransitioning(true);
    stopPolling();
    try {
      await supabase.rpc('cancel_matchmaking_queue', { p_queue_id: queueStatus.queueId });
      toast.info(t('battle.queue_cancelled'));
    } catch (err) {
      console.error(err);
    } finally {
      setQueueStatus(null);
      setIsQueuing(false);
      setIsQueueTransitioning(false);
    }
  }, [queueStatus, isQueueTransitioning, stopPolling, t]);

  const handleMatchedAnimationComplete = useCallback(() => {
    setQueueStatus(null);
    setIsQueuing(false);
    setMatchedData(null);
    fetchArenaDataRef.current();
  }, []);

  // ── Bot Duel ──────────────────────────────────────────────

  const handleBotDuel = useCallback(async () => {
    if (!profileId) return;
    const activeBattles = battles.filter(b => b.status === 'active');
    if (activeBattles.length > 0) {
      toast.error(t('battle.already_in_battle'));
      return;
    }
    setIsBotMatching(true);
    try {
      const botId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
      const { data, error } = await supabase.rpc('start_bot_duel', {
        p_bot_id: botId,
        p_target_ml: 2000,
        p_deadline: null,
      });
      if (error) throw error;
      if (data?.error) {
        if (data.code === 'ALREADY_IN_BATTLE') {
          toast.error(t('battle.already_in_battle'));
        } else {
          toast.error(t('battle.bot_match_failed'));
        }
        return;
      }
      if (data?.battle_id) {
        toast.success(t('battle.bot_match_created'));
        fetchArenaDataRef.current();
      }
    } catch (err) {
      console.error(err);
      toast.error(t('battle.bot_match_failed'));
    } finally {
      setIsBotMatching(false);
    }
  }, [profileId, battles, t]);

  // ── Battle resolution (for BattleDetailModal) ───────────────

  const handleBattleResolved = useCallback(async (resolvedBattle: Battle, resultData: unknown) => {
    const r = resultData as { status: string; reward: number; bonus: number; win_streak: number };
    const myId = profile?.id;
    const myWp = profile?.wp ?? 0;
    const myMatches = profile?.duel_matches_total ?? 0;
    const opponentId = resolvedBattle.challenger_id === myId
      ? resolvedBattle.opponent_id
      : resolvedBattle.challenger_id;
    const opponentProfile = resolvedBattle.challenger_id === myId
      ? resolvedBattle.opponent
      : resolvedBattle.challenger;
    const oppWp = opponentProfile?.wp ?? myWp;

    let oppMatches = myMatches;
    try {
      const { data: oppData } = await supabase
        .from('public_profiles')
        .select('wp, duel_matches_total')
        .eq('id', opponentId)
        .single();
      if (oppData) {
        oppMatches = oppData.duel_matches_total ?? oppMatches;
      }
    } catch { /* use defaults */ }

    const result: MatchResult = r.status === 'won' ? 'win' : r.status === 'draw' ? 'draw' : 'loss';
    const { deltaA } = calculateWpDelta(myWp, oppWp, result, myMatches, oppMatches);

    setShowPostMatchResult({
      status: r.status as 'won' | 'loss' | 'draw',
      reward: r.reward,
      bonus: r.bonus,
      win_streak: r.win_streak,
      wp_delta: deltaA,
    });
  }, [profile?.id, profile?.wp, profile?.duel_matches_total]);

  // ── Derived values ────────────────────────────────────────

  const activeBattles = battles.filter(b => b.status === 'active');
  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return {
    // Data
    battles,
    stats,
    activeBattles,
    winRate,
    isLoading,

    // Matchmaking
    isQueuing,
    isQueueTransitioning,
    isBotMatching,
    queueStatus,
    matchedData,

    // Modals / UI state
    showPostMatchResult,
    setShowPostMatchResult,
    showBattleDetail,
    setShowBattleDetail,
    showGroupChallenge,
    setShowGroupChallenge,
    selectedMode,
    setSelectedMode,

    // Timer
    now,

    // Actions
    fetchArenaData,
    handleEnterQueue,
    handleCancelQueue,
    handleMatchedAnimationComplete,
    handleBotDuel,
    handleBattleResolved,
    stopPolling,
  };
}
