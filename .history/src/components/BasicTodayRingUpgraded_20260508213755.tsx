import React, { useState, useEffect, useRef } from 'react';
import { Droplets, CheckCircle2, TrendingUp, TrendingDown, Sparkles, Target, Flame, ChevronDown, ChevronUp, Award, Zap, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number;
  weeklyTrend?: number[];
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
      
      // Elastic ease out
      const eased = progress === 1 ? 1 : 
        1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / 3);
      
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

// Enhanced confetti with physics
function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const colors = ['#06b6d4', '#10b981', '#f97316', '#3b82f6', '#ef4444', '#8b5cf6', '#fbbf24'];
  const shapes = ['circle', 'square', 'star'];
  const color = colors[index % colors.length];
  const shape = shapes[index % shapes.length];
  const x = (Math.random() - 0.5) * 400;
  const y = Math.random() * 500 + 300;
  const rotation = Math.random() * 1440 - 720;
  const scale = Math.random() * 0.8 + 0.4;
  
  return (
    <div
      className={`absolute opacity-0 ${shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded' : ''}`}
      style={{
        backgroundColor: color,
        width: `${scale * 10}px`,
        height: `${scale * 10}px`,
        animation: `confetti 2.5s ease-out ${delay}s forwards`,
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--rotation': `${rotation}deg`,
        clipPath: shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
      } as React.CSSProperties}
    />
  );
}

