import { motion } from 'framer-motion';
import { CheckCircle2, Flame } from 'lucide-react';

interface SimpleProgressRingProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  onClick?: () => void;
}

export default function SimpleProgressRing({
  waterIntake,
  waterGoal,
  streak,
}: Omit<SimpleProgressRingProps, 'completionRate' | 'onClick'>) {
  const progress = waterGoal > 0 ? Math.min((waterIntake / waterGoal) * 100, 100) : 0;
  const isComplete = progress >= 100;
  const isStreakActive = streak >= 7;

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="px-6">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
            Hydration Progress
          </h3>
          
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ filter: isComplete ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' : undefined }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-emerald-400">
                {Math.round(progress)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {waterIntake.toLocaleString('vi-VN')} / {waterGoal.toLocaleString('vi-VN')} ml
              </p>
            </div>
          </div>

          {isComplete && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">Daily Goal Complete</span>
            </div>
          )}

          {isStreakActive && (
            <div className="flex items-center justify-center gap-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs font-medium text-orange-400">
                {streak} day streak • Keep going!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}