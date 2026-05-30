import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Droplets, Sparkles, TrendingUp, TrendingDown, 
  Award, Clock, Flame
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  yesterdayIntake?: number;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

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

// Enhanced metric row (simplified - no expandable)
function MetricRow({
  icon: Icon,
  title,
  subtitle,
  value,
  secondaryInfo,
  accentClass,
  bgClass,
  borderClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  secondaryInfo?: React.ReactNode;
  accentClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/50 p-4 backdrop-blur-xl">
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
      <div className="text-right">
        <span className="text-lg font-black text-white">{value}</span>
        {secondaryInfo && (
          <span className="text-[10px] text-slate-400 mt-0.5 block">{secondaryInfo}</span>
        )}
      </div>
    </div>
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
            Liên tục
          </p>
          <p className="text-lg leading-none font-black text-orange-400">{streak}</p>
        </div>
      </div>
    </div>
  );
}

function getMilestone(percent: number, t: (key: string) => string) {
  if (percent >= 100) return { text: t('home.milestone_excellent'), color: 'text-emerald-400' };
  if (percent >= 75) return { text: t('home.milestone_almost'), color: 'text-cyan-400' };
  if (percent >= 50) return { text: t('home.milestone_good_progress'), color: 'text-sky-400' };
  if (percent >= 25) return { text: t('home.good_start_milestone'), color: 'text-blue-400' };
  return { text: t('home.milestone_start'), color: 'text-slate-400' };
}

export default function BasicTodayRingUltimate({
  waterIntake,
  waterGoal,
  streak,
  yesterdayIntake = 0,
}: BasicTodayRingProps) {
  const { t } = useTranslation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCompletedRef = useRef(false);

  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const isCompleted = dailyPercent >= 100;

  const animatedPercent = useAnimatedCounter(dailyPercent, 1000);
  const milestone = useMemo(() => getMilestone(dailyPercent, t), [dailyPercent, t]);
  
  // Comparison with yesterday
  const comparison = yesterdayIntake > 0 ? waterIntake - yesterdayIntake : 0;

  // Ring configuration - single volume ring
  const ring = useMemo(
    () => ({
      r: 90,
      strokeWidth: 16,
    }),
    []
  );

  const c = 2 * Math.PI * ring.r;
  const offset = c - (dailyPercent / 100) * c;

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

        {/* Single Volume Ring visualization */}
        <div className="relative z-10 flex justify-center mb-6">
          <div className="relative h-48 w-48">
            <svg 
              className="ring-glow h-full w-full -rotate-90" 
              viewBox="0 0 256 256" 
              aria-label={`Water intake progress: ${Math.round(dailyPercent)}%`}
              role="img"
            >
              <defs>
                <linearGradient id="volGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              <circle
                cx="128"
                cy="128"
                r={ring.r}
                fill="none"
                stroke="var(--dw-surface-2)"
                strokeWidth={ring.strokeWidth}
              />
              <circle
                cx="128"
                cy="128"
                r={ring.r}
                fill="none"
                stroke="url(#volGradient)"
                strokeWidth={ring.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={mounted ? offset : c}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />

              {/* Milestone markers */}
              {[25, 50, 75, 100].map((milestone) => {
                const angle = (milestone / 100) * 2 * Math.PI - Math.PI / 2;
                return (
                  <circle
                    key={milestone}
                    cx={128 + ring.r * Math.cos(angle)}
                    cy={128 + ring.r * Math.sin(angle)}
                    r="3"
                    fill={dailyPercent >= milestone ? "#22d3ee" : "rgba(255,255,255,0.08)"}
                    className="transition-all duration-300"
                  />
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
                {isCompleted ? t('common.completed') : t('common.today')}
              </p>
            </div>
          </div>
        </div>

        {/* Simple metric row */}
        <div className="relative z-10">
          <MetricRow
            icon={Droplets}
            title={t('home.fill_water')}
            subtitle={t('home.volume')}
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