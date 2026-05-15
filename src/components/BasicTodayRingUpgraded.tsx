import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Droplets, Sparkles, Target, Flame, TrendingUp, TrendingDown, 
  Award, Zap, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number;
  weeklyTrend?: number[];
}

// Animated counter with proper easing
function useAnimatedCounter(target: number, duration = 1000) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startTime = performance.now();
    const from = current;
    const diff = target - from;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic per design system

      setCurrent(from + diff * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return Math.round(current);
}

// Confetti particle - design system compliant
function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const [styleData] = useState(() => {
    // Design system colors only - cyan, emerald, amber
    const colors = ['#22d3ee', '#34d399', '#fbbf24', '#38bdf8'];
    return {
      color: colors[index % colors.length],
      x: Math.random() * 200 - 100,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.7 + 0.5,
    };
  });

  return (
    <div
      className="absolute rounded-full opacity-0"
      style={
        {
          width: `${styleData.scale * 6}px`,
          height: `${styleData.scale * 6}px`,
          backgroundColor: styleData.color,
          animation: `confetti-fall 1.6s ease-out ${delay}s forwards`,
          '--x': `${styleData.x}px`,
          '--rotation': `${styleData.rotation}deg`,
        } as React.CSSProperties
      }
    />
  );
}

// Enhanced metric row with hover states
function MetricRow({
  icon: Icon,
  title,
  subtitle,
  value,
  secondaryInfo,
  accentClass,
  bgClass,
  borderClass,
  isExpandable = false,
  isExpanded = false,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  secondaryInfo?: React.ReactNode;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={isExpandable ? onToggle : undefined}
      disabled={!isExpandable}
      className={`w-full flex items-center justify-between rounded-2xl border ${borderClass} ${bgClass} p-4 backdrop-blur-xl transition-all duration-200 ease-out ${
        isExpandable ? 'hover:bg-slate-800/60 hover:border-cyan-500/30 active:scale-[0.98]' : ''
      }`}
      aria-label={`${title}: ${value}`}
      role={isExpandable ? 'button' : undefined}
      aria-expanded={isExpandable ? isExpanded : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${borderClass} ${bgClass}`}>
          <Icon size={18} className={accentClass} aria-hidden="true" />
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-white">{title}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${accentClass}/80`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <span className="text-lg font-black text-white">{value}</span>
          {secondaryInfo && (
            <span className="text-[10px] text-slate-400 mt-0.5 block">{secondaryInfo}</span>
          )}
        </div>
        {isExpandable && (
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>
    </button>
  );
}

// Streak badge with proper styling
function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;
  
  return (
    <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-right duration-300">
      <div 
        className="glass-card-strong px-3 py-2 flex items-center gap-2 border-orange-500/20"
        style={streak >= 7 ? { animation: 'float-soft 3s ease-in-out infinite' } : undefined}
        role="status"
        aria-label={`${streak} day streak`}
      >
        <Flame size={16} className="text-orange-400" aria-hidden="true" />
        <div className="text-left">
          <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-0.5">
            Streak
          </p>
          <p className="text-lg leading-none font-black text-orange-400">{streak}</p>
        </div>
      </div>
    </div>
  );
}

function getMilestone(percent: number) {
  if (percent >= 100) return { text: 'Hoàn thành xuất sắc!', color: 'text-emerald-400' };
  if (percent >= 75) return { text: 'Sắp đạt mục tiêu!', color: 'text-cyan-400' };
  if (percent >= 50) return { text: 'Đang tiến triển tốt', color: 'text-sky-400' };
  if (percent >= 25) return { text: 'Bắt đầu tốt', color: 'text-blue-400' };
  return { text: 'Hãy bắt đầu uống nước', color: 'text-slate-400' };
}

export default function BasicTodayRingUltimate({
  waterIntake,
  waterGoal,
  streak,
  completionRate,
  yesterdayIntake = 0,
  weeklyTrend = [],
}: BasicTodayRingProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const prevCompletedRef = useRef(false);

  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const streakPercent = Math.min(Math.max((streak / 30) * 100, 0), 100);
  const isCompleted = dailyPercent >= 100;

  const animatedPercent = useAnimatedCounter(dailyPercent, 1000);
  const milestone = useMemo(() => getMilestone(dailyPercent), [dailyPercent]);
  
  // Comparison with yesterday
  const comparison = yesterdayIntake > 0 ? waterIntake - yesterdayIntake : 0;

  // Ring configuration - design system compliant
  const ring = useMemo(
    () => ({
      outer: { r: 110, strokeWidth: 14 },
      middle: { r: 90, strokeWidth: 14 },
      inner: { r: 70, strokeWidth: 14 },
    }),
    []
  );

  const cOuter = 2 * Math.PI * ring.outer.r;
  const cMiddle = 2 * Math.PI * ring.middle.r;
  const cInner = 2 * Math.PI * ring.inner.r;

  const offOuter = cOuter - (dailyPercent / 100) * cOuter;
  const offMiddle = cMiddle - (weeklyPercent / 100) * cMiddle;
  const offInner = cInner - (streakPercent / 100) * cInner;

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      const t1 = window.setTimeout(() => setShowCelebration(true), 0);
      const t2 = window.setTimeout(() => setShowCelebration(false), 2000);
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  const glow = Math.min(dailyPercent / 100, 1);

  return (
    <div className="px-5">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), 200px) rotate(var(--rotation)) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes float-soft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .ring-glow {
          filter: drop-shadow(0 0 ${8 + glow * 12}px rgba(34, 211, 238, ${0.2 + glow * 0.4}));
        }

        .number-glow {
          text-shadow: 0 0 20px rgba(34, 211, 238, ${0.2 + glow * 0.4});
        }
      `}</style>

      <div className="glass-card p-5 pb-4 relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5" />

        {/* Streak badges */}
        <StreakBadge streak={streak} />

        {/* Celebration confetti */}
        {showCelebration && (
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden flex items-center justify-center">
            {Array.from({ length: 24 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.04} index={i} />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Tiến độ hôm nay
              </p>
              {isCompleted && (
                <Sparkles size={14} className="text-emerald-400" aria-hidden="true" />
              )}
            </div>
            <p className={`mt-1.5 text-sm font-medium ${milestone.color}`}>
              {milestone.text}
            </p>
          </div>
        </div>

        {/* 3 Rings visualization */}
        <div className="relative z-10 flex justify-center mb-6">
          <div className="relative h-64 w-64">
            <svg 
              className="ring-glow h-full w-full -rotate-90" 
              viewBox="0 0 256 256" 
              aria-label={`Water intake progress: ${Math.round(dailyPercent)}%`}
              role="img"
            >
              <defs>
                {/* Design system compliant gradients */}
                <linearGradient id="volGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
                  <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
                </linearGradient>
                <linearGradient id="consGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
                  <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
                </linearGradient>
                <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" /> {/* orange-400 */}
                  <stop offset="100%" stopColor="#f97316" /> {/* orange-500 */}
                </linearGradient>
              </defs>

              {/* Outer ring - Volume (Cyan) */}
              <circle
                cx="128"
                cy="128"
                r={ring.outer.r}
                fill="none"
                stroke="var(--dw-surface-2)"
                strokeWidth={ring.outer.strokeWidth}
              />
              <circle
                cx="128"
                cy="128"
                r={ring.outer.r}
                fill="none"
                stroke="url(#volGradient)"
                strokeWidth={ring.outer.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={cOuter}
                strokeDashoffset={mounted ? offOuter : cOuter}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />

              {/* Middle ring - Consistency (Emerald) */}
              <circle
                cx="128"
                cy="128"
                r={ring.middle.r}
                fill="none"
                stroke="var(--dw-surface-2)"
                strokeWidth={ring.middle.strokeWidth}
              />
              <circle
                cx="128"
                cy="128"
                r={ring.middle.r}
                fill="none"
                stroke="url(#consGradient)"
                strokeWidth={ring.middle.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={cMiddle}
                strokeDashoffset={mounted ? offMiddle : cMiddle}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />

              {/* Inner ring - Streak (Orange) */}
              <circle
                cx="128"
                cy="128"
                r={ring.inner.r}
                fill="none"
                stroke="var(--dw-surface-2)"
                strokeWidth={ring.inner.strokeWidth}
              />
              <circle
                cx="128"
                cy="128"
                r={ring.inner.r}
                fill="none"
                stroke="url(#streakGradient)"
                strokeWidth={ring.inner.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={cInner}
                strokeDashoffset={mounted ? offInner : cInner}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />

              {/* Milestone markers */}
              {[25, 50, 75, 100].map((milestone) => {
                const angle = (milestone / 100) * 2 * Math.PI - Math.PI / 2;
                return (
                  <g key={milestone}>
                    <circle
                      cx={128 + ring.outer.r * Math.cos(angle)}
                      cy={128 + ring.outer.r * Math.sin(angle)}
                      r="2.5"
                      fill={dailyPercent >= milestone ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={128 + ring.middle.r * Math.cos(angle)}
                      cy={128 + ring.middle.r * Math.sin(angle)}
                      r="2.5"
                      fill={weeklyPercent >= milestone ? "#34d399" : "rgba(255,255,255,0.08)"}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={128 + ring.inner.r * Math.cos(angle)}
                      cy={128 + ring.inner.r * Math.sin(angle)}
                      r="2.5"
                      fill={streakPercent >= milestone ? "#fb923c" : "rgba(255,255,255,0.08)"}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {isCompleted ? (
                <Award size={28} className="mb-1.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Droplets size={28} className="mb-1.5 text-cyan-400" aria-hidden="true" />
              )}
              <p className="text-[42px] font-black leading-none tracking-tight text-transparent bg-gradient-to-br from-cyan-400 to-cyan-500 bg-clip-text number-glow">
                {mounted ? animatedPercent : 0}%
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {isCompleted ? 'Hoàn thành' : 'Hôm nay'}
              </p>
            </div>

            {/* Rotating Lightning Bolt */}
            <div 
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
              style={{ animation: 'spin 12s linear infinite' }}
            >
              <div 
                className="w-5 h-5 rounded-full bg-slate-950 border border-amber-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.6)]" 
                style={{ transform: `translateY(-${ring.outer.r}px)` }}
              >
                <Zap size={10} className="text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Metric rows */}
        <div className="relative z-10 space-y-2.5">
          {/* Volume metric */}
          <MetricRow
            icon={Droplets}
            title="Nạp nước"
            subtitle="Volume"
            value={
              <>
                {waterIntake.toLocaleString('vi-VN')}
                <span className="ml-1 text-xs font-medium text-slate-500">
                  / {waterGoal.toLocaleString('vi-VN')}ml
                </span>
              </>
            }
            secondaryInfo={
              comparison !== 0 ? (
                <div className="flex items-center gap-1">
                  {comparison > 0 ? (
                    <>
                      <TrendingUp size={10} className="text-emerald-400" />
                      <span className="text-emerald-400">+{comparison}ml</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={10} className="text-orange-400" />
                      <span className="text-orange-400">{comparison}ml</span>
                    </>
                  )}
                </div>
              ) : undefined
            }
            accentClass="text-cyan-400"
            bgClass="bg-cyan-500/10"
            borderClass="border-cyan-500/20"
            isExpandable={weeklyTrend.length > 0}
            isExpanded={expandedMetric === 'volume'}
            onToggle={() => setExpandedMetric(expandedMetric === 'volume' ? null : 'volume')}
          />

          {/* Expanded volume details */}
          {expandedMetric === 'volume' && weeklyTrend.length > 0 && (
            <div className="glass-card p-4 space-y-3 animate-in fade-in slide-in-from-top duration-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Xu hướng 7 ngày
              </p>
              <div className="flex items-end justify-center gap-1 h-16">
                {weeklyTrend.slice(-7).map((value, i) => {
                  const max = Math.max(...weeklyTrend);
                  const min = Math.min(...weeklyTrend);
                  const range = max - min || 1;
                  const height = ((value - min) / range) * 64;
                  const isToday = i === weeklyTrend.length - 1;
                  return (
                    <div
                      key={i}
                      className={`w-6 rounded-t-lg transition-all duration-300 ${
                        isToday ? 'bg-cyan-400' : 'bg-cyan-400/40'
                      }`}
                      style={{ height: `${Math.max(height, 8)}px` }}
                      role="presentation"
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Trung bình</span>
                <span className="font-bold text-white">
                  {Math.round(weeklyTrend.reduce((a, b) => a + b, 0) / weeklyTrend.length)}%
                </span>
              </div>
            </div>
          )}

          {/* Consistency metric */}
          <MetricRow
            icon={Target}
            title="Mục tiêu tuần"
            subtitle="Consistency"
            value={
              <>
                {Math.round(weeklyPercent)}
                <span className="ml-1 text-xs font-medium text-slate-500">%</span>
              </>
            }
            accentClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
            borderClass="border-emerald-500/20"
          />

          {/* Streak metric */}
          <MetricRow
            icon={Flame}
            title="Độ kiên trì"
            subtitle="Streak"
            value={
              <>
                {streak}
                <span className="ml-1 text-xs font-medium text-slate-500">ngày</span>
              </>
            }
            secondaryInfo={
              streak >= 7 ? <span className="text-orange-400">🔥 On fire</span> : undefined
            }
            accentClass="text-orange-400"
            bgClass="bg-orange-500/10"
            borderClass="border-orange-500/20"
          />
        </div>

        {/* Quick stats footer */}
        {yesterdayIntake > 0 && (
          <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} aria-hidden="true" />
                <span>Hôm qua</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {yesterdayIntake.toLocaleString('vi-VN')}ml
                </span>
                {comparison !== 0 && (
                  <span className={`text-xs font-bold ${comparison > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    ({comparison > 0 ? '+' : ''}{comparison}ml)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}