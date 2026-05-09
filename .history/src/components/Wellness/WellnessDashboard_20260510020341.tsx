import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  ChevronRight,
  Flame,
  Lightbulb,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
  Star,
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
  softBorder: string;
  softBg: string;
  glow: string;
  spark: string;
};

type MetricCardData = {
  label: string;
  score: number;
  icon: React.ElementType;
  description: string;
  trend?: number[];
  previousScore?: number;
  tone: MetricTone;
};

const TIER_COLORS: Record<string, string> = {
  purple: '#a855f7',
  amber: '#f59e0b',
  emerald: '#10b981',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  rose: '#ef4444',
};

function getScoreColor(score: number): string {
  if (score >= 90) return TIER_COLORS.purple;
  if (score >= 80) return TIER_COLORS.amber;
  if (score >= 70) return TIER_COLORS.emerald;
  if (score >= 60) return TIER_COLORS.blue;
  if (score >= 50) return TIER_COLORS.cyan;
  return TIER_COLORS.rose;
}

function getMetricTone(score: number, palette: 'cyan' | 'orange' | 'emerald' | 'purple' | 'indigo' | 'rose' | 'amber' | 'blue' | 'lime') {
  const map: Record<typeof palette, MetricTone> = {
    cyan: {
      text: 'text-cyan-400',
      softBorder: 'border-cyan-500/20',
      softBg: 'bg-cyan-500/8',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.12)]',
      spark: '#22d3ee',
    },
    orange: {
      text: 'text-orange-400',
      softBorder: 'border-orange-500/20',
      softBg: 'bg-orange-500/8',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.12)]',
      spark: '#fb923c',
    },
    emerald: {
      text: 'text-emerald-400',
      softBorder: 'border-emerald-500/20',
      softBg: 'bg-emerald-500/8',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      spark: '#34d399',
    },
    purple: {
      text: 'text-purple-400',
      softBorder: 'border-purple-500/20',
      softBg: 'bg-purple-500/8',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.12)]',
      spark: '#c084fc',
    },
    indigo: {
      text: 'text-indigo-400',
      softBorder: 'border-indigo-500/20',
      softBg: 'bg-indigo-500/8',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.12)]',
      spark: '#818cf8',
    },
    rose: {
      text: 'text-rose-400',
      softBorder: 'border-rose-500/20',
      softBg: 'bg-rose-500/8',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',
      spark: '#fb7185',
    },
    amber: {
      text: 'text-amber-400',
      softBorder: 'border-amber-500/20',
      softBg: 'bg-amber-500/8',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
      spark: '#fbbf24',
    },
    blue: {
      text: 'text-blue-400',
      softBorder: 'border-blue-500/20',
      softBg: 'bg-blue-500/8',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
      spark: '#60a5fa',
    },
    lime: {
      text: 'text-lime-400',
      softBorder: 'border-lime-500/20',
      softBg: 'bg-lime-500/8',
      glow: 'shadow-[0_0_20px_rgba(132,204,22,0.12)]',
      spark: '#a3e635',
    },
  };

  if (score >= 80) return map.emerald;
  if (score >= 65) return map.blue;
  if (score >= 50) return map.orange;
  return map.rose;
}

function useAnimatedScore(target: number, duration = 900) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startValue = current;
    const diff = target - startValue;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress === 1
          ? 1
          : 1 - Math.pow(2, -10 * progress) * Math.sin(((progress * 10 - 0.75) * 2 * Math.PI) / 3);

      setCurrent(startValue + diff * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]); // intentional: animate toward new target

  return Math.round(current);
}