// Combo multiplier badge
function ComboMultiplier({ combo }: { combo: number }) {
  if (combo < 2) return null;
  
  return (
    <div className="absolute top-4 right-4 z-30 animate-in zoom-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-lg animate-pulse" />
        <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full px-4 py-2 border-2 border-white/30 shadow-xl">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-white animate-pulse" />
            <span className="text-white font-black text-sm">{combo}x COMBO!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Level badge
function LevelBadge({ level }: { level: number }) {
  return (
    <div className="absolute top-4 left-4 z-20 animate-in slide-in-from-left duration-500">
      <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-2xl px-3 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-300" />
          <div className="text-left">
            <p className="text-[8px] uppercase tracking-wider text-white/80 font-bold">Level</p>
            <p className="text-lg leading-none font-black text-white">{level}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Achievement unlock animation
function AchievementUnlock({ achievement, onClose }: { achievement: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 animate-in zoom-in duration-500">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm rounded-3xl" />
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-6 rounded-3xl shadow-2xl border-4 border-white/30 max-w-[80%] relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl animate-pulse" />
            <Award size={48} className="text-yellow-300 relative animate-bounce" />
          </div>
          <p className="text-white font-black text-xl text-center leading-tight">Thành tựu mới!</p>
          <p className="text-white/90 text-center font-bold text-sm">{achievement}</p>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-yellow-300 fill-yellow-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BasicTodayRing3Upgraded({
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
  const [hoveredRing, setHoveredRing] = useState<'volume' | 'consistency' | 'streak' | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementText, setAchievementText] = useState('');
  const prevCompletedRef = useRef({ volume: false, consistency: false, streak: false });
  
  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const streakPercent = Math.min(Math.max((streak / 7) * 100, 0), 100);
  
  const isVolumeComplete = dailyPercent >= 100;
  const isConsistencyComplete = weeklyPercent >= 80;
  const isStreakMilestone = streak >= 7;
  
  // Animated percentages
  const animatedDaily = useAnimatedCounter(dailyPercent);
  const animatedWeekly = useAnimatedCounter(weeklyPercent);
  const animatedStreak = useAnimatedCounter(streakPercent);
  
  // Comparison with yesterday
  const comparison = yesterdayIntake > 0 ? waterIntake - yesterdayIntake : 0;
  
  // 3 Rings Setup
  const rVol = 100;
  const rCons = 80;
  const rStreak = 60;
  const cVol = 2 * Math.PI * rVol;
  const cCons = 2 * Math.PI * rCons;
  const cStreak = 2 * Math.PI * rStreak;
  
  const displayDaily = hasAnimatedIn ? dailyPercent : 0;
  const displayWeekly = hasAnimatedIn ? weeklyPercent : 0;
  const displayStreak = hasAnimatedIn ? streakPercent : 0;
  
  const offVol = cVol - (displayDaily / 100) * cVol;
  const offCons = cCons - (displayWeekly / 100) * cCons;
  const offStreak = cStreak - (displayStreak / 100) * cStreak;
  
  // Dynamic glow based on hover
  const getGlowIntensity = (ring: 'volume' | 'consistency' | 'streak') => {
    if (hoveredRing === ring) return 1.5;
    if (hoveredRing && hoveredRing !== ring) return 0.3;
    return 1;
  };
  
  // Trigger celebration
  useEffect(() => {
    const allComplete = isVolumeComplete && isConsistencyComplete && isStreakMilestone;
    const completedCount = [isVolumeComplete, isConsistencyComplete, isStreakMilestone].filter(Boolean).length;
    
    const anyNewCompletion = 
      (isVolumeComplete && !prevCompletedRef.current.volume) ||
      (isConsistencyComplete && !prevCompletedRef.current.consistency) ||
      (isStreakMilestone && !prevCompletedRef.current.streak);
    
    if (anyNewCompletion) {
      setShowCelebration(true);
      setComboCount(completedCount);
      setTimeout(() => setShowCelebration(false), 3000);
      
      // Achievement unlock
      if (allComplete && !prevCompletedRef.current.volume) {
        setAchievementText('Triple Crown - Hoàn thành 3 vòng!');
        setShowAchievement(true);
      } else if (streak > 0 && streak % 7 === 0 && !prevCompletedRef.current.streak) {
        setAchievementText(`Bền bỉ - Chuỗi ${streak} ngày!`);
        setShowAchievement(true);
      }
    }
    
    prevCompletedRef.current = {
      volume: isVolumeComplete,
      consistency: isConsistencyComplete,
      streak: isStreakMilestone
    };
  }, [isVolumeComplete, isConsistencyComplete, isStreakMilestone]);
  
  // Animate in on mount
  useEffect(() => {
    setTimeout(() => setHasAnimatedIn(true), 100);
  }, []);
  
  // Overall achievement status
  const achievementCount = [isVolumeComplete, isConsistencyComplete, isStreakMilestone].filter(Boolean).length;
  const achievementTitle = achievementCount === 3 ? '🏆 Perfect Day!' : achievementCount === 2 ? '💪 Almost Perfect!' : achievementCount === 1 ? '🚀 Good Start!' : '💧 Let\'s Begin!';

  // Calculate level based on streak
  const level = Math.floor(streak / 7) + 1;

  return (
    <div className="px-6">
      <style>{`
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) rotate(var(--rotation)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
          50% { filter: drop-shadow(0 0 16px currentColor); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .ring-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ring-card-hover:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
        }
        
        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
        }
        
        .gradient-text-cyan {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-text-emerald {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-text-orange {
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="bg-slate-900/55 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-5 pb-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-emerald-500/5 to-orange-500/5 pointer-events-none" />
        
        {/* Achievement celebration */}
        {showCelebration && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-30">
              {[...Array(30)].map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.04} index={i} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500 px-6 py-3 rounded-full animate-in zoom-in duration-500 shimmer-bg" style={{ animation: 'shimmer 2s infinite, zoom-in 0.5s ease-out' }}>
                <p className="text-white font-black text-lg tracking-wide">🎉 {achievementText}</p>
              </div>
            </div>
          </>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black">
            Ultimate Progress System
              </p>
              {achievementCount === 3 && (
            <div className="flex items-center gap-1 animate-bounce">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-[9px] text-yellow-400 font-black">PERFECT</span>
                </div>
              )}
            </div>
        <p className="text-sm text-slate-300 mt-1 font-semibold">
          {achievementTitle} • {achievementCount}/3 vòng • Level {level}
            </p>
          </div>
          
          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full bg-slate-950/60 border border-white/10 p-2 hover:bg-slate-950/80 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105"
          >
            {isExpanded ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </button>
        </div>

        {/* 3 Rings visualization */}
        <motion.div 
          className="flex justify-center cursor-pointer -my-2 relative z-0"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="relative w-64 h-64">
            <svg 
              className="rotate-[-90deg]" 
              width="256" 
              height="256" 
              viewBox="0 0 256 256"
          style={{
            filter: `drop-shadow(0 0 ${achievementCount * 5}px rgba(6, 182, 212, 0.3))`
          }}
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
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowStrong">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Volume ring (Outer) */}
              <circle cx="128" cy="128" r={rVol} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle 
                cx="128" 
                cy="128" 
                r={rVol} 
                fill="none" 
                stroke="url(#volGradient)" 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeDasharray={cVol} 
                strokeDashoffset={offVol} 
                style={{ 
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: hoveredRing && hoveredRing !== 'volume' ? 0.3 : 1
                }} 
                filter={hoveredRing === 'volume' ? 'url(#glowStrong)' : 'url(#glow)'} 
              />
              
              {/* Consistency ring (Middle) */}
              <circle cx="128" cy="128" r={rCons} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle 
                cx="128" 
                cy="128" 
                r={rCons} 
                fill="none" 
                stroke="url(#consGradient)" 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeDasharray={cCons} 
                strokeDashoffset={offCons} 
                style={{ 
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: hoveredRing && hoveredRing !== 'consistency' ? 0.3 : 1
                }} 
                filter={hoveredRing === 'consistency' ? 'url(#glowStrong)' : 'url(#glow)'} 
              />
              
              {/* Streak ring (Inner) */}
              <circle cx="128" cy="128" r={rStreak} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle 
                cx="128" 
                cy="128" 
                r={rStreak} 
                fill="none" 
                stroke="url(#streakGradient)" 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeDasharray={cStreak} 
                strokeDashoffset={offStreak} 
                style={{ 
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: hoveredRing && hoveredRing !== 'streak' ? 0.3 : 1
                }} 
                filter={hoveredRing === 'streak' ? 'url(#glowStrong)' : 'url(#glow)'} 
              />
              
              {/* Milestone markers */}
              {[25, 50, 75, 100].map((milestone) => {
                const angle = (milestone / 100) * 2 * Math.PI - Math.PI / 2;
                return (
                  <g key={milestone}>
                    <circle
                      cx={128 + rVol * Math.cos(angle)}
                      cy={128 + rVol * Math.sin(angle)}
                      r="2.5"
                      fill={dailyPercent >= milestone ? "#06b6d4" : "rgba(255,255,255,0.1)"}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={128 + rCons * Math.cos(angle)}
                      cy={128 + rCons * Math.sin(angle)}
                      r="2.5"
                      fill={weeklyPercent >= milestone ? "#10b981" : "rgba(255,255,255,0.1)"}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={128 + rStreak * Math.cos(angle)}
                      cy={128 + rStreak * Math.sin(angle)}
                      r="2.5"
                      fill={streakPercent >= milestone ? "#f97316" : "rgba(255,255,255,0.1)"}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              {achievementCount === 3 ? (
            <Trophy size={40} className="text-yellow-400 mb-2 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }} />
              ) : (
            <Droplets size={36} className="text-cyan-400 mb-2" />
              )}
          <p className="text-6xl leading-none tracking-tighter font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 mb-1" style={{ textShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}>
                {animatedDaily}%
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isVolumeComplete ? 'Hoàn thành' : 'Hôm nay'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Legend cards */}
        <div className="mt-5 flex flex-col gap-2.5 relative z-10">
          {/* Volume card */}
          <div 
            className="ring-card-hover bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between relative overflow-hidden"
            onMouseEnter={() => setHoveredRing('volume')}
            onMouseLeave={() => setHoveredRing(null)}
          >
            {isVolumeComplete && (
              <div className="absolute inset-0 shimmer-bg opacity-20" style={{ animation: 'shimmer 3s infinite' }} />
            )}
            <MilestoneBadge text="Complete!" show={isVolumeComplete} />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 relative">
                {isVolumeComplete && (
                  <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-400" />
                )}
                <Droplets size={18} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Nạp nước</p>
                <p className="text-cyan-400/80 text-[10px] uppercase tracking-widest font-bold">Volume • {animatedDaily}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">
                {waterIntake.toLocaleString('vi-VN')}
                <span className="text-slate-500 text-xs ml-1">/ {waterGoal.toLocaleString('vi-VN')}ml</span>
              </p>
              {comparison !== 0 && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {comparison > 0 ? (
                    <>
                      <TrendingUp size={10} className="text-emerald-400" />
                      <span className="text-[9px] text-emerald-400">+{Math.abs(comparison)}ml</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={10} className="text-orange-400" />
                      <span className="text-[9px] text-orange-400">{comparison}ml</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Consistency card */}
          <div 
            className="ring-card-hover bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between relative overflow-hidden"
            onMouseEnter={() => setHoveredRing('consistency')}
            onMouseLeave={() => setHoveredRing(null)}
          >
            {isConsistencyComplete && (
              <div className="absolute inset-0 shimmer-bg opacity-20" style={{ animation: 'shimmer 3s infinite' }} />
            )}
            <MilestoneBadge text="Complete!" show={isConsistencyComplete} />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
                {isConsistencyComplete && (
                  <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-400" />
                )}
                <Target size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">Mục tiêu tuần</p>
                <p className="text-emerald-400/80 text-[10px] uppercase tracking-widest font-bold">Consistency • {animatedWeekly}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">
                {Math.round(weeklyPercent)}
                <span className="text-slate-500 text-xs ml-1">%</span>
              </p>
              {weeklyTrend.length > 0 && (
                <div className="flex items-center justify-end gap-0.5 mt-1">
                  {weeklyTrend.slice(-7).map((value, i) => {
                    const height = Math.max((value / 100) * 16, 2);
                    const isToday = i === weeklyTrend.length - 1;
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${isToday ? 'bg-emerald-400' : 'bg-emerald-400/40'}`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Streak card */}
          <div 
            className="ring-card-hover bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/5 flex items-center justify-between relative overflow-hidden"
            onMouseEnter={() => setHoveredRing('streak')}
            onMouseLeave={() => setHoveredRing(null)}
            style={isStreakMilestone ? { animation: 'float 3s ease-in-out infinite' } : {}}
          >
            {isStreakMilestone && (
              <div className="absolute inset-0 shimmer-bg opacity-20" style={{ animation: 'shimmer 3s infinite' }} />
            )}
            <MilestoneBadge text="7 Day!" show={isStreakMilestone} />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 relative">
                {isStreakMilestone && (
                  <div className="absolute inset-0 rounded-xl animate-ping bg-orange-400/20" />
                )}
                <Flame size={18} className={`text-orange-400 ${isStreakMilestone ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-white font-black text-sm">Độ kiên trì</p>
                <p className="text-orange-400/80 text-[10px] uppercase tracking-widest font-bold">
                  Streak • {animatedStreak}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">
                {streak}
                <span className="text-slate-500 text-xs ml-1">ngày</span>
              </p>
              {isStreakMilestone && (
                <p className="text-[9px] text-orange-400 mt-0.5">🔥 On fire!</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/40 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black">
                Chi tiết tiến độ
              </p>
              <div className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-[9px] text-cyan-400 font-bold">{achievementCount}/3 RINGS</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Hôm nay</p>
                <p className="text-white font-black">{waterIntake.toLocaleString('vi-VN')} ml</p>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Mục tiêu</p>
                <p className="text-white font-black">{waterGoal.toLocaleString('vi-VN')} ml</p>
              </div>
              {yesterdayIntake > 0 && (
                <div className="bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Hôm qua</p>
                  <p className="text-white font-black">{yesterdayIntake.toLocaleString('vi-VN')} ml</p>
                </div>
              )}
              <div className="bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">TB 7 ngày</p>
                <p className="text-white font-black">
                  {weeklyTrend.length > 0 
                    ? `${Math.round(weeklyTrend.reduce((a, b) => a + b, 0) / weeklyTrend.length)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400 leading-relaxed">
                {achievementCount === 3 && '🎉 Tất cả mục tiêu hoàn thành! Tiếp tục duy trì phong độ.'}
                {achievementCount === 2 && '💪 Gần hoàn thành rồi! Chỉ còn 1 mục tiêu nữa.'}
                {achievementCount === 1 && '🚀 Bắt đầu tốt! Hãy hoàn thành thêm 2 mục tiêu nữa.'}
                {achievementCount === 0 && '💧 Hãy bắt đầu uống nước và xây dựng thói quen tốt!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}