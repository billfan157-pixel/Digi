import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { WellnessCorrelation } from '@/utils/wellnessMath';

interface WellnessDashboardProps {
  onNavigateToInsight?: () => void;
}

export default memo(function WellnessDashboard({ onNavigateToInsight }: WellnessDashboardProps) {
  const {
    wellnessScore,
    tier,
    trend,
    weeklyAverage,
    hydrationScore,
    sleepScore,
    activityScore,
    moodScore,
    insights,
  } = useWellnessData({ daysBack: 7 });

  const scoreColor = getScoreColor(wellnessScore);
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';

  const components = [
    {
      label: 'Hydration',
      score: hydrationScore,
      icon: '💧',
      color: hydrationScore >= 80 ? 'text-cyan-400' : hydrationScore >= 60 ? 'text-blue-400' : 'text-orange-400',
      description: `${Math.round(hydrationScore)}% của mục tiêu`,
    },
    {
      label: 'Sleep',
      score: sleepScore,
      icon: '🌙',
      color: sleepScore >= 80 ? 'text-indigo-400' : sleepScore >= 60 ? 'text-blue-400' : 'text-orange-400',
      description: sleepScore >= 80 ? 'Chất lượng tốt' : 'Cần cải thiện',
    },
    {
      label: 'Activity',
      score: activityScore,
      icon: '⚡',
      color: activityScore >= 70 ? 'text-amber-400' : activityScore >= 50 ? 'text-yellow-400' : 'text-orange-400',
      description: activityScore >= 70 ? 'Rất năng động' : 'Ít vận động',
    },
    {
      label: 'Mood',
      score: moodScore,
      icon: '😊',
      color: moodScore >= 80 ? 'text-emerald-400' : moodScore >= 60 ? 'text-lime-400' : 'text-rose-400',
      description: moodScore >= 80 ? 'Tích cực' : moodScore >= 60 ? 'Bình thường' : 'Cần cải thiện',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-400">
      {/* Main Wellness Score Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl">
        {/* Background glow based on tier */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-40 ${
            wellnessScore >= 80
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
              : wellnessScore >= 60
              ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
              : 'bg-gradient-to-br from-orange-400 to-rose-500'
          }`}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">
              Điểm Wellbeing
            </p>
            <h3 className="text-2xl font-black text-white mt-1">Wellness Score</h3>
          </div>
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            {React.createElement(trendIcon, { size: 18 })}
            <span className="text-xs font-bold uppercase tracking-wider">{trend}</span>
          </div>
        </div>

        {/* Central Score Display */}
        <div className="relative flex items-center justify-center py-6">
          {/* Circular progress */}
          <div className="relative w-44 h-44">
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 283' }}
                animate={{ strokeDasharray: `${(wellnessScore / 100) * 283} 283` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  filter: `drop-shadow(0 0 10px ${scoreColor}60)`,
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <span className="text-6xl font-black" style={{ color: scoreColor }}>
                  {wellnessScore}
                </span>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-xl">{tier.emoji}</span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                    {tier.tier}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 max-w-[120px] leading-tight">
                  {tier.description}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Component breakdown */}
        <div className="grid grid-cols-4 gap-3 mt-6 relative z-10">
          {components.map((comp) => (
            <div key={comp.label} className="text-center">
              <div className="text-2xl mb-1">{comp.icon}</div>
              <div className={`text-lg font-black ${comp.color}`}>{comp.score}</div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {comp.label}
              </p>
              <p className="text-[8px] text-slate-600 mt-0.5 leading-tight">{comp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb size={16} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">Insights dinh dưỡng</h3>
          </div>

          {insights.slice(0, 2).map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}

      {/* Action Button */}
      {onNavigateToInsight && (
        <button
          onClick={onNavigateToInsight}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:from-cyan-500/20 hover:to-blue-500/20"
        >
          <Target size={18} />
          Xem phân tích chi tiết
        </button>
      )}
    </div>
  );
});

function getScoreColor(score: number): string {
  if (score >= 90) return '#a855f7'; // purple
  if (score >= 80) return '#f59e0b'; // amber
  if (score >= 70) return '#10b981'; // emerald
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 50) return '#06b6d4'; // cyan
  return '#ef4444'; // red
}

interface InsightCardProps {
  insight: WellnessCorrelation;
}

function InsightCard({ insight }: InsightCardProps) {
  const isPositive = insight.strength > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="ml-3">
        <h4 className="text-sm font-bold text-white leading-snug mb-1.5">
          {insight.insight}
        </h4>

        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Ví dụ thực tế</p>
          {insight.examples.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-slate-600 font-mono">#{i + 1}</span>
              <div>
                <p className="text-slate-300">{ex.scenario}</p>
                <p className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ex.impact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
