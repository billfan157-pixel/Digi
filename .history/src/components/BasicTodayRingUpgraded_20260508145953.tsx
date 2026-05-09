import React, { useState, useEffect, useRef } from 'react';
import { Droplets, CheckCircle2, TrendingUp, TrendingDown, Minus, Sparkles, Target, Flame } from 'lucide-react';

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
  
  // Apple Fitness 3 Rings Setup
  const rVol = 100;
  const rCons = 80;
  const rStreak = 60;
  const cVol = 2 * Math.PI * rVol;
  const cCons = 2 * Math.PI * rCons;
  const cStreak = 2 * Math.PI * rStreak;
  
  const streakPercent = Math.min(Math.max((streak / 7) * 100, 0), 100);
  
  // Animate from 0 on mount
  const displayDaily = hasAnimatedIn ? dailyPercent : 0;
  const displayWeekly = hasAnimatedIn ? weeklyPercent : 0;
  const displayStreak = hasAnimatedIn ? streakPercent : 0;
  
  const offVol = cVol - (displayDaily / 100) * cVol;
  const offCons = cCons - (displayWeekly / 100) * cCons;
  const offStreak = cStreak - (displayStreak / 100) * cStreak;
  
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
      
      <div className="bg-slate-900/55 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-5 pb-4 relative overflow-hidden">
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
        <div className="flex items-center justify-between mb-1 relative z-10">
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
          className="flex justify-center cursor-pointer -my-2 relative z-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative w-64 h-64">
            <svg 
              className="rotate-[-90deg] ring-glow" 
              width="256" 
              height="256" 
              viewBox="0 0 256 256"
            >
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
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Volume ring (Outer) */}
              <circle cx="128" cy="128" r={rVol} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle cx="128" cy="128" r={rVol} fill="none" stroke="url(#volGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={cVol} strokeDashoffset={offVol} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} filter="url(#glow)" />
              
              {/* Consistency ring (Middle) */}
              <circle cx="128" cy="128" r={rCons} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle cx="128" cy="128" r={rCons} fill="none" stroke="url(#consGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={cCons} strokeDashoffset={offCons} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} filter="url(#glow)" />
              
              {/* Streak ring (Inner) */}
              <circle cx="128" cy="128" r={rStreak} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle cx="128" cy="128" r={rStreak} fill="none" stroke="url(#streakGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={cStreak} strokeDashoffset={offStreak} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} filter="url(#glow)" />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <Droplets size={32} className="text-cyan-400 mb-1" />
              <p className="text-5xl leading-none tracking-tight font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 number-glow mb-0.5">
                {animatedPercent}%
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isCompleted ? 'Hoàn thành' : 'Hôm nay'}
              </p>
            </div>
          </div>
        </div>

        {/* Apple Fitness Style Legend */}
        <div className="mt-5 flex flex-col gap-2.5 relative z-10">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Droplets size={18} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Nạp nước</p>
                <p className="text-cyan-400/80 text-[10px] uppercase tracking-widest font-bold">Volume</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">{waterIntake.toLocaleString('vi-VN')}<span className="text-slate-500 text-xs ml-1">/ {waterGoal.toLocaleString('vi-VN')}ml</span></p>
            </div>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Target size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Mục tiêu tuần</p>
                <p className="text-emerald-400/80 text-[10px] uppercase tracking-widest font-bold">Consistency</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">{Math.round(weeklyPercent)}<span className="text-slate-500 text-xs ml-1">%</span></p>
            </div>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Flame size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Độ kiên trì</p>
                <p className="text-orange-400/80 text-[10px] uppercase tracking-widest font-bold">Streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">{streak}<span className="text-slate-500 text-xs ml-1">ngày</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}