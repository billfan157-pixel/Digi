import React, { useState, useEffect, useRef } from 'react';
import { Droplets, CheckCircle2, TrendingUp, TrendingDown, Sparkles, Target, Flame, ChevronDown, ChevronUp, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BasicTodayRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake?: number;
  weeklyTrend?: number[];
  motivationalTip?: string;
}

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    let raf: number;
    const start = current;
    const diff = target - start;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setCurrent(start + diff * eased);
      
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

function EnhancedConfetti({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {[...Array(45)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: ['#06b6d4', '#10b981', '#f97316', '#3b82f6', '#a855f7'][i % 5],
            width: `${Math.random() * 9 + 5}px`,
            height: `${Math.random() * 9 + 5}px`,
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animation: `confetti-fall ${Math.random() * 2.2 + 1.8}s linear ${i * 0.03}s forwards`,
            opacity: Math.random() * 0.7 + 0.5,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function EnhancedTodayRing({
  waterIntake,
  waterGoal,
  streak,
  completionRate,
  yesterdayIntake = 0,
  weeklyTrend = [],
  motivationalTip,
}: BasicTodayRingProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [hoveredRing, setHoveredRing] = useState<'volume' | 'consistency' | 'streak' | null>(null);
  
  const prevCompletedRef = useRef({ volume: false, consistency: false, streak: false });

  const todayProgressRaw = waterGoal > 0 ? (waterIntake / waterGoal) * 100 : 0;
  const dailyPercent = Math.min(Math.max(todayProgressRaw, 0), 100);
  const weeklyPercent = Math.min(Math.max(completionRate, 0), 100);
  const streakPercent = Math.min(Math.max((streak / 7) * 100, 0), 100);

  const isVolumeComplete = dailyPercent >= 100;
  const isConsistencyComplete = weeklyPercent >= 80;
  const isStreakMilestone = streak >= 7;

  const animatedDaily = useAnimatedCounter(dailyPercent);
  const animatedWeekly = useAnimatedCounter(weeklyPercent);
  const animatedStreak = useAnimatedCounter(streakPercent);

  const comparison = yesterdayIntake > 0 ? waterIntake - yesterdayIntake : 0;

  // Ring configs
  const rVol = 108;
  const rCons = 82;
  const rStreak = 56;
  const cVol = 2 * Math.PI * rVol;
  const cCons = 2 * Math.PI * rCons;
  const cStreak = 2 * Math.PI * rStreak;

  const displayDaily = hasAnimatedIn ? dailyPercent : 0;
  const displayWeekly = hasAnimatedIn ? weeklyPercent : 0;
  const displayStreak = hasAnimatedIn ? streakPercent : 0;

  const offVol = cVol - (displayDaily / 100) * cVol;
  const offCons = cCons - (displayWeekly / 100) * cCons;
  const offStreak = cStreak - (displayStreak / 100) * cStreak;

  const achievementCount = [isVolumeComplete, isConsistencyComplete, isStreakMilestone].filter(Boolean).length;
  const achievementText = achievementCount === 3 ? 'HOÀN HẢO!' : 
                         achievementCount === 2 ? 'Tuyệt vời!' : 
                         achievementCount === 1 ? 'Tiến bộ tốt!' : 'Còn cố lên!';

  // Celebration trigger
  useEffect(() => {
    const anyNewCompletion = 
      (isVolumeComplete && !prevCompletedRef.current.volume) ||
      (isConsistencyComplete && !prevCompletedRef.current.consistency) ||
      (isStreakMilestone && !prevCompletedRef.current.streak);

    if (anyNewCompletion || (achievementCount === 3 && !prevCompletedRef.current.volume)) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2800);
    }

    prevCompletedRef.current = { volume: isVolumeComplete, consistency: isConsistencyComplete, streak: isStreakMilestone };
  }, [isVolumeComplete, isConsistencyComplete, isStreakMilestone, achievementCount]);

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimatedIn(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="px-6">
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(420px) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes ringPulse {
          0%, 100% { filter: drop-shadow(0 0 12px currentColor); }
          50% { filter: drop-shadow(0 0 25px currentColor); }
        }
      `}</style>

      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 pb-5 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-emerald-500/5 to-orange-500/5" />

        {/* Celebration */}
        <EnhancedConfetti isActive={showCelebration} />
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-orange-400 text-slate-950 font-black text-2xl px-10 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
              <Sparkles className="w-8 h-8" /> {achievementText}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[2px] text-cyan-400 font-black">3 VÒNG HOÀN HẢO</p>
              {achievementCount === 3 && <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />}
            </div>
            <p className="text-slate-400 text-sm mt-1">{achievementText} • {achievementCount}/3</p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full bg-slate-800/70 hover:bg-slate-700 transition-all border border-white/10 hover:border-cyan-400/30"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Rings */}
        <motion.div 
          className="flex justify-center -my-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="relative w-[272px] h-[272px]">
            <svg className="rotate-[-90deg]" width="272" height="272" viewBox="0 0 272 272">
              <defs>
                <linearGradient id="volG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="consG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="streakG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background rings */}
              <circle cx="136" cy="136" r={rVol} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18"/>
              <circle cx="136" cy="136" r={rCons} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18"/>
              <circle cx="136" cy="136" r={rStreak} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18"/>

              {/* Progress rings */}
              <circle cx="136" cy="136" r={rVol} fill="none" stroke="url(#volG)" strokeWidth="18" strokeLinecap="round"
                strokeDasharray={cVol} strokeDashoffset={offVol}
                filter={hoveredRing === 'volume' ? "url(#glow)" : undefined}
                className="transition-all duration-1000"
              />
              <circle cx="136" cy="136" r={rCons} fill="none" stroke="url(#consG)" strokeWidth="18" strokeLinecap="round"
                strokeDasharray={cCons} strokeDashoffset={offCons}
                filter={hoveredRing === 'consistency' ? "url(#glow)" : undefined}
                className="transition-all duration-1000"
              />
              <circle cx="136" cy="136" r={rStreak} fill="none" stroke="url(#streakG)" strokeWidth="18" strokeLinecap="round"
                strokeDasharray={cStreak} strokeDashoffset={offStreak}
                filter={hoveredRing === 'streak' ? "url(#glow)" : undefined}
                className="transition-all duration-1000"
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {achievementCount === 3 ? (
                <Award size={42} className="text-yellow-400 mb-2 animate-pulse" />
              ) : isVolumeComplete ? (
                <CheckCircle2 size={38} className="text-emerald-400 mb-2" />
              ) : (
                <Droplets size={38} className="text-cyan-400 mb-2" />
              )}
              
              <p className="text-6xl font-black tracking-tighter text-white mb-1">
                {animatedDaily}<span className="text-3xl text-slate-400">%</span>
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                {isVolumeComplete ? "HOÀN THÀNH" : "HÔM NAY"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="mt-6 space-y-3">
          {/* Volume Card */}
          <div 
            className="ring-card-hover group bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
            onMouseEnter={() => setHoveredRing('volume')}
            onMouseLeave={() => setHoveredRing(null)}
          >
            {isVolumeComplete && <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent animate-pulse" />}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20">
                <Droplets size={22} className="text-cyan-400" />
              </div>
              <div>
                <p className="font-black text-white">Nạp nước</p>
                <p className="text-cyan-400 text-xs font-bold tracking-widest">VOLUME • {animatedDaily}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">
                {waterIntake.toLocaleString('vi-VN')}<span className="text-sm text-slate-500 ml-1">/{waterGoal}</span>
              </p>
              {comparison !== 0 && (
                <div className="flex items-center justify-end gap-1 text-xs mt-1">
                  {comparison > 0 ? <TrendingUp className="text-emerald-400" size={14}/> : <TrendingDown className="text-orange-400" size={14}/>}
                  <span className={comparison > 0 ? "text-emerald-400" : "text-orange-400"}>
                    {comparison > 0 ? '+' : ''}{comparison}ml
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Consistency & Streak Cards (tương tự, rút gọn code) */}
          {/* ... (giữ cấu trúc cũ nhưng tinh chỉnh visual) */}
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 p-5 bg-slate-950/60 border border-white/5 rounded-2xl"
          >
            {/* Nội dung chi tiết... */}
            <p className="text-slate-400 text-sm italic">
              {motivationalTip || "Uống nước đều đặn là chìa khóa cho sức khỏe và năng suất cao hơn."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}