import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Loader2, TrendingUp, Flame, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import RankTierBadge from './RankTierBadge';
import type { Profile } from '../../models';

interface DuelRanking {
  id: string;
  nickname: string;
  avatar_url: string | null;
  duel_elo: number;
  duel_wp: number;
  duel_win_streak: number;
  duel_total_wins: number;
  duel_total_losses: number;
  duel_total_draws: number;
}

interface DuelLeaderboardProps {
  profile?: Profile | null;
}

export default function DuelLeaderboard({ profile }: DuelLeaderboardProps) {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<DuelRanking[]>([]);
  const [myRankPosition, setMyRankPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Fetch rankings with server-side bot exclusion
    supabase
      .from('public_profiles')
      .select('id, nickname, avatar_url, duel_elo, duel_wp, duel_win_streak, duel_total_wins, duel_total_losses, duel_total_draws')
      .gt('duel_elo', 0)
      .not('nickname', 'like', '[Bot]%')
      .not('nickname', 'like', '[System]%')
      .order('duel_elo', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.warn('[DuelLeaderboard] Query failed:', error.message);
          setHasError(true);
        } else if (data) {
          setRankings(data as DuelRanking[]);
        }
        setLoading(false);
      });

    // Fetch exact rank for current user
    if (profile?.id) {
      supabase
        .from('public_profiles')
        .select('id, duel_elo')
        .not('nickname', 'like', '[Bot]%')
        .not('nickname', 'like', '[System]%')
        .order('duel_elo', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const idx = data.findIndex(x => x.id === profile.id);
            if (idx >= 0) {
              setMyRankPosition(idx + 1);
            }
          }
        });
    }
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[10vh]">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="px-5 mt-6 py-6 bg-slate-900/40 border border-dashed border-white/5 rounded-[2rem] text-center">
        <Trophy size={24} className="text-slate-600 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-400">{t('battle.leaderboard_updating')}</p>
        <p className="text-[10px] text-slate-600 mt-1">{t('battle.leaderboard_upgrading')}</p>
      </div>
    );
  }

  if (rankings.length === 0) return null;

  const getRankStyle = (idx: number, isMe: boolean) => {
    if (isMe) return 'bg-cyan-500/10 border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
    if (idx === 0) return 'bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]';
    if (idx === 1) return 'bg-gradient-to-r from-slate-300/10 to-slate-400/5 border border-slate-300/25 shadow-[0_0_15px_rgba(203,213,225,0.1)]';
    if (idx === 2) return 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]';
    return 'bg-white/5 border border-white/5';
  };

  const getRankIcon = (idx: number) => {
    if (idx === 0) return (
      <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <Crown size={18} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
      </motion.div>
    );
    if (idx === 1) return <Medal size={16} className="text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" />;
    if (idx === 2) return <Medal size={16} className="text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]" />;
    return <span className="text-slate-500 font-bold text-xs w-5 text-center">{idx + 1}</span>;
  };

  // Podium sorting: 2nd on left, 1st in middle (highest), 3rd on right
  const podiumOrder = [1, 0, 2];
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const isMeInTop50 = rankings.some(r => r.id === profile?.id);

  return (
    <div className="px-5 mt-6 space-y-5 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
          <Trophy className="text-amber-400" size={20} />
          {t('battle.leaderboard_title')}
        </h3>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-800/60 px-2.5 py-1 rounded-lg">
          {t('battle.leaderboard_players', { count: rankings.length })}
        </span>
      </div>

      {/* 3D Visual Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 mt-6 mb-8 min-h-[220px]">
          {podiumOrder.map((posIndex) => {
            const p = top3[posIndex];
            if (!p) return null;

            const isFirst = posIndex === 0;
            const isSecond = posIndex === 1;
            const isMe = p.id === profile?.id;

            const wr = p.duel_total_wins + p.duel_total_losses > 0
              ? Math.round((p.duel_total_wins / (p.duel_total_wins + p.duel_total_losses)) * 100)
              : 0;

            // Height scaling for 3D podium
            const height = isFirst ? 'h-[200px]' : isSecond ? 'h-[160px]' : 'h-[140px]';
            const borderGlow = isMe
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] bg-cyan-500/10'
              : isFirst
              ? 'border-yellow-500/40 shadow-[0_0_25px_rgba(234,179,8,0.2)] bg-gradient-to-b from-yellow-500/20 to-slate-900/40'
              : isSecond
              ? 'border-slate-300/30 shadow-[0_0_15px_rgba(203,213,225,0.15)] bg-gradient-to-b from-slate-400/15 to-slate-900/40'
              : 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-gradient-to-b from-orange-500/15 to-slate-900/40';

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: posIndex * 0.1 }}
                className={`flex-1 rounded-3xl border p-3 flex flex-col items-center justify-between text-center relative ${height} ${borderGlow}`}
              >
                {/* Winner Crown & Star Sparkles */}
                {isFirst && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <motion.div
                      animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown size={22} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
                    </motion.div>
                    <Sparkles size={10} className="text-yellow-400 animate-pulse mt-0.5" />
                  </div>
                )}

                <div className="flex flex-col items-center w-full mt-2">
                  <span className="text-[9px] font-black text-slate-500">#{posIndex + 1}</span>
                  <p className="text-white font-black text-[11px] truncate w-full mt-1.5 mb-1 px-1">
                    {p.nickname || t('common.anonymous')}
                  </p>
                  <RankTierBadge elo={p.duel_elo} showLabel={false} size="sm" />
                </div>

                <div className="flex flex-col items-center mb-1">
                  <div className="flex items-center gap-0.5 text-amber-400 font-black text-xs">
                    <TrendingUp size={10} />
                    {p.duel_elo}
                  </div>
                  <span className="text-[8px] text-slate-500 font-bold mt-0.5">
                    {wr}% {t('common.win_rate_short')} · {p.duel_total_wins}{t('common.win_short')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of rankings */}
      <div className="space-y-2">
        {rest.map((p, i) => {
          const idx = i + 3;
          const isMe = p.id === profile?.id;
          const total = p.duel_total_wins + p.duel_total_losses + p.duel_total_draws;
          const wr = p.duel_total_wins + p.duel_total_losses > 0
            ? Math.round((p.duel_total_wins / (p.duel_total_wins + p.duel_total_losses)) * 100)
            : 0;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(10, i) * 0.05 }}
              whileHover={{ scale: 1.01, x: 2 }}
              className={`flex items-center justify-between p-3.5 rounded-2xl ${getRankStyle(idx, isMe)} transition-all`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getRankIcon(idx)}
                <div className="min-w-0">
                  <p className="text-white font-black text-xs truncate flex items-center gap-1.5">
                    {p.nickname || t('common.anonymous')}
                    {isMe && (
                      <span className="text-[7px] font-black text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                        {t('common.you')}
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    {total} {t('common.matches')} · {t('common.win_rate_short')} {wr}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {p.duel_win_streak >= 3 && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <Flame size={10} /> {p.duel_win_streak}
                  </div>
                )}
                <RankTierBadge elo={p.duel_elo} showLabel={false} size="sm" />
                <div className="flex items-center gap-1 text-amber-400 font-black text-xs font-mono">
                  <Zap size={10} className="fill-amber-400 text-amber-400" />
                  {p.duel_elo}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky User ranking row if NOT in top 50 */}
      {profile?.id && !isMeInTop50 && myRankPosition && (
        <div className="fixed bottom-14 left-0 right-0 px-6 z-40">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between p-4 rounded-2xl border-2 border-cyan-500/30 bg-slate-900/90 backdrop-blur-xl shadow-[0_-5px_20px_rgba(6,182,212,0.2)]"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-cyan-400 font-black text-xs w-5 text-center">#{myRankPosition}</span>
              <div className="min-w-0">
                <p className="text-white font-black text-xs truncate flex items-center gap-1.5">
                  {profile.nickname || t('common.you')}
                  <span className="text-[7px] font-black text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                    {t('common.you')}
                  </span>
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                  {t('battle.outside_top_50')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <RankTierBadge elo={profile.duel_elo || 1200} showLabel={false} size="sm" />
              <div className="flex items-center gap-1 text-amber-400 font-black text-xs font-mono">
                <Zap size={10} className="fill-amber-400 text-amber-400" />
                {profile.duel_elo || 1200} ELO
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
