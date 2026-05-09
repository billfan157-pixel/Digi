import React, { memo, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Target, Award, Zap, Trophy, Star, ChevronRight, Flame, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWellnessData } from '@/hooks/useWellnessData';
import type { WellnessCorrelation } from '@/utils/wellnessMath';

interface WellnessDashboardProps {
  onNavigateToInsight?: () => void;
}

// Enhanced animated counter
function useAnimatedScore(target: number, duration: number = 1200) {
  const [current, setCurrent] = React.useState(0);
  
  React.useEffect(() => {
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

// Confetti particle
function useConfettiStyle(index: number) {
  // eslint-disable-next-line react-hooks/purity
  const [style] = React.useState(() => {
    const colors = ['#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#ef4444'];
    const color = colors[index % colors.length];
    /* eslint-disable react-hooks/purity */
    const x = (Math.random() - 0.5) * 300;
    const y = Math.random() * 400 + 200;
    const rotation = Math.random() * 720 - 360;
    const scale = Math.random() * 0.6 + 0.4;
    /* eslint-enable react-hooks/purity */
    return { color, x, y, rotation, scale };
  });
  return style;
}

function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const { color, x, y, rotation, scale } = useConfettiStyle(index);
  
  return (
    <motion.div
      className="absolute rounded-full"
      initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: x,
        y: y,
        rotate: rotation,
        scale: [scale, scale * 0.5, 0],
      }}
      transition={{ duration: 2, ease: 'easeOut', delay }}
      style={{
        width: `${scale * 8}px`,
        height: `${scale * 8}px`,
        backgroundColor: color,
      }}
    />
  );
}

// Component card with enhanced features
function ComponentCard({ 
  label, 
  score, 
  icon, 
  color, 
  description, 
  trend, 
  previousScore,
  index 
}: { 
  label: string;
  score: number;
  icon: string;
  color: string;
  description: string;
  trend?: number[];
  previousScore?: number;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const animatedScore = useAnimatedScore(score);
  const scoreDiff = previousScore ? score - previousScore : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5 transition-all duration-300 hover:border-white/10 hover:shadow-xl overflow-hidden"
      >
        {/* Hover glow effect */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
          />
        )}
        
        {/* Icon with pulse */}
        <div className="text-center relative z-10">
          <motion.div
            animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="text-3xl mb-2 inline-block"
          >
            {icon}
          </motion.div>
          
          {/* Score with trend indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
              className={`text-2xl font-black ${color}`}
            >
              {animatedScore}
            </motion.div>
            {scoreDiff !== 0 && (
              <div className={`text-xs font-bold ${scoreDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {scoreDiff > 0 ? '+' : ''}{scoreDiff}
              </div>
            )}
          </div>
          
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-[8px] text-slate-600 leading-tight">
            {description}
          </p>
          
          {/* Mini trend sparkline */}
          {trend && trend.length > 0 && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end justify-center gap-0.5 h-6 mt-2"
            >
              {trend.map((value, i) => {
                const max = Math.max(...trend);
                const min = Math.min(...trend);
                const range = max - min || 1;
                const height = ((value - min) / range) * 20;
                return (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-300"
                    style={{
                      height: `${Math.max(height, 2)}px`,
                      backgroundColor: color.replace('text-', '').split('-')[0],
                      opacity: i === trend.length - 1 ? 1 : 0.4,
                    }}
                  />
                );
              })}
            </motion.div>
          )}
          
          {/* Achievement badge for high scores */}
          {score >= 90 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 + 0.5, type: 'spring' }}
              className="absolute -top-2 -right-2"
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg">
                <Star size={12} className="text-white fill-white" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Streak badge
function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
      className="absolute top-4 right-4 z-20"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg animate-pulse" />
        <div className="relative bg-gradient-to-r from-orange-400 to-red-500 rounded-full px-3 py-2 border-2 border-white/20 shadow-xl">
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-white" />
            <div className="text-left">
              <p className="text-xs font-black text-white leading-none">{streak}</p>
              <p className="text-[8px] text-white/80 font-bold uppercase tracking-wider">Day Streak</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Level badge
