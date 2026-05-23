import { memo, useMemo } from 'react';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { glassCard } from '../../styles/glass';

interface StreakAnalyticsCardProps {
  weeklyData: { d: string; ml: number }[];
  waterGoal: number;
  currentStreak: number;
}

export const StreakAnalyticsCard = memo(function StreakAnalyticsCard({
  weeklyData,
  waterGoal,
  currentStreak,
}: StreakAnalyticsCardProps) {
  const analysis = useMemo(() => {
    if (weeklyData.length < 3) return null;

    // Calculate streaks from weekly data
    const streaks: number[] = [];
    let run = 0;
    for (const day of weeklyData) {
      if (day.ml >= waterGoal) {
        run++;
      } else {
        if (run > 0) streaks.push(run);
        run = 0;
      }
    }
    if (run > 0) streaks.push(run);

    const longestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const avgStreak = streaks.length > 0 ? Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10 : 0;
    const totalGoalDays = weeklyData.filter(d => d.ml >= waterGoal).length;
    const completionRate = Math.round((totalGoalDays / weeklyData.length) * 100);

    // Streak momentum: are recent days better?
    const recentDays = weeklyData.slice(-3);
    const recentGoalDays = recentDays.filter(d => d.ml >= waterGoal).length;
    const momentum: 'strong' | 'moderate' | 'weak' = recentGoalDays >= 3 ? 'strong' : recentGoalDays >= 1 ? 'moderate' : 'weak';

    return { longestStreak, avgStreak, totalGoalDays, completionRate, momentum, streakCount: streaks.length };
  }, [weeklyData, waterGoal]);

  if (!analysis) return null;

  const momentumConfig = {
    strong: { label: 'Mạnh', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    moderate: { label: 'Ổn định', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    weak: { label: 'Cần cải thiện', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  };
  const mc = momentumConfig[analysis.momentum];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`${glassCard} p-5`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Flame size={16} className="text-orange-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Phân tích Streak
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mc.bg} ${mc.color}`}>
          {mc.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
          <Flame size={18} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-lg font-black text-white">{currentStreak}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Streak hiện tại</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
          <Trophy size={18} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-lg font-black text-white">{analysis.longestStreak}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Kỷ lục streak</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
          <Calendar size={18} className="text-cyan-400 shrink-0" />
          <div>
            <p className="text-lg font-black text-white">{analysis.completionRate}%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Tỷ lệ đạt</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
          <TrendingUp size={18} className="text-violet-400 shrink-0" />
          <div>
            <p className="text-lg font-black text-white">{analysis.avgStreak}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TB streak</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