function useConfettiStyle(index: number) {
  const style = useMemo(() => {
    const colors = ['#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#ef4444'];
    const color = colors[index % colors.length];
    const x = (Math.random() - 0.5) * 260;
    const y = Math.random() * 320 + 180;
    const rotation = Math.random() * 720 - 360;
    const scale = Math.random() * 0.5 + 0.45;
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
      transition={{ duration: 1.9, ease: 'easeOut', delay }}
      style={{
        width: `${scale * 8}px`,
        height: `${scale * 8}px`,
        backgroundColor: color,
      }}
    />
  );
}

function MetricCard({
  label,
  score,
  icon: Icon,
  tone,
  description,
  trend,
  previousScore,
  index,
}: MetricCardData & { index: number }) {
  const [hovered, setHovered] = useState(false);
  const animatedScore = useAnimatedScore(score);
  const diff = (previousScore ?? score) - score;
  const delta = previousScore == null ? 0 : score - previousScore;

  const max = trend?.length ? Math.max(...trend) : 1;
  const min = trend?.length ? Math.min(...trend) : 0;
  const range = max - min || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 110, damping: 16 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group"
    >
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        className={`relative overflow-hidden rounded-2xl border bg-slate-900/50 p-4 backdrop-blur-xl transition-all duration-300 ${tone.softBorder} ${tone.glow} hover:border-white/10 hover:bg-slate-900/65`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 ${hovered ? 'opacity-100' : ''}`} />

        <div className="relative z-10 flex h-full flex-col items-center text-center">
          <motion.div
            animate={hovered ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${tone.softBorder} ${tone.softBg}`}
          >
            <Icon size={18} className={tone.text} />
          </motion.div>

          <div className="flex items-end justify-center gap-1.5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.08 + 0.2, type: 'spring', stiffness: 140 }}
              className={`text-2xl font-black leading-none ${tone.text}`}
            >
              {animatedScore}
            </motion.div>
            {previousScore != null && delta !== 0 && (
              <div className={`pb-1 text-[11px] font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta > 0 ? '+' : ''}
                {delta}
              </div>
            )}
          </div>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] leading-relaxed text-slate-500">
            {description}
          </p>

          {trend?.length ? (
            <div className="mt-3 flex h-7 items-end gap-0.5">
              {trend.map((value, i) => {
                const height = ((value - min) / range) * 100;
                return (
                  <motion.div
                    key={`${label}-${i}`}
                    initial={{ height: 2, opacity: 0.2 }}
                    animate={{ height: `${Math.max(height, 18)}%`, opacity: i === trend.length - 1 ? 1 : 0.45 }}
                    transition={{ duration: 0.35 }}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: tone.spark }}
                  />
                );
              })}
            </div>
          ) : null}

          {score >= 90 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.08 + 0.4, type: 'spring' }}
              className="absolute -right-1 -top-1"
            >
              <div className="rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1.5 shadow-lg">
                <Star size={11} className="fill-white text-white" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -120 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 180 }}
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
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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
  const streak = 12; // replace with real data when available

  const previousScores = {
    hydration: 75,
    sleep: 82,
    activity: 65,
    mood: 88,
  };

  const components: MetricCardData[] = useMemo(
    () => [
      {
        label: 'Hydration',
        score: hydrationScore,
        icon: Zap,
        tone: getMetricTone(hydrationScore, 'cyan'),
        description: `${Math.round(hydrationScore)}% của mục tiêu`,
        trend: [72, 75, 78, 73, 76, 79, hydrationScore],
        previousScore: previousScores.hydration,
      },
      {
        label: 'Sleep',
        score: sleepScore,
        icon: ActivityIcon,
        tone: getMetricTone(sleepScore, 'indigo'),
        description: sleepScore >= 80 ? 'Chất lượng tốt' : 'Cần cải thiện',
        trend: [80, 82, 79, 85, 83, 81, sleepScore],
        previousScore: previousScores.sleep,
      },
      {
        label: 'Activity',
        score: activityScore,
        icon: Zap,
        tone: getMetricTone(activityScore, 'amber'),
        description: activityScore >= 70 ? 'Rất năng động' : 'Ít vận động',
        trend: [60, 65, 63, 68, 70, 67, activityScore],
        previousScore: previousScores.activity,
      },
      {
        label: 'Mood',
        score: moodScore,
        icon: ActivityIcon,
        tone: getMetricTone(moodScore, 'emerald'),
        description: moodScore >= 80 ? 'Tích cực' : moodScore >= 60 ? 'Bình thường' : 'Cần cải thiện',
        trend: [85, 88, 86, 90, 87, 89, moodScore],
        previousScore: previousScores.mood,
      },
    ],
    [activityScore, hydrationScore, moodScore, sleepScore]
  );

  useEffect(() => {
    if (wellnessScore < 90 || prefersReducedMotion) return;

    setShowCelebration(true);
    const timer = window.setTimeout(() => setShowCelebration(false), 2400);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, wellnessScore]);

  const animatedWellnessScore = useAnimatedScore(wellnessScore);
  const metricDiff = Math.round(wellnessScore - weeklyAverage);

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
                  opacity: [0.24, 0.45, 0.24],
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
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              {trend}
            </span>
          </div>
        </div>

        <div className="relative flex justify-center py-5 sm:py-6">
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
                style={{
                  filter: `drop-shadow(0 0 12px ${scoreColor}80)`,
                }}
              />

              {[25, 50, 75, 100].map((mark) => {
                const angle = (mark / 100) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + 45 * Math.cos(angle);
                const y = 50 + 45 * Math.sin(angle);

                return (
                  <motion.circle
                    key={mark}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={wellnessScore >= mark ? scoreColor : 'rgba(255,255,255,0.1)'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35 + mark / 100, type: 'spring' }}
                  />
                );
              })}
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
                  {animatedWellnessScore}
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

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="mx-auto mt-1.5 max-w-[125px] text-[10px] leading-tight text-slate-400"
                >
                  {tier.description}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {components.map((item, index) => (
            <MetricCard key={item.label} {...item} index={index} />
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
              <span className={`pb-0.5 text-xs font-bold ${metricDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metricDiff >= 0 ? '↑' : '↓'} {Math.abs(metricDiff)}
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
              <h3 className="text-sm font-black text-white">Insights dinh dưỡng</h3>
            </div>
            <div className="text-xs font-bold text-slate-500">{insights.length} insights</div>
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
          <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
          <Target size={18} className="relative z-10" />
          <span className="relative z-10">Xem phân tích chi tiết</span>
          <ChevronRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
        </motion.button>
      )}
    </div>
  );
});