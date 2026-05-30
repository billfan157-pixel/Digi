import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
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
            Streak
          </p>
          <p className="text-lg leading-none font-black text-orange-400">{streak}</p>
        </div>
      </div>
    </div>
  );
}
