import { motion } from 'framer-motion';
import { Activity, Trophy, Flame, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CountUp from '../../components/CountUp';
import { glassCard } from '../../styles/glass';
import RankTierBadge from './RankTierBadge';
import { getNextRank, getRankTier, RANKS } from '../../config/rankConfig';

interface ArenaStatsHeroProps {
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  wp: number;
  rank: number;
}

const FloatingParticle = ({ color, size, top, left, delay, duration }: { color: string; size: number; top: string; left: string; delay: number; duration: number }) => (
  <motion.div
    className={`absolute rounded-full blur-[1px] pointer-events-none ${color}`}
    style={{ width: size, height: size, top, left }}
    animate={{
      y: [0, -12, 0, 8, 0],
      x: [0, 6, -4, 2, 0],
      opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

const ArenaStatsHero: React.FC<ArenaStatsHeroProps> = ({
  winRate,
  wins,
  losses,
  draws,
  winStreak,
  wp,
  rank,
}) => {
  const { t } = useTranslation();
  const totalMatches = wins + losses + draws;
  const tier = getRankTier(wp);

  const tierColor =
    tier === 'grandmaster' ? 'from-pink-500/10 to-purple-500/10' :
    tier === 'master' ? 'from-purple-500/10 to-violet-500/10' :
    tier === 'diamond' ? 'from-blue-500/10 to-cyan-500/10' :
    tier === 'platinum' ? 'from-emerald-500/10 to-teal-500/10' :
    tier === 'gold' ? 'from-amber-500/10 to-yellow-500/10' :
    tier === 'silver' ? 'from-slate-400/10 to-slate-300/10' :
    'from-orange-700/10 to-orange-600/10';

  const glowColor =
    tier === 'grandmaster' ? 'bg-pink-500/15' :
    tier === 'master' ? 'bg-purple-500/15' :
    tier === 'diamond' ? 'bg-cyan-500/15' :
    tier === 'platinum' ? 'bg-emerald-500/15' :
    tier === 'gold' ? 'bg-amber-500/15' :
    tier === 'silver' ? 'bg-slate-300/15' :
    'bg-orange-500/15';

  return (
    <div className="px-5 mb-6 space-y-3">
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`${glassCard} rounded-[2rem] p-6 relative overflow-hidden group cursor-default bg-gradient-to-br ${tierColor}`}
      >
        <div className={`absolute -right-10 -top-10 w-36 h-36 ${glowColor} blur-[60px] rounded-full group-hover:opacity-100 transition-all duration-700`} />
        <FloatingParticle color="bg-amber-400/20" size={3} top="20%" left="75%" delay={0.5} duration={5.5} />
        <FloatingParticle color="bg-cyan-400/20" size={2} top="70%" left="15%" delay={1.8} duration={6.2} />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {t('battle.current_elo', 'Wellness Points')}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white tracking-tight tabular-nums">
                  <CountUp value={wp} />
                </span>
                <span className="text-xs font-bold text-slate-400">WP</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <RankTierBadge wp={wp} size="lg" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">
                #{rank} {t('battle.global_rank', 'WP')}
              </span>
            </div>
          </div>

          {(() => {
            const next = getNextRank(wp);
            if (!next) {
              return (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-pink-400">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Trophy size={12} /> {t('battle.peak_rank')}
                  </span>
                  <span>{t('rank.grandmaster')}</span>
                </div>
              );
            }

            const currentRank = RANKS.find(r => r.tier === tier);
            const startWp = currentRank ? currentRank.wpMin : 0;
            const endWp = next.wpNeeded + wp;
            const progressRange = endWp - startWp;
            const currentProgress = wp - startWp;
            const percent = progressRange > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / progressRange) * 100))) : 0;

            return (
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400">
                    {t('battle.wp_to_next_rank', { needed: next.wpNeeded, rank: t(next.labelKey) })}
                  </span>
                  <span className="font-black text-cyan-400">{percent}%</span>
                </div>

                <div className="h-2 bg-slate-950/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          className={`${glassCard} rounded-3xl p-5 relative overflow-hidden group cursor-default`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-cyan-500/10 blur-[40px] rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('common.win_rate', 'Tỷ Lệ Thắng')}</p>
                <Activity size={14} className="text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  <CountUp value={winRate} />
                </span>
                <span className="text-xs font-bold text-cyan-400">%</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-1 text-[8px] font-black uppercase tracking-wider">
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {wins}W
                </span>
                <span className="text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded">
                  {draws}D
                </span>
                <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                  {losses}L
                </span>
              </div>
              {totalMatches > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                  <TrendingUp size={8} className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} />
                  <span className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                    {winRate >= 50 ? t('battle.positive', 'Tích cực') : t('battle.needs_improvement', 'Cần cải thiện')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          className={`${glassCard} rounded-3xl p-5 relative overflow-hidden group cursor-default`}
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 blur-[40px] rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('battle.streak_and_points')}</p>
                <Flame size={14} className="text-amber-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">{t('battle.current_streak')}</p>
                  <p className="text-lg font-black text-white flex items-center gap-1 mt-0.5">
                    🔥 {winStreak}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
              <span>{t('battle.matches_played', { count: totalMatches })}</span>
              {winStreak > 0 && <span className="text-amber-400">{t('battle.best_streak', { count: winStreak })}</span>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArenaStatsHero;
