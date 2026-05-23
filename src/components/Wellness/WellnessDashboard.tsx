import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Droplets,
  Flame,
  Lightbulb,
  Minus,
  MoonStar,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  HeartPulse,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { WellnessCorrelation } from '@/utils/wellnessMath';

interface WellnessDashboardProps {
  onNavigateToInsight?: () => void;
  streak?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function useAnimatedScore(target: number, duration = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = value;
    const diff = target - from;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + diff * eased);

      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return Math.round(value);
}

function MetricMiniCard({
  label,
  score,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
}) {
  const animated = useAnimatedScore(score);

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5"
          style={{ color }}
        >
          <Icon size={16} />
        </div>
        <span className="text-lg font-black" style={{ color }}>
          {animated}
        </span>
      </div>

      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function InsightCard({
  insight,
  isExpanded,
  onToggle,
}: {
  insight: WellnessCorrelation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const positive = insight.strength > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-left transition-colors hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={`mb-2 h-1 w-10 rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold text-white">{insight.insight}</p>
        </div>
        <ChevronRight
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-300">
        {insight.recommendation}
      </p>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {insight.examples.map((ex, i) => (
                <div key={i} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-slate-300">{ex.scenario}</p>
                  <p className={`mt-1 text-[10px] font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ex.impact}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm text-orange-300">
      <Flame size={14} />
      <span className="font-bold">{streak} ngày</span>
    </div>
  );
}

export default memo(function WellnessDashboard({ onNavigateToInsight, streak = 0 }: WellnessDashboardProps) {
  const prefersReducedMotion = useReducedMotion();
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
  const score = useAnimatedScore(wellnessScore);
  const level = Math.floor(wellnessScore / 15) + 1;
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const trendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const metrics = useMemo(
    () => [
      { label: 'Hydration', score: hydrationScore, icon: Droplets, color: '#22d3ee' },
      { label: 'Sleep', score: sleepScore, icon: MoonStar, color: '#818cf8' },
      { label: 'Activity', score: activityScore, icon: HeartPulse, color: '#f59e0b' },
      { label: 'Mood', score: moodScore, icon: Sparkles, color: '#34d399' },
    ],
    [activityScore, hydrationScore, moodScore, sleepScore]
  );

  const progress = Math.max(0, Math.min(100, wellnessScore));
  const weeklyDelta = Math.round(wellnessScore - weeklyAverage);

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-white/5 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Điểm Wellbeing
            </p>
            <h3 className="mt-1 text-xl font-black text-white">Wellness Score</h3>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            {React.createElement(trendIcon, { size: 16 })}
            <span className="text-xs font-bold uppercase tracking-[0.16em]">{trend}</span>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 283' }}
                animate={{ strokeDasharray: `${(progress / 100) * 283} 283` }}
                transition={{ duration: prefersReducedMotion ? 0 : 1 }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black" style={{ color: scoreColor }}>
                {score}
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {tier.tier}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Level</span>
                <span className="text-sm font-bold text-white">{level}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: scoreColor,
                  }}
                />
              </div>
            </div>

            <StreakBadge streak={streak} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <MetricMiniCard key={m.label} {...m} />
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">Trung bình tuần</span>
            </div>
            <span className="text-sm font-black text-slate-200">
              {Math.round(weeklyAverage)}
              <span className={`ml-2 text-xs ${weeklyDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {weeklyDelta >= 0 ? '↑' : '↓'} {Math.abs(weeklyDelta)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb size={16} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">Insights</h3>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                isExpanded={expandedInsight === idx}
                onToggle={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      )}

      {onNavigateToInsight && (
        <button
          type="button"
          onClick={onNavigateToInsight}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-4 text-sm font-bold text-cyan-300 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/15"
        >
          <Target size={18} />
          Xem phân tích chi tiết
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
});