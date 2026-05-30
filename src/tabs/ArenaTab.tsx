import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Loader2, Bot, Zap, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { Profile, Battle } from '../models';
import { glassCard } from '../styles/glass';

// Sub-components
import ArenaStatsHero from './Arena/ArenaStatsHero';
import BattleModes from './Arena/BattleModes';
import ActiveBattles from './Arena/ActiveBattles';
import BattleHistory from './Arena/BattleHistory';
import BattleDetailModal from './Arena/BattleDetailModal';
import DuelLeaderboard from './Arena/DuelLeaderboard';
import SeasonBanner from './Arena/SeasonBanner';
import { GroupChallengesModal } from '@/components/modals/GroupChallengesModal';

import ArenaSubTabs, { type ArenaTabType } from './Arena/ArenaSubTabs';
import MatchmakingOverlay from './Arena/MatchmakingOverlay';
import PostMatchSummary from './Arena/PostMatchSummary';

const BOT_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
];

interface ArenaStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  rank: number;
  duelElo: number;
  totalCoins: number;
  duelWp: number;
}

interface ArenaTabProps {
  profile: Profile | null;
}

const ArenaTab = memo(({ profile }: ArenaTabProps) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<ArenaTabType>('arena');
  const [selectedMode, setSelectedMode] = useState<'daily' | 'quick' | 'tournament' | null>(null);
  const [showBattleDetail, setShowBattleDetail] = useState<Battle | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [stats, setStats] = useState<ArenaStats>({ wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0, rank: 999, duelElo: 1200, totalCoins: 0, duelWp: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isBotMatching, setIsBotMatching] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{ queueId: string; mode: string; stake: number; joinedAt: number } | null>(null);
  const [showGroupChallenge, setShowGroupChallenge] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Post match result modal states
  const [showPostMatchResult, setShowPostMatchResult] = useState<any | null>(null);
  const [postMatchBattle, setPostMatchBattle] = useState<Battle | null>(null);

  // Matchmaking found animation states
  const [matchedData, setMatchedData] = useState<{
    battle_id: string;
    opponent_id: string;
    opponent_elo: number;
    opponent_nickname?: string;
    opponent_avatar_url?: string;
    opponent_level?: number;
  } | null>(null);

  const fetchArenaDataRef = useRef<() => Promise<void>>(async () => {});
  const fetchArenaData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
          .from('hydration_battles')
          .select(`
            *,
            challenger:public_profiles!hydration_battles_challenger_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
            opponent:public_profiles!hydration_battles_opponent_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
            duel_match_history(elo_challenger_before, elo_challenger_after, elo_opponent_before, elo_opponent_after)
          `)
          .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setBattles(data);
          let wins = 0, losses = 0, draws = 0;
          data.forEach((b: Battle) => {
            if (b.status === 'completed') {
              if (b.winner_id === profile.id) wins++;
              else if (b.winner_id === null) draws++;
              else losses++;
            }
          });

          // Fetch ELO Rank Position
          let currentRankPosition = 999;
          try {
            const { data: rankList } = await supabase
              .from('public_profiles')
              .select('id, duel_elo')
              .order('duel_elo', { ascending: false });
            if (rankList) {
              const myIdx = rankList.findIndex(x => x.id === profile.id);
              if (myIdx >= 0) {
                currentRankPosition = myIdx + 1;
              }
            }
          } catch (rankErr) {
            console.error('Error fetching leaderboard rank position:', rankErr);
          }

          // Fetch Best Streak from duel match history
          let bestStreak = 0;
          try {
            const { data: historyData } = await supabase
              .from('duel_match_history')
              .select('*')
              .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`);
            if (historyData) {
              let currentStreak = 0;
              // Sort history chronologically to compute streaks
              const sortedHistory = [...historyData].sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
              sortedHistory.forEach(h => {
                if (h.winner_id === profile.id) {
                  currentStreak++;
                  bestStreak = Math.max(bestStreak, currentStreak);
                } else if (h.winner_id === null) {
                  // Draw does not reset streak, but doesn't increment
                } else {
                  currentStreak = 0;
                }
              });
            }
          } catch (streakErr) {
            console.error('Error calculating best streak:', streakErr);
          }

          setStats({
            wins, losses, draws,
            winStreak: profile?.duel_win_streak ?? 0,
            bestStreak: bestStreak || (profile?.duel_win_streak ?? 0),
            rank: currentRankPosition,
            duelElo: profile?.duel_elo ?? 1200,
            totalCoins: profile?.coins ?? 0,
            duelWp: profile?.duel_wp ?? 0,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error(t('battle.load_error'));
      } finally {
        setIsLoading(false);
      }
  }, [profile?.id, profile?.duel_win_streak, profile?.duel_elo, profile?.duel_wp, profile?.coins, t]);
  fetchArenaDataRef.current = fetchArenaData;

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel(`battles:${profile.id}`)
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `challenger_id=eq.${profile.id}`,
      }, () => {
        fetchArenaDataRef.current();
      })
      .on('postgres_changes' as never, {
        event: '*',
        schema: 'public',
        table: 'hydration_battles',
        filter: `opponent_id=eq.${profile.id}`,
      }, () => {
        fetchArenaDataRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    fetchArenaData();
  }, [fetchArenaData]);

  useEffect(() => {
    // Precise 1s timer for active duels (quick mode matches are short)
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Matchmaking poll
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleEnterQueue = useCallback(async (mode: 'daily' | 'quick' | 'tournament', stake: number) => {
    if (!profile?.id) return;
    setIsQueuing(true);
    try {
      const { data, error } = await supabase.rpc('enter_matchmaking_queue', {
        p_mode_type: mode,
        p_stake_coins: stake,
        p_elo_tolerance: 200,
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setIsQueuing(false);
        return;
      }
      toast.success(t('battle.entered_queue'));
      setQueueStatus({ queueId: data.queue_id, mode, stake, joinedAt: Date.now() });
      setSelectedMode(null);

      // Start polling find_ranked_match every 5s
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
            
            // Fetch opponent details for cinematic screen
            let opponentNickname = 'Đối Thủ';
            let opponentAvatar = null;
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
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('PGRST202') || msg.includes('Could not find the function')) {
        toast.error(t('battle.ranking_upgrading'));
      } else {
        toast.error(err instanceof Error ? err.message : t('battle.ranking_error'));
      }
      setIsQueuing(false);
    }
  }, [profile?.id, stopPolling, t]);

  const handleCancelQueue = useCallback(async () => {
    if (!queueStatus) return;
    stopPolling();
    try {
      await supabase.rpc('cancel_matchmaking_queue', { p_queue_id: queueStatus.queueId });
      toast.info(t('battle.queue_cancelled'));
    } catch (err) {
      console.error(err);
    }
    setQueueStatus(null);
    setIsQueuing(false);
  }, [queueStatus, stopPolling, t]);

  const handleMatchedAnimationComplete = useCallback(() => {
    setQueueStatus(null);
    setIsQueuing(false);
    setMatchedData(null);
    fetchArenaDataRef.current();
  }, []);

  const activeBattles = battles.filter(b => b.status === 'active');
  const winRate = stats.wins + stats.losses > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
          <Swords className="absolute inset-0 m-auto text-rose-500 opacity-50" size={16} />
        </div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">{t('common.loading_data')}</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-10 custom-scrollbar">
      {/* Fullscreen Matchmaking Overlay */}
      <MatchmakingOverlay
        queueStatus={queueStatus}
        profile={profile}
        onCancel={handleCancelQueue}
        matchedData={matchedData}
        onMatchedAnimationComplete={handleMatchedAnimationComplete}
      />

      {/* Season Banner */}
      <SeasonBanner userId={profile?.id} />

      {/* Sub tabs navigation */}
      <ArenaSubTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Tab contents with slide animations */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'arena' && (
          <motion.div
            key="arena-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Hero Stats */}
            <ArenaStatsHero
              winRate={winRate}
              wins={stats.wins}
              losses={stats.losses}
              draws={stats.draws}
              winStreak={stats.winStreak}
              duelWp={stats.duelWp}
              rank={stats.rank}
              duelElo={stats.duelElo}
            />

            {/* Quick Actions: Bot Duel + Quick Match + Group Challenge */}
            <div className="px-5 mb-4 grid grid-cols-3 gap-3">
              <button
                onClick={async () => {
                  if (!profile?.id) return;
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
                }}
                disabled={isBotMatching || activeBattles.length > 0}
                className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50`}
              >
                {isBotMatching ? (
                  <Loader2 size={24} className="animate-spin text-cyan-400" />
                ) : (
                  <Bot size={24} className="text-cyan-400" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{t('battle.duel_with_bot')}</span>
                <span className="text-[8px] text-slate-500">{t('common.start')}</span>
              </button>

              <button
                onClick={async () => {
                  if (!profile?.id) return;
                  await handleEnterQueue('quick', 0);
                }}
                disabled={isQueuing}
                className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50`}
              >
                {isQueuing ? (
                  <Loader2 size={24} className="animate-spin text-rose-400" />
                ) : (
                  <Zap size={24} className="text-rose-400" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{t('battle.duel_quick')}</span>
                <span className="text-[8px] text-slate-500">{t('battle.find_random_opponent')}</span>
              </button>

              <button
                onClick={() => setShowGroupChallenge(true)}
                className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all`}
              >
                <Users size={24} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{t('battle.group_challenge')}</span>
                <span className="text-[8px] text-slate-500">{t('battle.group_challenge_desc')}</span>
              </button>
            </div>

            <BattleModes
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              onEnterQueue={handleEnterQueue}
              isQueuing={isQueuing}
              totalMatches={stats.wins + stats.losses + stats.draws}
              userElo={stats.duelElo}
            />

            {/* Active Battles List */}
            <ActiveBattles
              battles={activeBattles}
              profile={profile}
              now={now}
              onSelectBattle={setShowBattleDetail}
            />
          </motion.div>
        )}

        {activeSubTab === 'leaderboard' && (
          <motion.div
            key="leaderboard-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DuelLeaderboard />
          </motion.div>
        )}

        {activeSubTab === 'history' && (
          <motion.div
            key="history-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <BattleHistory
              battles={battles}
              profile={profile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State when no battles found at all */}
      {battles.length === 0 && activeSubTab === 'arena' && (
        <div className="px-5 py-16 flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-white/5 rounded-[3rem] mx-5 mt-4 group">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-500">
            <Swords size={32} className="text-slate-600 group-hover:text-rose-500 transition-colors" />
          </div>
          <p className="text-white text-lg font-black mb-2 tracking-tight">{t('common.no_battles_yet')}</p>
          <p className="text-slate-500 text-xs text-center px-10 font-medium leading-relaxed">
            {t('battle.info_hint')}
          </p>
        </div>
      )}

      {/* Battle Detail Modal */}
      <AnimatePresence>
        {showBattleDetail && (
          <BattleDetailModal
            key="battle-detail-modal"
            battle={showBattleDetail}
            profile={profile}
            now={now}
            onClose={() => setShowBattleDetail(null)}
            onActionComplete={() => { fetchArenaDataRef.current(); }}
            onBattleResolved={(resolvedBattle, resultData) => {
              setPostMatchBattle(resolvedBattle);
              setShowPostMatchResult(resultData);
            }}
          />
        )}
      </AnimatePresence>

      {/* Cinematic Post-Match Summary Overlay */}
      <PostMatchSummary
        isOpen={!!showPostMatchResult}
        onClose={() => {
          setShowPostMatchResult(null);
          setPostMatchBattle(null);
          fetchArenaDataRef.current();
        }}
        battle={postMatchBattle!}
        result={showPostMatchResult}
      />

      {/* Group Challenges Modal */}
      <GroupChallengesModal
        isOpen={showGroupChallenge}
        onClose={() => setShowGroupChallenge(false)}
      />
    </div>
  );
});

export default ArenaTab;

