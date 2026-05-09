import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, Sparkles, Target, Flame } from 'lucide-react';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number;
  weeklyTrend?: number[];
}

function useAnimatedCounter(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startTime = performance.now();
    const from = current;
    const diff = target - from;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic

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

function ConfettiParticle({ delay }: { delay: number }) {
  const [styleData] = useState(() => {
    const colors = ['#38bdf8', '#2dd4bf', '#818cf8', '#34d399'];
    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 200 - 100,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.8 + 0.6,
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
          animation: `confetti-fall 1.4s ease-out ${delay}s forwards`,
          '--x': `${styleData.x}px`,
          '--rotation': `${styleData.rotation}deg`,
        } as React.CSSProperties
      }
    />
  );
}

function MetricRow({
  icon: Icon,
  title,
  subtitle,
  value,
  accentClass,
  bgClass,
  borderClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  accentClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border ${borderClass} ${bgClass} p-3 backdrop-blur-xl transition-colors hover:bg-slate-800/60`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${borderClass} ${bgClass}`}>
          <Icon size={18} className={accentClass} />
        </div>
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${accentClass}/80`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-white">{value}</p>
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

export default function BasicTodayRingUpgraded({
  waterIntake,
  waterGoal,
  streak,
  completionRate,
}: BasicTodayRingProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCompletedRef = useRef(false);

  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const isCompleted = dailyPercent >= 100;

  const animatedPercent = useAnimatedCounter(dailyPercent);
  const milestone = useMemo(() => getMilestone(dailyPercent), [dailyPercent]);

  const streakPercent = Math.min(Math.max((streak / 7) * 100, 0), 100);

  const ring = useMemo(
    () => ({
      outer: { r: 96, strokeWidth: 14 },
      middle: { r: 76, strokeWidth: 14 },
      inner: { r: 56, strokeWidth: 14 },
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
      setShowCelebration(true);
      const t = window.setTimeout(() => setShowCelebration(false), 1800);
      return () => window.clearTimeout(t);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  const glow = Math.min(dailyPercent / 100, 1);

  return (
    <div className="px-4 sm:px-6">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), 180px) rotate(var(--rotation)) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes float-soft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .ring-glow {
          filter: drop-shadow(0 0 ${8 + glow * 10}px rgba(56, 189, 248, ${0.2 + glow * 0.35}));
        }

        .number-glow {
          text-shadow: 0 0 18px rgba(56, 189, 248, ${0.18 + glow * 0.35});
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/55 p-5 pb-4 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />

        {showCelebration && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.05} />
            ))}
          </div>
        )}

        <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Tiến độ hôm nay
              </p>
              {isCompleted && <Sparkles size={12} className="animate-pulse text-emerald-400" />}
            </div>
            <p className={`mt-1 text-sm ${milestone.color}`}>{milestone.text}</p>
          </div>

          <div
            className="rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-2 text-right transition-transform duration-300 hover:scale-[1.03] hover:border-cyan-400/30 hover:bg-slate-950/80"
            style={streak >= 7 ? { animation: 'float-soft 3s ease-in-out infinite' } : undefined}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Streak</p>
            <p className="mt-0.5 text-lg font-black text-transparent bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text">
              {streak} ngày
            </p>
            {streak >= 7 && <div className="mt-0.5 text-[8px] text-emerald-400">🔥 On fire</div>}
          </div>
        </div>

        <div className="relative z-10 flex justify-center">
          <div className="relative h-64 w-64">
            <svg className="ring-glow h-full w-full -rotate-90" viewBox="0 0 256 256" aria-hidden="true">
              <defs>
                <linearGradient id="volGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="consGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              <circle
                cx="128"
                cy="128"
                r={ring.outer.r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
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
                strokeDashoffset={offOuter}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />

              <circle
                cx="128"
                cy="128"
                r={ring.middle.r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
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
                strokeDashoffset={offMiddle}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />

              <circle
                cx="128"
                cy="128"
                r={ring.inner.r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
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
                strokeDashoffset={offInner}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Droplets size={30} className="mb-1 text-cyan-400" />
              <p
                className="text-5xl font-black leading-none text-transparent bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text number-glow"
              >
                {mounted ? animatedPercent : 0}%
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {isCompleted ? 'Hoàn thành' : 'Hôm nay'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-2.5">
          <MetricRow
            icon={Droplets}
            title="Nạp nước"
            subtitle="Volume"
            value={
              <>
                {waterIntake.toLocaleString('vi-VN')}
                <span className="ml-1 text-xs font-semibold text-slate-500">
                  / {waterGoal.toLocaleString('vi-VN')}ml
                </span>
              </>
            }
            accentClass="text-cyan-400"
            bgClass="bg-cyan-500/10"
            borderClass="border-cyan-500/20"
          />

          <MetricRow
            icon={Target}
            title="Mục tiêu tuần"
            subtitle="Consistency"
            value={
              <>
                {Math.round(weeklyPercent)}
                <span className="ml-1 text-xs font-semibold text-slate-500">%</span>
              </>
            }
            accentClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
            borderClass="border-emerald-500/20"
          />

          <MetricRow
            icon={Flame}
            title="Độ kiên trì"
            subtitle="Streak"
            value={
              <>
                {streak}
                <span className="ml-1 text-xs font-semibold text-slate-500">ngày</span>
              </>
            }
            accentClass="text-orange-400"
            bgClass="bg-orange-500/10"
            borderClass="border-orange-500/20"
          />
        </div>
      </div>
    </div>
  );
}