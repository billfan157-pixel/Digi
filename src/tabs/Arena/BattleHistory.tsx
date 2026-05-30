import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Shield, X, Coins, Target, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import type { Battle, Profile } from '../../models';
import { glassInner } from '../../styles/glass';

interface BattleHistoryProps {
  battles: Battle[];
  profile: Profile | null;
}

const BattleHistory: React.FC<BattleHistoryProps> = ({ battles, profile }) => {
  const { t } = useTranslation();
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'daily' | 'quick' | 'tournament'>('all');

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const completedBattles = useMemo(() => {
    return battles.filter(b => b.status === 'completed');
  }, [battles]);

  // ELO History Trend data extraction
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const eloTrend = useMemo(() => {
    if (!profile?.id) return [];
    return [...completedBattles]
      .reverse() // oldest to newest
      .map(b => {
        const isChallenger = b.challenger_id === profile.id;
        const history = b.duel_match_history?.[0];
        if (!history) return null;
        return isChallenger ? history.elo_challenger_after : history.elo_opponent_after;
      })
      .filter((elo): elo is number => elo !== null && elo !== undefined);
  }, [completedBattles, profile?.id]);

  // Filter logic
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredBattles = useMemo(() => {
    return completedBattles.filter(b => {
      const isWin = b.winner_id === profile?.id;
      const isDraw = b.winner_id === null;
      const isLoss = b.winner_id !== null && b.winner_id !== profile?.id;

      const matchesOutcome =
        outcomeFilter === 'all' ||
        (outcomeFilter === 'win' && isWin) ||
        (outcomeFilter === 'draw' && isDraw) ||
        (outcomeFilter === 'loss' && isLoss);

      const matchesMode =
        modeFilter === 'all' ||
        b.mode_type === modeFilter;

      return matchesOutcome && matchesMode;
    });
  }, [completedBattles, outcomeFilter, modeFilter, profile?.id]);

  // SVG Sparkline drawing helper
  const sparklineSVG = useMemo(() => {
    if (eloTrend.length < 2) return null;

    const width = 240;
    const height = 48;
    const padding = 6;
    const minVal = Math.min(...eloTrend);
    const maxVal = Math.max(...eloTrend);
    const valRange = maxVal - minVal || 10;

    const points = eloTrend.map((val, idx) => {
      const x = padding + (idx / (eloTrend.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - minVal) / valRange) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Shadow area under curve */}
        <path
          d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
          fill="url(#sparklineGlow)"
          opacity="0.15"
        />
        {/* Trend line */}
        <polyline
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Glow definitions */}
        <defs>
          <linearGradient id="sparklineGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }, [eloTrend]);

  if (completedBattles.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-slate-500">
        <TrendingUp size={24} className="mx-auto mb-2 opacity-20" />
        <p className="text-xs font-bold">Chưa có lịch sử thi đấu</p>
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
          <TrendingUp size={20} className="text-emerald-400" /> {t('common.duel_history')}
        </h3>
        <span className="text-[10px] font-black text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-lg">
          Tổng: {completedBattles.length} trận
        </span>
      </div>

      {/* Sparkline ELO Chart HUD */}
      {eloTrend.length >= 2 && (
        <div className="p-4 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart2 size={12} /> Biểu đồ phong độ ELO
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              {eloTrend.length} trận gần nhất
            </span>
          </div>
          <div className="w-full mt-2">
            {sparklineSVG}
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-2">
            <span>ELO thấp nhất: {Math.min(...eloTrend)}</span>
            <span>ELO cao nhất: {Math.max(...eloTrend)}</span>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'win', 'loss', 'draw'] as const).map(f => (
            <button
              key={f}
              onClick={() => setOutcomeFilter(f)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all whitespace-nowrap ${
                outcomeFilter === f
                  ? 'bg-slate-800 border-white/10 text-white shadow-lg'
                  : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'Tất cả kết quả' : f === 'win' ? 'Thắng' : f === 'loss' ? 'Thua' : 'Hòa'}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'daily', 'quick', 'tournament'] as const).map(f => (
            <button
              key={f}
              onClick={() => setModeFilter(f)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all whitespace-nowrap ${
                modeFilter === f
                  ? 'bg-slate-800 border-white/10 text-white shadow-lg'
                  : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'Tất cả chế độ' : f === 'daily' ? 'Hằng Ngày' : f === 'quick' ? 'Đấu Nhanh' : 'Giải Đấu'}
            </button>
          ))}
        </div>
      </div>

      {/* Battles List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredBattles.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-xs font-bold">
              Không tìm thấy trận đấu phù hợp bộ lọc
            </div>
          ) : (
            filteredBattles.map((battle, index) => {
              const isWin = battle.winner_id === profile?.id;
              const isDraw = battle.winner_id === null;
              const isChallenger = battle.challenger_id === profile?.id;
              const opponent = isChallenger ? battle.opponent : battle.challenger;

              return (
                <motion.div
                  key={battle.id || `history-battle-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`${glassInner} flex items-center justify-between py-4 px-5 rounded-3xl hover:bg-white/5 transition-all group`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                      isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      isDraw ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                      'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {isWin ? <Trophy size={18} /> : isDraw ? <Shield size={18} /> : <X size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors truncate">
                        vs {opponent?.nickname || t('battle.opponent_label')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isWin ? 'text-emerald-400 bg-emerald-500/10' :
                          isDraw ? 'text-slate-400 bg-slate-500/10' :
                          'text-rose-400 bg-rose-500/10'
                        }`}>
                          {isWin ? t('battle.win') : isDraw ? t('battle.draw') : t('battle.loss')}
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold flex items-center gap-0.5">
                          <Target size={8} /> {battle.target_ml || 2000}ml
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">
                          {battle.mode || t('battle.race_goal_mode')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="flex flex-col items-end gap-0.5">
                      <div className={`flex items-center justify-end gap-1 text-xs font-black ${
                        isWin ? 'text-amber-400' : isDraw ? 'text-slate-400' : 'text-rose-400'
                      }`}>
                        {isWin ? '+' : isDraw ? '' : '-'}{battle.stake_coins} <Coins size={12} className={isWin ? "fill-amber-400/30" : isDraw ? "" : "fill-rose-400/30"} />
                      </div>
                      
                      {/* ELO Delta Badge */}
                      {(() => {
                        const history = battle.duel_match_history?.[0];
                        if (!history) return null;
                        let delta = 0;
                        if (isChallenger && history.elo_challenger_before != null && history.elo_challenger_after != null) {
                          delta = history.elo_challenger_after - history.elo_challenger_before;
                        } else if (!isChallenger && history.elo_opponent_before != null && history.elo_opponent_after != null) {
                          delta = history.elo_opponent_after - history.elo_opponent_before;
                        }
                        if (delta === 0 && !isDraw) return null;
                        const isPositive = delta > 0;
                        const isZero = delta === 0;
                        return (
                          <span className={`text-[9px] font-black ${isPositive ? 'text-emerald-400' : isZero ? 'text-slate-500' : 'text-rose-400'}`}>
                            {isPositive ? `+${delta}` : delta} ELO
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1 opacity-60">
                      {new Date(battle.created_at).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattleHistory;
