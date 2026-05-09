import React, { memo, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Target, Trophy, Star, ChevronRight, Droplets, Moon, Zap, Heart, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { WellnessCorrelation } from '@/utils/wellnessMath';

interface WellnessDashboardProps {
  onNavigateToInsight?: () => void;
}

const SCORE_META = {
  color: (s: number) => {
    if (s >= 90) return { hex: '#a855f7', tailwind: 'text-purple-400', ring: 'from-purple-500' };
    if (s >= 80) return { hex: '#f59e0b', tailwind: 'text-amber-400', ring: 'from-amber-500' };
    if (s >= 70) return { hex: '#10b981', tailwind: 'text-emerald-400', ring: 'from-emerald-500' };
    if (s >= 60) return { hex: '#3b82f6', tailwind: 'text-blue-400', ring: 'from-blue-500' };
    if (s >= 50) return { hex: '#06b6d4', tailwind: 'text-cyan-400', ring: 'from-cyan-500' };
    return { hex: '#ef4444', tailwind: 'text-rose-400', ring: 'from-rose-500' };
  },
  bg: (s: number) => {
    if (s >= 80) return 'from-yellow-400/20 to-amber-500/10';
    if (s >= 60) return 'from-cyan-400/20 to-blue-500/10';
    return 'from-orange-400/20 to-rose-500/10';
  },
} as const;

const COMPONENT_META = [
  { key: 'hydration', label: 'Hydration', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { key: 'sleep', label: 'Giấc ngủ', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { key: 'activity', label: 'Vận động', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'mood', label: 'Tâm trạng', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
] as const;

// ===== COMPONENT CARDS =====
const ComponentCard = memo(function ComponentCard({
  label,
  score,
  Icon,
  color,
  bg,
  border,
  index,
}: {
  label: string;
  score: number;
  Icon: any;
  color: string;
  bg: string;
  border: string;
  index: number;
}) {
  const ringPct = Math.min(100, Math.max(0, score));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
      className={`relative rounded-2xl p-3.5 ${bg} ${border} border overflow-hidden`}
    >
      {/* Mini ring */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
            <motion.circle
              cx="22" cy="22" r="18"
              fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"
              initial={{ strokeDasharray: '0 113' }}
              animate={{ strokeDasharray: `${(ringPct / 100) * 113} 113` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 + index * 0.08 }}
              className={color}
              style={{ filter: `drop-shadow(0 0 6px ${SCORE_META.color(score).hex}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={15} className={color} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`text-xl font-black mt-0.5 ${color}`}>{Math.round(score)}</p>
        </div>
      </div>
    </motion.div>
  );
});

// ===== LEVEL BADGE =====
const LevelBadge = memo(function LevelBadge({ level, wp }: { level: number; wp: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className="flex items-center gap-2.5"
    >
      <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-xl px-3 py-1.5 border border-white/15">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-300" />
          <div>
            <p className="text-[7px] uppercase tracking-widest text-white/70 font-bold">Level</p>
            <p className="text-sm font-black text-white leading-none">{level}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl px-3 py-1.5 border border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400" />
          <div>
            <p className="text-[7px] uppercase tracking-widest text-slate-500 font-bold">WP</p>
            <p className="text-sm font-black text-white leading-none">{wp.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ===== INSIGHT CARD =====
const InsightCard = memo(function InsightCard({
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
  const isPositive = insight.strength > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onToggle}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="ml-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-white leading-snug">{insight.insight}</p>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{insight.recommendation}</p>
          </div>
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={14} className="text-slate-500 shrink-0 mt-0.5" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && insight.examples.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/5 mt-3 pt-3 space-y-2">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-600">Ví dụ</p>
                {insight.examples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg p-2.5">
                    <span className="text-[9px] text-slate-600 font-mono shrink-0 mt-0.5">#{i + 1}</span>
                    <div>
                      <p className="text-[10px] text-slate-300">{ex.scenario}</p>
                      <p className={`text-[9px] font-bold mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ex.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// ===== MAIN COMPONENT =====
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

  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const meta = SCORE_META.color(wellnessScore);
  const bgGradient = SCORE_META.bg(wellnessScore);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendCls = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';

  const level = useMemo(() => Math.max(1, Math.floor(wellnessScore / 15) + 1), [wellnessScore]);
  const wp = useMemo(() => Math.round(wellnessScore * 27 + level * 150), [wellnessScore, level]);

  const components = useMemo(() => [
    { score: hydrationScore, meta: COMPONENT_META[0] },
    { score: sleepScore, meta: COMPONENT_META[1] },
    { score: activityScore, meta: COMPONENT_META[2] },
    { score: moodScore, meta: COMPONENT_META[3] },
  ], [hydrationScore, sleepScore, activityScore, moodScore]);

  const milestoneHits = useMemo(() => {
    return [25, 50, 75, 100].map(m => ({
      value: m,
      hit: wellnessScore >= m,
      angle: (m / 100) * 2 * Math.PI - Math.PI / 2,
      x: 50 + 42 * Math.cos((m / 100) * 2 * Math.PI - Math.PI / 2),
      y: 50 + 42 * Math.sin((m / 100) * 2 * Math.PI - Math.PI / 2),
    }));
  }, [wellnessScore]);

  const circumference = useMemo(() => Math.round(2 * Math.PI * 42), []);

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <div className={`relative overflow-hidden rounded-[1.5rem] p-5 border border-white/5 shadow-xl bg-gradient-to-br ${bgGradient} backdrop-blur-xl`}>
        {/* Glow orb */}
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-[60px] opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${meta.hex}, transparent)` }}
        />

        {/* Header row */}
        <div className="relative flex items-start justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Điểm Wellbeing</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-black tracking-tight" style={{ color: meta.hex, textShadow: `0 0 30px ${meta.hex}40` }}>
                {wellnessScore}
              </span>
              <div className={`flex items-center gap-1 ${trendCls}`}>
                <TrendIcon size={14} />
                <span className="text-[9px] font-bold uppercase">{trend}</span>
              </div>
            </div>
          </div>
          <LevelBadge level={level} wp={wp} />
        </div>

        {/* Ring + components row */}
        <div className="relative flex items-start gap-4">
          {/* Ring */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none" stroke={meta.hex} strokeWidth="6" strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${(wellnessScore / 100) * circumference} ${circumference}` }}
                transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ filter: `drop-shadow(0 0 10px ${meta.hex}60)` }}
              />
              {milestoneHits.map((m) => (
                <motion.circle
                  key={m.value}
                  cx={m.x} cy={m.y} r="2.5"
                  fill={m.hit ? meta.hex : 'rgba(255,255,255,0.08)'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + m.value / 200, type: 'spring' }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black" style={{ color: meta.hex }}>{wellnessScore}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{tier.tier}</span>
            </div>
          </div>

          {/* Components grid */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {components.map((c, i) => (
              <ComponentCard
                key={c.meta.key}
                label={c.meta.label}
                score={c.score}
                Icon={c.meta.icon}
                color={c.meta.color}
                bg={c.meta.bg}
                border={c.meta.border}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Weekly average */}
        <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-400">Trung bình tuần</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-200">{Math.round(weeklyAverage)}</span>
            <span className={`text-[10px] font-bold ${wellnessScore > weeklyAverage ? 'text-emerald-400' : 'text-rose-400'}`}>
              {wellnessScore > weeklyAverage ? '↑' : '↓'} {Math.abs(Math.round(wellnessScore - weeklyAverage))}
            </span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Lightbulb size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-white">Phân tích</span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold">{insights.length} insights</span>
          </div>

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
      )}

      {/* Action */}
      {onNavigateToInsight && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToInsight}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-500/30 active:scale-[0.98] transition-all"
        >
          <Target size={14} />
          <span>Xem phân tích chi tiết</span>
          <ChevronRight size={14} />
        </motion.button>
      )}
    </div>
  );
});