function LevelBadge({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ scale: 0, x: -50 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
      className="absolute top-4 left-4 z-20"
    >
      <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-2xl px-3 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-300" />
          <div className="text-left">
            <p className="text-[8px] uppercase tracking-wider text-white/80 font-bold leading-none mb-0.5">Level</p>
            <p className="text-lg leading-none font-black text-white">{level}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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

  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  
  const scoreColor = getScoreColor(wellnessScore);
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';
  
  // Calculate level and streak (mock data for demo)
  const level = Math.floor(wellnessScore / 15) + 1;
  const streak = 12; // This would come from actual data
  const previousScores = {
    hydration: 75,
    sleep: 82,
    activity: 65,
    mood: 88,
  };

  const components = [
    {
      label: 'Hydration',
      score: hydrationScore,
      icon: '💧',
      color: hydrationScore >= 80 ? 'text-cyan-400' : hydrationScore >= 60 ? 'text-blue-400' : 'text-orange-400',
      description: `${Math.round(hydrationScore)}% của mục tiêu`,
      trend: [72, 75, 78, 73, 76, 79, hydrationScore],
      previousScore: previousScores.hydration,
    },
    {
      label: 'Sleep',
      score: sleepScore,
      icon: '🌙',
      color: sleepScore >= 80 ? 'text-indigo-400' : sleepScore >= 60 ? 'text-blue-400' : 'text-orange-400',
      description: sleepScore >= 80 ? 'Chất lượng tốt' : 'Cần cải thiện',
      trend: [80, 82, 79, 85, 83, 81, sleepScore],
      previousScore: previousScores.sleep,
    },
    {
      label: 'Activity',
      score: activityScore,
      icon: '⚡',
      color: activityScore >= 70 ? 'text-amber-400' : activityScore >= 50 ? 'text-yellow-400' : 'text-orange-400',
      description: activityScore >= 70 ? 'Rất năng động' : 'Ít vận động',
      trend: [60, 65, 63, 68, 70, 67, activityScore],
      previousScore: previousScores.activity,
    },
    {
      label: 'Mood',
      score: moodScore,
      icon: '😊',
      color: moodScore >= 80 ? 'text-emerald-400' : moodScore >= 60 ? 'text-lime-400' : 'text-rose-400',
      description: moodScore >= 80 ? 'Tích cực' : moodScore >= 60 ? 'Bình thường' : 'Cần cải thiện',
      trend: [85, 88, 86, 90, 87, 89, moodScore],
      previousScore: previousScores.mood,
    },
  ];

  // Trigger celebration for high scores
  React.useEffect(() => {
    if (wellnessScore >= 90) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [wellnessScore]);

  const animatedWellnessScore = useAnimatedScore(wellnessScore);

  return (
    <div className="space-y-5 animate-in fade-in duration-400">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      {/* Main Wellness Score Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl">
        {/* Level & Streak badges */}
        <LevelBadge level={level} />
        <StreakBadge streak={streak} />
        
        {/* Celebration confetti */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-30">
            {[...Array(30)].map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.03} index={i} />
            ))}
          </div>
        )}
        
        {/* Background glow based on tier */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${
            wellnessScore >= 80
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
              : wellnessScore >= 60
              ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
              : 'bg-gradient-to-br from-orange-400 to-rose-500'
          }`}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-6 pt-8">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">
              Điểm Wellbeing
            </p>
            <h3 className="text-2xl font-black text-white mt-1">Wellness Score</h3>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center gap-1.5 ${trendColor}`}
          >
            {React.createElement(trendIcon, { size: 18 })}
            <span className="text-xs font-bold uppercase tracking-wider">{trend}</span>
          </motion.div>
        </div>

        {/* Central Score Display with enhanced ring */}
        <div className="relative flex items-center justify-center py-6">
          <div className="relative w-44 h-44">
            {/* Outer glow ring */}
            <motion.div
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${scoreColor}20 0%, transparent 70%)`,
              }}
            />
            
            {/* Background ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 283' }}
                animate={{ strokeDasharray: `${(wellnessScore / 100) * 283} 283` }}
                transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  filter: `drop-shadow(0 0 12px ${scoreColor}80)`,
                }}
              />
              
              {/* Milestone markers */}
              {[25, 50, 75, 100].map((milestone) => {
                const angle = (milestone / 100) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + 45 * Math.cos(angle);
                const y = 50 + 45 * Math.sin(angle);
                return (
                  <motion.circle
                    key={milestone}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={wellnessScore >= milestone ? scoreColor : "rgba(255,255,255,0.1)"}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + milestone / 100, type: 'spring' }}
                  />
                );
              })}
            </svg>

            {/* Center content with enhanced animation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <motion.span
                  animate={wellnessScore >= 90 ? {
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: wellnessScore >= 90 ? Infinity : 0,
                    repeatDelay: 2,
                  }}
                  className="text-6xl font-black block"
                  style={{ 
                    color: scoreColor,
                    textShadow: `0 0 20px ${scoreColor}60`,
                  }}
                >
                  {animatedWellnessScore}
                </motion.span>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-1 mt-2"
                >
                  <span className="text-xl">{tier.emoji}</span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                    {tier.tier}
                  </span>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[10px] text-slate-400 mt-1.5 max-w-[120px] leading-tight"
                >
                  {tier.description}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Component breakdown with enhanced cards */}
        <div className="grid grid-cols-4 gap-3 mt-6 relative z-10">
          {components.map((comp, index) => (
            <ComponentCard key={comp.label} {...comp} index={index} />
          ))}
        </div>

        {/* Weekly average comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">Trung bình tuần</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-300">{Math.round(weeklyAverage)}</span>
              <div className={`text-xs font-bold ${wellnessScore > weeklyAverage ? 'text-emerald-400' : 'text-rose-400'}`}>
                {wellnessScore > weeklyAverage ? '↑' : '↓'} {Math.abs(Math.round(wellnessScore - weeklyAverage))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insights Section with enhanced cards */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              <h3 className="text-sm font-black text-white">Insights dinh dưỡng</h3>
            </div>
            <div className="text-xs font-bold text-slate-500">
              {insights.length} insights
            </div>
          </div>

          {insights.slice(0, 2).map((insight, idx) => (
            <EnhancedInsightCard
              key={idx}
              insight={insight}
              index={idx}
              isExpanded={expandedInsight === idx}
              onToggle={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
            />
          ))}
        </motion.div>
      )}

      {/* Action Button with enhanced design */}
      {onNavigateToInsight && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToInsight}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-500/30 hover:shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity" />
          <Target size={18} className="relative z-10" />
          <span className="relative z-10">Xem phân tích chi tiết</span>
          <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      )}
    </div>
  );
});

function getScoreColor(score: number): string {
  if (score >= 90) return '#a855f7'; // purple
  if (score >= 80) return '#f59e0b'; // amber
  if (score >= 70) return '#10b981'; // emerald
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 50) return '#06b6d4'; // cyan
  return '#ef4444'; // red
}

interface EnhancedInsightCardProps {
  insight: WellnessCorrelation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function EnhancedInsightCard({ insight, index, isExpanded, onToggle }: EnhancedInsightCardProps) {
  const isPositive = insight.strength > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 cursor-pointer group"
      onClick={onToggle}
    >
      {/* Colored accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="ml-3 p-5 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-bold text-white leading-snug flex-1 pr-4">
            {insight.insight}
          </h4>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={16} className="text-slate-400" />
          </motion.div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 overflow-hidden"
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Ví dụ thực tế</p>
              {insight.examples.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-xs bg-white/5 rounded-lg p-3"
                >
                  <span className="text-slate-600 font-mono text-xs">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-slate-300 mb-1">{ex.scenario}</p>
                    <p className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ex.impact}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}