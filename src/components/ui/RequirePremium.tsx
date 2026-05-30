import React from 'react';
import { Lock } from 'lucide-react';
import { useSubscriptionTier } from '@/hooks/useIsPremium';
import { useUIStore } from '@/store/useUIStore';

export const PremiumBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 ${className}`}>
    <Lock size={10} />
    Premium
  </span>
);

export const RequirePremium: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredTier?: 'plus' | 'pro';
}> = ({ children, fallback, requiredTier }) => {
  const tier = useSubscriptionTier();
  const setShowPremiumModal = useUIStore(s => s.setShowPremiumModal);

  const hasAccess = (() => {
    if (requiredTier === 'pro') return tier === 'pro';
    return tier === 'plus' || tier === 'pro';
  })();

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const buttonText = requiredTier === 'pro' ? 'Unlock Pro' : 'Unlock Premium';

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => setShowPremiumModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 active:scale-95 transition-all"
        >
          <Lock size={14} />
          {buttonText}
        </button>
      </div>
    </div>
  );
};

