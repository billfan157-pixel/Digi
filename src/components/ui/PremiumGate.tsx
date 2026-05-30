import { Crown, Lock, Sparkles } from 'lucide-react';
import { glassCard } from '../../styles/glass';

interface PremiumGateProps {
  isPremium: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function PremiumGate({
  isPremium,
  onUpgrade,
  children,
  title = 'Deep Analytics',
  description = 'Explore detailed health habits, trends, and charts.',
}: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div className={glassCard}>
      <div className="absolute inset-0 z-0 select-none opacity-20 blur-[16px] pointer-events-none">
        <div className="p-6 space-y-4">
          <div className="h-8 w-1/3 rounded-lg bg-white/20" />
          <div className="h-32 w-full rounded-[24px] bg-white/10" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-[20px] bg-white/10" />
            <div className="h-28 rounded-[20px] bg-white/10" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-8 py-16">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-white/10 to-white/5 border border-white/20 shadow-[0_8px_32px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md">
            <Lock size={32} className="text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
          </div>
        </div>

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 shadow-sm">
          <Crown size={12} />
          Premium Feature
        </div>

        <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">{title}</h3>
        <p className="mt-3 text-[13px] text-white/60 leading-relaxed font-medium max-w-[280px]">
          {description}
        </p>

        <button
          type="button"
          onClick={onUpgrade}
          className="group mt-8 w-full max-w-[280px] relative overflow-hidden rounded-[16px] p-[1px] transition-transform active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex h-12 items-center justify-center gap-2 rounded-[15px] bg-black/40 backdrop-blur-md border border-white/10 transition-colors group-hover:bg-black/20">
            <span className="bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-xs font-black uppercase tracking-wider text-transparent drop-shadow-sm">
              Upgrade to Unlock
            </span>
            <Sparkles size={16} className="text-orange-400" />
          </div>
        </button>
      </div>
    </div>
  );
}
