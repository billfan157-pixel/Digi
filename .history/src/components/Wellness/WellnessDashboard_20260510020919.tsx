import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  ChevronRight,
  Flame,
  Lightbulb,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Star,
  Droplets,
  MoonStar,
  HeartPulse,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { WellnessCorrelation } from '@/utils/wellnessMath';

interface WellnessDashboardProps {
  onNavigateToInsight?: () => void;
}

type TrendDirection = 'up' | 'down' | 'flat';

type MetricTone = {
  text: string;
  border: string;
  bg: string;
  glow: string;
  spark: string;
};

type MetricCardData = {
  label: string;
  score: number;
  icon: React.ElementType;
  tone: MetricTone;
  trend?: number[];
};

function getScoreColor(score: number): string {
  if (score >= 90) return '#a855f7';
  if (score >= 80) return '#f59e0b';
  if (score >= 70) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 50) return '#06b6d4';
  return '#ef4444';
}

function getTone(score: number): MetricTone {
  if (score >= 80) {
    return {
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/8',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      spark: '#34d399',
    };
  }

  if (score >= 65) {
    return {
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/8',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.12)]',
      spark: '#22d3ee',
    };
  }

  if (score >= 50) {
    return {
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/8',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
      spark: '#fbbf24',
    };
  }

  return {
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/8',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',
    spark: '#fb7185',
  };
}

function useAnimatedScore(target: number, duration = 900) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const startValue = current;
    const diff = target - startValue;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased =
        progress === 1
          ? 1
          : 1 - Math.pow(2, -10 * progress) * Math.sin(((progress * 10 - 0.75) * 2 * Math.PI) / 3);

      setCurrent(startValue + diff * eased);

      if (progress < 1) raf = requestAnimationFrame(animate);
      else setCurrent(target);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return Math.round(current);
}

function useConfettiStyle(index: number) {
  const style = useMemo(() => {
    const colors = ['#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#ef4444'];
    const color = colors[index % colors.length];
    const x = (Math.random() - 0.5) * 260;
    const y = Math.random() * 320 + 160;
    const rotation = Math.random() * 720 - 360;
    const scale = Math.random() * 0.45 + 0.45;
    return { color, x, y, rotation, scale };
  }, [index]);

  return style;
}

function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const { color, x, y, rotation, scale } = useConfettiStyle(index);

  return (
    <motion.div
      className="absolute rounded-full"
      initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x,
        y,
        rotate: rotation,
        scale: [scale, scale * 0.55, 0],
      }}
      transition={{ duration: 1.8, ease: 'easeOut', delay }}
      style={{
        width: `${scale * 8}px`,
        height: `${scale * 8}px`,
        backgroundColor: color,
      }}
    />
  );
}

