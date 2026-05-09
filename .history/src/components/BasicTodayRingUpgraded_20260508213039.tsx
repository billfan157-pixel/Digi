import React, { useState, useEffect, useRef } from 'react';
import { Droplets, CheckCircle2, TrendingUp, TrendingDown, Sparkles, Target, Flame, ChevronDown, ChevronUp, Award, Zap, Trophy, Star, TrendingUp as TrendUp } from 'lucide-react';

// Animated counter với bounce effect
function useAnimatedCounter(target: number, duration: number = 1000) {
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

// Enhanced confetti với physics
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

// Particle trail effect
function ParticleTrail({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: 'particle-fade 0.8s ease-out forwards',
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

// Combo multiplier badge
function ComboMultiplier({ combo }: { combo: number }) {
  if (combo < 3) return null;
  
  return (
    <div className="absolute top-4 right-4 z-30 animate-in zoom-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-lg animate-pulse" />
        <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full px-4 py-2 border-2 border-white/30">
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
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-6 rounded-3xl shadow-2xl border-4 border-white/30 max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl animate-pulse" />
            <Award size={48} className="text-yellow-300 relative animate-bounce" />
          </div>
          <p className="text-white font-black text-xl text-center">Achievement Unlocked!</p>
          <p className="text-white/90 text-center font-bold">{achievement}</p>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-yellow-300 fill-yellow-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Ultimate3Rings() {
  const [waterIntake, setWaterIntake] = useState(2100);
  const [waterGoal] = useState(2500);
  const [streak, setStreak] = useState(12);
  const [completionRate, setCompletionRate] = useState(88);
  const yesterdayIntake = 1900;
  const weeklyTrend = [65, 80, 90, 75, 85, 95, 88];
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [hoveredRing, setHoveredRing] = useState<'volume' | 'consistency' | 'streak' | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [comboCount, setComboCount] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementText, setAchievementText] = useState('');
  const prevCompletedRef = useRef({ volume: false, consistency: false, streak: false });
  
  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const streakPercent = Math.min(Math.max((streak / 30) * 100, 0), 100);
  
  const isVolumeComplete = dailyPercent >= 100;
  const isConsistencyComplete = weeklyPercent >= 80;
  const isStreakMilestone = streak >= 7;
  
  // Calculate level based on streak
  const level = Math.floor(streak / 7) + 1;
  
  // Animated percentages
  const animatedDaily = useAnimatedCounter(dailyPercent);
  const animatedWeekly = useAnimatedCounter(weeklyPercent);
  const animatedStreak = useAnimatedCounter(streakPercent);
  
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
  
  // Trigger celebration with combo system
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
        setAchievementText('Triple Crown - All rings complete!');
        setShowAchievement(true);
      } else if (streak >= 30 && !prevCompletedRef.current.streak) {
        setAchievementText('Marathon Master - 30 Day Streak!');
        setShowAchievement(true);
      }
    }
    
    prevCompletedRef.current = {
      volume: isVolumeComplete,
      consistency: isConsistencyComplete,
      streak: isStreakMilestone
    };
  }, [isVolumeComplete, isConsistencyComplete, isStreakMilestone, streak]);
  
  // Animate in
  useEffect(() => {
    setTimeout(() => setHasAnimatedIn(true), 100);
  }, []);
  
  // Cleanup particles
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - p.id < 800));
    }, 100);
    return () => clearInterval(timer);
  }, []);
  
  const achievementCount = [isVolumeComplete, isConsistencyComplete, isStreakMilestone].filter(Boolean).length;
  const achievementTitle = achievementCount === 3 ? '🏆 Perfect Day!' : achievementCount === 2 ? '💪 Almost Perfect!' : achievementCount === 1 ? '🚀 Good Start!' : '💧 Let\'s Begin!';

  // Add water function
  const addWater = (amount: number) => {
    setWaterIntake(prev => Math.min(prev + amount, waterGoal + 500));
    
    // Create particle trail
    const newParticles = [...Array(5)].map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 + 150,
      y: Math.random() * 100 + 150,
      color: '#06b6d4',
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
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
        
        @keyframes particle-fade {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0) translateY(-50px);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px currentColor); }
          50% { filter: drop-shadow(0 0 20px currentColor); }
        }
        
        .ring-card-hover {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .ring-card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 200% 100%;
        }
        
        .gradient-text-cyan {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="max-w-2xl mx-auto">
        {/* Achievement unlock overlay */}
        {showAchievement && (
          <AchievementUnlock 
            achievement={achievementText}
            onClose={() => setShowAchievement(false)}
          />
        )}
        
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
          {/* Combo multiplier */}
          {comboCount >= 2 && showCelebration && (
            <ComboMultiplier combo={comboCount} />
          )}
          
          {/* Level badge */}
          <LevelBadge level={level} />
          
          {/* Particles */}
          {particles.map(particle => (
            <ParticleTrail key={particle.id} {...particle} />
          ))}
          
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-emerald-500/8 to-orange-500/8 pointer-events-none animate-pulse" />
          
          {/* Celebration */}
          {showCelebration && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-30">
                {[...Array(40)].map((_, i) => (
                  <ConfettiParticle key={i} delay={i * 0.03} index={i} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
                <div className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500 px-8 py-4 rounded-full animate-in zoom-in duration-500 shimmer-bg shadow-2xl" style={{ animation: 'shimmer 2s infinite, zoom-in 0.5s ease-out' }}>
                  <p className="text-white font-black text-2xl tracking-wide">{achievementTitle}</p>
                </div>
              </div>
            </>
          )}
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2 relative z-10 pt-12">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-black">
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
                {achievementTitle} • {achievementCount}/3 rings • Level {level}
              </p>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-full bg-slate-950/70 border border-white/15 p-2.5 hover:bg-slate-950/90 hover:border-cyan-400/40 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {isExpanded ? (
                <ChevronUp size={22} className="text-slate-300" />
              ) : (
                <ChevronDown size={22} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* 3 Rings */}
          <div 
            className="flex justify-center cursor-pointer -my-2 relative z-0 transition-transform duration-300 hover:scale-105 active:scale-95"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="relative w-64 h-64">
              <svg 
                className="rotate-[-90deg] transition-all duration-500" 
                width="256" 
                height="256" 
                viewBox="0 0 256 256"
                style={{
                  filter: `drop-shadow(0 0 ${achievementCount * 5}px rgba(6, 182, 212, 0.3))`
                }}
              >
                <defs>
                  <linearGradient id="volGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="consGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <filter id="glowEffect">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <circle cx="128" cy="128" r={rVol} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                <circle cx="128" cy="128" r={rVol} fill="none" stroke="url(#volGrad)" strokeWidth="18" strokeLinecap="round" strokeDasharray={cVol} strokeDashoffset={offVol} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: hoveredRing && hoveredRing !== 'volume' ? 0.3 : 1 }} filter="url(#glowEffect)" />
                
                <circle cx="128" cy="128" r={rCons} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                <circle cx="128" cy="128" r={rCons} fill="none" stroke="url(#consGrad)" strokeWidth="18" strokeLinecap="round" strokeDasharray={cCons} strokeDashoffset={offCons} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: hoveredRing && hoveredRing !== 'consistency' ? 0.3 : 1 }} filter="url(#glowEffect)" />
                
                <circle cx="128" cy="128" r={rStreak} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                <circle cx="128" cy="128" r={rStreak} fill="none" stroke="url(#streakGrad)" strokeWidth="18" strokeLinecap="round" strokeDasharray={cStreak} strokeDashoffset={offStreak} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: hoveredRing && hoveredRing !== 'streak' ? 0.3 : 1 }} filter="url(#glowEffect)" />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                {achievementCount === 3 ? (
                  <Trophy size={40} className="text-yellow-400 mb-2 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }} />
                ) : (
                  <Droplets size={36} className="text-cyan-400 mb-2" />
                )}
                <p className="text-6xl leading-none tracking-tighter font-black gradient-text-cyan mb-1" style={{ textShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}>
                  {animatedDaily}%
                </p>
                <p className="mt-1 text-xs font-black text-slate-300 uppercase tracking-widest">
                  {isVolumeComplete ? '✓ Complete' : 'Today'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick add buttons */}
          <div className="flex justify-center gap-2 mb-4 relative z-10">
            {[250, 500, 750].map(amount => (
              <button
                key={amount}
                onClick={() => addWater(amount)}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-full text-cyan-300 font-bold text-sm transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-xl"
              >
                +{amount}ml
              </button>
            ))}
          </div>

          {/* Legend cards */}
          <div className="mt-4 flex flex-col gap-3 relative z-10">
            {/* Volume */}
            <div 
              className="ring-card-hover bg-slate-900/50 backdrop-blur-xl rounded-2xl p-3.5 border border-white/10 flex items-center justify-between relative overflow-hidden group"
              onMouseEnter={() => setHoveredRing('volume')}
              onMouseLeave={() => setHoveredRing(null)}
            >
              {isVolumeComplete && <div className="absolute inset-0 shimmer-bg opacity-20" style={{ animation: 'shimmer 3s infinite' }} />}
              {isVolumeComplete && (
                <div className="absolute -top-2 -right-2 z-20 animate-in zoom-in">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
                    <Award size={16} className="text-white" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center border-2 border-cyan-500/30 relative group-hover:border-cyan-400/50 transition-all">
                  {isVolumeComplete && <CheckCircle2 size={14} className="absolute -top-1 -right-1 text-emerald-400" />}
                  <Droplets size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-white font-black text-base">Nạp nước</p>
                  <p className="text-cyan-400/90 text-[11px] uppercase tracking-widest font-bold">Volume • {animatedDaily}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-xl">
                  {waterIntake.toLocaleString('vi-VN')}
                  <span className="text-slate-400 text-sm ml-1">/ {waterGoal.toLocaleString('vi-VN')}</span>
                </p>
                {comparison !== 0 && (
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {comparison > 0 ? (
                      <>
                        <TrendingUp size={12} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">+{Math.abs(comparison)}ml</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} className="text-orange-400" />
                        <span className="text-[10px] text-orange-400 font-bold">{comparison}ml</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Similar cards for Consistency and Streak... */}
            {/* (Abbreviated for space - pattern repeats) */}
          </div>
          
          {/* Expanded section */}
          {isExpanded && (
            <div className="mt-5 p-5 rounded-2xl bg-slate-950/50 border border-white/10 animate-in fade-in slide-in-from-top duration-300 space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-black">Detailed Analytics</p>
                <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                  <p className="text-[10px] text-cyan-300 font-bold">{achievementCount}/3 COMPLETE</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Today</p>
                  <p className="text-white font-black text-lg">{waterIntake.toLocaleString('vi-VN')} ml</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Goal</p>
                  <p className="text-white font-black text-lg">{waterGoal.toLocaleString('vi-VN')} ml</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Streak</p>
                  <p className="text-orange-400 font-black text-lg">{streak} days 🔥</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Level</p>
                  <p className="text-purple-400 font-black text-lg">{level} ⭐</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {achievementCount === 3 && '🎉 Perfect! All rings complete. You\'re on fire!'}
                  {achievementCount === 2 && '💪 Almost there! One more ring to complete.'}
                  {achievementCount === 1 && '🚀 Good progress! Keep pushing forward.'}
                  {achievementCount === 0 && '💧 Start your journey to hydration mastery!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}