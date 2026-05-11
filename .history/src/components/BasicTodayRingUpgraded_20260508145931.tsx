import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Droplets,
  Sparkles,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number;
  weeklyTrend?: number[];
}

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);

      const eased =
        1 - Math.pow(1 - progress, 4);

      setCurrent(target * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return Math.round(current);
}

export default function BasicTodayRingUpgraded({
  waterIntake,
  waterGoal,
  streak,
  completionRate,
  yesterdayIntake = 0,
}: BasicTodayRingProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCelebration, setShowCelebration] =
    useState(false);

  const prevCompletedRef = useRef(false);

  const progressRaw =
    waterGoal > 0
      ? (waterIntake / waterGoal) * 100
      : 0;

  const progress = Math.min(progressRaw, 100);

  const animatedPercent =
    useAnimatedCounter(progress);

  const animatedMl =
    useAnimatedCounter(waterIntake);

  const isCompleted = progress >= 100;

  const comparison =
    waterIntake - yesterdayIntake;

  const comparisonData = useMemo(() => {
    if (yesterdayIntake <= 0)
      return {
        icon: Minus,
        text: 'Không có dữ liệu hôm qua',
        color: 'text-slate-400',
      };

    if (comparison > 0)
      return {
        icon: TrendingUp,
        text: `+${comparison}ml so với hôm qua`,
        color: 'text-emerald-400',
      };

    if (comparison < 0)
      return {
        icon: TrendingDown,
        text: `${comparison}ml so với hôm qua`,
        color: 'text-rose-400',
      };

    return {
      icon: Minus,
      text: 'Bằng hôm qua',
      color: 'text-slate-400',
    };
  }, [comparison, yesterdayIntake]);

  useEffect(() => {
    if (
      isCompleted &&
      !prevCompletedRef.current
    ) {
      setShowCelebration(true);

      setTimeout(() => {
        setShowCelebration(false);
      }, 2200);
    }

    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  const size = 320;
  const stroke = 18;
  const radius = 118;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (progress / 100) * circumference;

  const glow =
    progress >= 100
      ? '0 0 50px rgba(34,211,238,0.45)'
      : `0 0 ${
          progress * 0.28
        }px rgba(34,211,238,0.35)`;

  const getStatus = () => {
    if (progress >= 100)
      return {
        title: 'Hydration Complete',
        sub: 'Cơ thể đang ở trạng thái tối ưu',
        color: 'text-emerald-400',
      };

    if (progress >= 75)
      return {
        title: 'Almost There',
        sub: 'Sắp hoàn thành mục tiêu hôm nay',
        color: 'text-cyan-400',
      };

    if (progress >= 40)
      return {
        title: 'Good Progress',
        sub: 'Tiếp tục duy trì nhịp uống nước',
        color: 'text-sky-400',
      };

    return {
      title: 'Hydration Needed',
      sub: 'Cơ thể bạn cần thêm nước',
      color: 'text-slate-400',
    };
  };

  const status = getStatus();

  const ComparisonIcon =
    comparisonData.icon;

  return (
    <div className="px-6">
      <div
        className="
          relative overflow-hidden
          rounded-[2.5rem]
          border border-white/[0.08]
          bg-slate-900/65
          backdrop-blur-2xl
          shadow-[0_25px_80px_rgba(0,0,0,0.45)]
          p-5
        "
      >
        {/* ambient bg */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_45%)]
            pointer-events-none
          "
        />

        <div
          className="
            absolute -top-20 right-[-80px]
            w-[220px] h-[220px]
            rounded-full
            bg-cyan-400/10
            blur-3xl
            pointer-events-none
          "
        />

        {/* HEADER */}
        <div className="relative z-10 flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="
                  px-2.5 py-1
                  rounded-full
                  bg-cyan-400/10
                  border border-cyan-400/20
                  flex items-center gap-1.5
                "
              >
                <Activity
                  size={11}
                  className="text-cyan-400"
                />

                <span
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.22em]
                    font-black
                    text-cyan-300
                  "
                >
                  hydration system
                </span>
              </div>

              {isCompleted && (
                <motion.div
                  initial={{
                    scale: 0,
                    rotate: -40,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                  }}
                >
                  <Sparkles
                    size={16}
                    className="text-emerald-400"
                  />
                </motion.div>
              )}
            </div>

            <h2
              className={`
                text-xl font-black tracking-tight
                ${status.color}
              `}
            >
              {status.title}
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {status.sub}
            </p>
          </div>

          {/* streak pill */}
          <button
            onClick={() =>
              setExpanded(!expanded)
            }
            className="
              shrink-0
              rounded-3xl
              border border-orange-400/15
              bg-orange-500/[0.06]
              px-4 py-2.5
              transition-all duration-300
              hover:scale-[1.03]
            "
          >
            <div className="flex items-center gap-2">
              <div
                className="
                  w-9 h-9 rounded-2xl
                  bg-orange-500/10
                  border border-orange-400/15
                  flex items-center justify-center
                "
              >
                <Flame
                  size={18}
                  className="text-orange-400"
                />
              </div>

              <div className="text-left">
                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.2em]
                    text-slate-500
                    font-black
                  "
                >
                  streak
                </p>

                <p className="text-white font-black text-lg leading-none">
                  {streak}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* MAIN RING */}
        <div className="relative flex justify-center">
          <div
            className="relative"
            style={{
              width: size,
              height: size,
            }}
          >
            {/* celebration glow */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1.15,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.3,
                  }}
                  transition={{
                    duration: 1.4,
                  }}
                  className="
                    absolute inset-0
                    rounded-full
                    bg-cyan-400/10
                    blur-3xl
                  "
                />
              )}
            </AnimatePresence>

            <svg
              width={size}
              height={size}
              className="-rotate-90"
            >
              <defs>
                <linearGradient
                  id="ringGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#22d3ee"
                  />
                  <stop
                    offset="50%"
                    stopColor="#818cf8"
                  />
                  <stop
                    offset="100%"
                    stopColor="#a855f7"
                  />
                </linearGradient>

                <linearGradient
                  id="trackGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgba(255,255,255,0.06)"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgba(255,255,255,0.02)"
                  />
                </linearGradient>
              </defs>

              {/* track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#trackGradient)"
                strokeWidth={stroke}
              />

              {/* active ring */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{
                  strokeDashoffset:
                    circumference,
                }}
                animate={{
                  strokeDashoffset: offset,
                }}
                transition={{
                  duration: 1.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  filter: glow,
                }}
              />
            </svg>

            {/* center */}
            <div
              className="
                absolute inset-0
                flex flex-col items-center justify-center
              "
            >
              <div
                className="
                  w-16 h-16 rounded-[1.4rem]
                  bg-cyan-400/10
                  border border-cyan-400/15
                  flex items-center justify-center
                  mb-4
                  shadow-[0_0_40px_rgba(34,211,238,0.15)]
                "
              >
                <Droplets
                  size={28}
                  className="text-cyan-300"
                />
              </div>

              <div className="flex items-end gap-1">
                <span
                  className="
                    text-[72px]
                    leading-none
                    font-black
                    tracking-tight
                    text-white
                  "
                >
                  {animatedMl.toLocaleString(
                    'vi-VN'
                  )}
                </span>

                <span
                  className="
                    text-2xl
                    font-black
                    text-slate-400
                    mb-2
                  "
                >
                  ml
                </span>
              </div>

              <div
                className="
                  mt-2
                  px-4 py-2
                  rounded-full
                  bg-white/[0.04]
                  border border-white/[0.06]
                "
              >
                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-[0.18em]
                    font-black
                    text-slate-300
                  "
                >
                  {animatedPercent}% completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-3">
          {/* GOAL */}
          <div
            className="
              rounded-3xl
              border border-white/[0.06]
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                w-11 h-11 rounded-2xl
                bg-cyan-500/10
                border border-cyan-400/15
                flex items-center justify-center
                mb-3
              "
            >
              <Target
                size={20}
                className="text-cyan-400"
              />
            </div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.18em]
                text-slate-500
                font-black
              "
            >
              Goal
            </p>

            <p className="text-white font-black text-xl mt-1">
              {waterGoal}
            </p>

            <p className="text-slate-500 text-xs mt-1">
              ml today
            </p>
          </div>

          {/* CONSISTENCY */}
          <div
            className="
              rounded-3xl
              border border-white/[0.06]
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                w-11 h-11 rounded-2xl
                bg-emerald-500/10
                border border-emerald-400/15
                flex items-center justify-center
                mb-3
              "
            >
              <Trophy
                size={20}
                className="text-emerald-400"
              />
            </div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.18em]
                text-slate-500
                font-black
              "
            >
              Weekly
            </p>

            <p className="text-white font-black text-xl mt-1">
              {completionRate}%
            </p>

            <p className="text-slate-500 text-xs mt-1">
              consistency
            </p>
          </div>

          {/* COMPARISON */}
          <div
            className="
              rounded-3xl
              border border-white/[0.06]
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                w-11 h-11 rounded-2xl
                bg-violet-500/10
                border border-violet-400/15
                flex items-center justify-center
                mb-3
              "
            >
              <ComparisonIcon
                size={20}
                className={comparisonData.color}
              />
            </div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.18em]
                text-slate-500
                font-black
              "
            >
              Compare
            </p>

            <p
              className={`
                font-black text-lg mt-1
                ${comparisonData.color}
              `}
            >
              {comparison > 0
                ? `+${comparison}`
                : comparison}
            </p>

            <p className="text-slate-500 text-xs mt-1">
              vs yesterday
            </p>
          </div>
        </div>

        {/* EXPANDED PANEL */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                marginTop: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
                marginTop: 18,
              }}
              exit={{
                opacity: 0,
                height: 0,
                marginTop: 0,
              }}
              transition={{
                duration: 0.35,
              }}
              className="overflow-hidden"
            >
              <div
                className="
                  rounded-[2rem]
                  border border-white/[0.06]
                  bg-slate-950/40
                  p-4
                "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="
                        text-[10px]
                        uppercase
                        tracking-[0.18em]
                        text-slate-500
                        font-black
                      "
                    >
                      hydration insight
                    </p>

                    <h4 className="text-white font-black text-lg mt-1">
                      Daily Performance
                    </h4>
                  </div>

                  <div
                    className="
                      px-3 py-1.5 rounded-full
                      bg-cyan-500/10
                      border border-cyan-400/15
                    "
                  >
                    <span className="text-cyan-300 text-xs font-black">
                      AI TRACKING
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div
                    className="
                      rounded-2xl
                      bg-white/[0.03]
                      border border-white/[0.05]
                      p-4
                    "
                  >
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-black">
                      Remaining
                    </p>

                    <p className="text-white text-2xl font-black mt-2">
                      {Math.max(
                        waterGoal -
                          waterIntake,
                        0
                      )}
                      <span className="text-slate-500 text-sm ml-1">
                        ml
                      </span>
                    </p>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-white/[0.03]
                      border border-white/[0.05]
                      p-4
                    "
                  >
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-black">
                      Status
                    </p>

                    <p
                      className={`
                        text-lg font-black mt-2
                        ${status.color}
                      `}
                    >
                      {isCompleted
                        ? 'Optimal'
                        : progress >= 70
                        ? 'Strong'
                        : 'Average'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}