function MetricChip({
  label,
  score,
  icon: Icon,
  tone,
  trend,
}: MetricCardData) {
  const animated = useAnimatedScore(score);

  const max = trend?.length ? Math.max(...trend) : 1;
  const min = trend?.length ? Math.min(...trend) : 0;
  const range = max - min || 1;
  const latest = trend?.[trend.length - 1] ?? score;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/55 p-3 backdrop-blur-xl transition-all ${tone.border} ${tone.glow}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100`} />
      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${tone.border} ${tone.bg}`}>
            <Icon size={16} className={tone.text} />
          </div>

          <div className="text-right">
            <p className={`text-lg font-black leading-none ${tone.text}`}>{animated}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          </div>
        </div>

        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: tone.spark }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Hôm nay</span>
          <span className={latest >= score ? 'text-emerald-400' : 'text-rose-400'}>
            {latest >= score ? '↑' : '↓'} {Math.abs(Math.round(latest - score))}
          </span>
        </div>

        {trend?.length ? (
          <div className="mt-2 flex h-7 items-end gap-0.5">
            {trend.slice(-7).map((v, i) => {
              const h = ((v - min) / range) * 100;
              return (
                <motion.div
                  key={`${label}-${i}`}
                  initial={{ height: 2, opacity: 0.2 }}
                  animate={{ height: `${Math.max(h, 18)}%`, opacity: i === trend.length - 1 ? 1 : 0.45 }}
                  transition={{ duration: 0.35 }}
                  className="w-1.5 rounded-full"
                  style={{ backgroundColor: tone.spark }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -120 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.55, type: 'spring', stiffness: 180 }}
      className="absolute right-4 top-4 z-20"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 blur-lg opacity-80" />
        <div className="relative rounded-full border border-white/15 bg-gradient-to-r from-orange-400 to-red-500 px-3 py-2 shadow-xl">
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-white" />
            <div className="leading-none">
              <p className="text-xs font-black text-white">{streak}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider text-white/80">
                Day Streak
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ scale: 0, x: -32 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ delay: 0.45, type: 'spring', stiffness: 180 }}
      className="absolute left-4 top-4 z-20"
    >
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-purple-500/90 to-pink-500/90 px-3 py-2 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-300" />
          <div className="leading-none">
            <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-white/80">
              Level
            </p>
            <p className="text-lg font-black leading-none text-white">{level}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InsightCard({
  insight,
  index,
  isExpanded,
  onToggle,
}: {
  insight: WellnessCorrelation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const positive = insight.strength > 0;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2 }}
      onClick={onToggle}
      className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 text-left backdrop-blur-xl transition-all hover:border-white/10"
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${
          positive ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      <div className="relative z-10 p-4 pl-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold leading-snug text-white">
              {insight.insight}
            </h4>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 pt-0.5"
          >
            <ChevronRight size={16} className="text-slate-400" />
          </motion.div>
        </div>

        <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="mt-0.5 shrink-0 text-cyan-400" />
            <p className="text-xs leading-relaxed text-slate-300">
              {insight.recommendation}
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 overflow-hidden pt-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Ví dụ thực tế
              </p>

              {insight.examples.map((example, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-white/5 p-3"
                >
                  <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-slate-300">
                      {example.scenario}
                    </p>
                    <p className={`mt-1 text-[10px] font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {example.impact}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default memo(function WellnessDashboard({ onNavigateToInsight }: WellnessDashboardProps) {
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

  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const scoreColor = getScoreColor(wellnessScore);
  const trendDirection: TrendDirection = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'flat';
  const trendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor =
    trendDirection === 'up'
      ? 'text-emerald-400'
      : trendDirection === 'down'
        ? 'text-rose-400'
        : 'text-slate-400';

  const level = Math.floor(wellnessScore / 15) + 1;
  const streak = 12;

  const metrics: MetricCardData[] = useMemo(
    () => [
      {
        label: 'Hydration',
        score: hydrationScore,
        icon: Droplets,
        tone: getTone(hydrationScore),
        trend: [72, 75, 78, 73, 76, 79, hydrationScore],
      },
      {
        label: 'Sleep',
        score: sleepScore,
        icon: MoonStar,
        tone: getTone(sleepScore),
        trend: [80, 82, 79, 85, 83, 81, sleepScore],
      },
      {
        label: 'Activity',
        score: activityScore,
        icon: HeartPulse,
        tone: getTone(activityScore),
        trend: [60, 65, 63, 68, 70, 67, activityScore],
      },
      {
        label: 'Mood',
        score: moodScore,
        icon: Sparkles,
        tone: getTone(moodScore),
        trend: [85, 88, 86, 90, 87, 89, moodScore],
      },
    ],
    [activityScore, hydrationScore, moodScore, sleepScore]
  );

  useEffect(() => {
    if (wellnessScore < 90 || prefersReducedMotion) return;

    setShowCelebration(true);
    const timer = window.setTimeout(() => setShowCelebration(false), 2200);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, wellnessScore]);

  const animatedScore = useAnimatedScore(wellnessScore);
  const weeklyDelta = Math.round(wellnessScore - weeklyAverage);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-slate-950/85 to-slate-900/55 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <LevelBadge level={level} />
        <StreakBadge streak={streak} />

        {showCelebration && !prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {Array.from({ length: 26 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.03} index={i} />
            ))}
          </div>
        )}

        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: [0.22, 0.42, 0.22],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${
            wellnessScore >= 80
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
              : wellnessScore >= 60
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                : 'bg-gradient-to-br from-orange-400 to-rose-500'
          }`}
        />

        <div className="relative mb-5 flex items-start justify-between pt-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Điểm Wellbeing
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-white">
              Wellness Score
            </h3>
          </div>

          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            {React.createElement(trendIcon, { size: 17 })}
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{trend}</span>
          </div>
        </div>

        <div className="relative flex justify-center py-5">
          <div className="relative h-40 w-40 sm:h-44 sm:w-44">
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.04, 1],
                    }
              }
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)`,
              }}
            />

            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
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
                transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ filter: `drop-shadow(0 0 12px ${scoreColor}80)` }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 180 }}
              >
                <motion.span
                  animate={
                    wellnessScore >= 90 && !prefersReducedMotion
                      ? { scale: [1, 1.06, 1] }
                      : {}
                  }
                  transition={{
                    duration: 0.55,
                    repeat: wellnessScore >= 90 && !prefersReducedMotion ? Infinity : 0,
                    repeatDelay: 1.6,
                  }}
                  className="block text-6xl font-black leading-none sm:text-7xl"
                  style={{
                    color: scoreColor,
                    textShadow: `0 0 20px ${scoreColor}66`,
                  }}
                >
                  {animatedScore}
                </motion.span>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-2 flex items-center justify-center gap-1.5"
                >
                  <span className="text-xl">{tier.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: tier.color }}>
                    {tier.tier}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((item, index) => (
            <MetricChip key={item.label} {...item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-5 rounded-2xl border border-white/5 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ActivityIcon size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">Trung bình tuần</span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-2xl font-black leading-none text-slate-200">
                {Math.round(weeklyAverage)}
              </span>
              <span className={`pb-0.5 text-xs font-bold ${weeklyDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {weeklyDelta >= 0 ? '↑' : '↓'} {Math.abs(weeklyDelta)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              <h3 className="text-sm font-black text-white">Insights</h3>
            </div>
            <div className="text-xs font-bold text-slate-500">{insights.length} mục</div>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                index={idx}
                isExpanded={expandedInsight === idx}
                onToggle={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {onNavigateToInsight && (
        <motion.button
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToInsight}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 py-4 text-sm font-bold text-cyan-300 transition-all hover:border-cyan-500/30 hover:from-cyan-500/15 hover:to-blue-500/15 hover:shadow-lg"
        >
          <Target size={18} className="relative z-10" />
          <span className="relative z-10">Xem phân tích chi tiết</span>
          <ChevronRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
        </motion.button>
      )}
    </div>
  );
});