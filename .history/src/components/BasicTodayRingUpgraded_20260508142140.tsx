import React, { useState, useEffect, useRef } from 'react';
import { Droplets, CheckCircle2, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number; // For comparison
  weeklyTrend?: number[]; // Last 7 days percentages
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 800) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const start = current;
    const diff = target - start;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + diff * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target]);
  
  return Math.round(current);
}

// Confetti particle component
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['#38bdf8', '#2dd4bf', '#818cf8', '#34d399'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 200 - 100;
  const rotation = Math.random() * 720 - 360;
  
  return (
    <div
      className="absolute w-2 h-2 rounded-full opacity-0"
      style={{
        backgroundColor: color,
        animation: `confetti 1.5s ease-out ${delay}s forwards`,
        '--x': `${x}px`,
        '--rotation': `${rotation}deg`,
      } as React.CSSProperties}
    />
  );
}

export default function BasicTodayRingUpgraded({
  waterIntake,
  waterGoal,
  streak,
  completionRate,
  yesterdayIntake = 0,
  weeklyTrend = []
}: BasicTodayRingProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const prevCompletedRef = useRef(false);
  
  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const isCompleted = dailyPercent >= 100;
  
  // Animated percentage
  const animatedPercent = useAnimatedCounter(dailyPercent);
  
  // Comparison with yesterday
  const comparison = yesterdayIntake > 0 ? waterIntake - yesterdayIntake : 0;
  
  // SVG calculations
  const outerRadius = 96;
  const innerRadius = 76;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  
  // Animate from 0 on mount
  const displayDaily = hasAnimatedIn ? dailyPercent : 0;
  const displayWeekly = hasAnimatedIn ? weeklyPercent : 0;
  
  const outerOffset = outerCircumference - (displayWeekly / 100) * outerCircumference;
  const innerOffset = innerCircumference - (displayDaily / 100) * innerCircumference;
  
  // Add glow intensity based on progress
  const glowIntensity = Math.min(dailyPercent / 100, 1);
  
  // Trigger celebration on completion
  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);
  
  // Animate in on mount
  useEffect(() => {
    setTimeout(() => setHasAnimatedIn(true), 100);
  }, []);
  
  // Milestone detection
  const getMilestone = (percent: number) => {
    if (percent >= 100) return { text: 'Hoàn thành xuất sắc!', color: 'text-emerald-400' };
    if (percent >= 75) return { text: 'Sắp đạt mục tiêu!', color: 'text-cyan-400' };
    if (percent >= 50) return { text: 'Đang tiến triển tốt', color: 'text-sky-400' };
    if (percent >= 25) return { text: 'Bắt đầu tốt', color: 'text-blue-400' };
    return { text: 'Hãy bắt đầu uống nước', color: 'text-slate-400' };
  };
  
  const milestone = getMilestone(dailyPercent);

  return (
    <div className="px-6">
      <style>{`
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), 200px) rotate(var(--rotation));
            opacity: 0;
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.6));
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .stat-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stat-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(56, 189, 248, 0.15);
        }
        
        .ring-glow {
          filter: drop-shadow(0 0 ${glowIntensity * 12}px rgba(56, 189, 248, ${glowIntensity * 0.5}));
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .number-glow {
          text-shadow: 0 0 20px rgba(56, 189, 248, ${glowIntensity * 0.4});
        }
      `}</style>
      
      <div className="bg-slate-900/55 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6 relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Celebration confetti */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.05} />
            ))}
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black">
                Tiến độ hôm nay
              </p>
              {isCompleted && (
                <Sparkles size={12} className="text-emerald-400 animate-pulse" />
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {milestone.text}
            </p>
          </div>
          
          {/* Streak badge with hover animation */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-3xl bg-slate-950/60 border border-white/10 px-4 py-2 text-right hover:bg-slate-950/80 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105"
            style={streak >= 7 ? { animation: 'float 3s ease-in-out infinite' } : {}}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">STREAK</p>
            <p className="text-white font-black text-lg gradient-text">
              {streak} ngày
            </p>
            {streak >= 7 && (
              <div className="text-[8px] text-emerald-400 mt-0.5">🔥 Đang on fire!</div>
            )}
          </button>
        </div>

        {/* Ring visualization */}
        <div 
          className="flex justify-center py-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative w-56 h-56">
            <svg 
              className="rotate-[-90deg] ring-glow" 
              width="224" 
              height="224" 
              viewBox="0 0 224 224"
            >
              <defs>
                <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Outer ring (weekly) */}
              <circle
                cx="112"
                cy="112"
                r={outerRadius}
                fill="none"
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="14"
              />
              <circle
                cx="112"
                cy="112"
                r={outerRadius}
                fill="none"
                stroke="url(#weeklyGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={outerCircumference}
                strokeDashoffset={outerOffset}
                style={{ 
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                filter="url(#glow)"
              />
              
              {/* Inner ring (daily) */}
              <circle
                cx="112"
                cy="112"
                r={innerRadius}
                fill="none"
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="12"
              />
              <circle
                cx="112"
                cy="112"
                r={innerRadius}
                fill="none"
                stroke="url(#dailyGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={innerCircumference}
                strokeDashoffset={innerOffset}
                style={{ 
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                filter="url(#glow)"
              />
              
              {/* Milestone markers */}
              {[25, 50, 75, 100].map((milestone) => {
                const angle = (milestone / 100) * 2 * Math.PI;
                const x = 112 + innerRadius * Math.cos(angle - Math.PI / 2);
                const y = 112 + innerRadius * Math.sin(angle - Math.PI / 2);
                return (
                  <circle
                    key={milestone}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={dailyPercent >= milestone ? "#38bdf8" : "rgba(148,163,184,0.2)"}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              {isCompleted ? (
                <>
                  <CheckCircle2 size={36} className="text-emerald-400 mb-2 animate-pulse" />
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-400 font-black mb-1">
                    Hoàn thành
                  </p>
                </>
              ) : (
                <Droplets size={32} className="text-cyan-400 mb-1" />
              )}
              <p className="text-5xl font-black text-white number-glow gradient-text">
                {animatedPercent}%
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {isCompleted 
                  ? `${waterIntake.toLocaleString('vi-VN')} ml` 
                  : `${Math.max(waterGoal - waterIntake, 0).toLocaleString('vi-VN')} ml còn lại`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid with hover effects */}
        <div className="grid gap-3 sm:grid-cols-2 mt-2 relative z-10">
          {/* Current goal card */}
          <div className="stat-card-hover rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-900/30 backdrop-blur-md border border-white/8 p-3 flex flex-col justify-center items-center text-center shadow-lg">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
              Mục tiêu hiện tại
            </p>
            <p className="text-lg font-black text-white">
              {isCompleted ? (
                <span className="text-emerald-400">✓ Hoàn thành</span>
              ) : (
                <>
                  {Math.max(waterGoal - waterIntake, 0).toLocaleString('vi-VN')}
                  <span className="text-[10px] text-slate-500 font-medium ml-1">ml</span>
                </>
              )}
            </p>
            
            {/* Comparison with yesterday */}
            {comparison !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {comparison > 0 ? (
                  <>
                    <TrendingUp size={10} className="text-emerald-400" />
                    <span className="text-[9px] text-emerald-400">
                      +{Math.abs(comparison).toLocaleString('vi-VN')} ml so với hôm qua
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={10} className="text-orange-400" />
                    <span className="text-[9px] text-orange-400">
                      {comparison.toLocaleString('vi-VN')} ml so với hôm qua
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Weekly performance card */}
          <div className="stat-card-hover rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-900/30 backdrop-blur-md border border-white/8 p-3 flex flex-col justify-center items-center text-center shadow-lg">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
              Hiệu suất tuần
            </p>
            <p className="text-lg font-black text-white">
              {Math.round(weeklyPercent)}
              <span className="text-[10px] text-slate-500 font-medium ml-0.5">%</span>
            </p>
            
            {/* Mini sparkline trend */}
            {weeklyTrend.length > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {weeklyTrend.slice(-7).map((value, i) => {
                  const height = Math.max((value / 100) * 16, 2);
                  return (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400/40 rounded-full"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/40 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black mb-3">
              Chi tiết tiến độ
            </p>
            
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Đã uống hôm nay:</span>
                <span className="font-bold">{waterIntake.toLocaleString('vi-VN')} ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mục tiêu:</span>
                <span className="font-bold">{waterGoal.toLocaleString('vi-VN')} ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trung bình 7 ngày:</span>
                <span className="font-bold">
                  {weeklyTrend.length > 0 
                    ? `${Math.round(weeklyTrend.reduce((a, b) => a + b, 0) / weeklyTrend.length)}%`
                    : 'N/A'}
                </span>
              </div>
              {yesterdayIntake > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Hôm qua:</span>
                  <span className="font-bold">{yesterdayIntake.toLocaleString('vi-VN')} ml</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}