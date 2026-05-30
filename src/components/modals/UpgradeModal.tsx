import { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Check, ShieldAlert, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';

import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { redirectToCheckout } from '../../lib/stripe';
import { PRICING } from '../../config/premium';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { track } from '@/lib/analytics';

export default function UpgradeModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.showPremiumModal);
  const profile = useAppStore(s => s.profile);
  const isNative = Capacitor.isNativePlatform();
  const revenuecat = useRevenueCat();

  const onClose = () => { 
    track('premium_upsell_dismissed'); 
    useUIStore.getState().setShowPremiumModal(false); 
  };
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<{ tier: 'plus' | 'pro'; plan: 'monthly' | 'yearly' } | null>(null);

  useEffect(() => {
    if (open) track('premium_upsell_viewed');
  }, [open]);

  if (!open) return null;

  const handleCheckout = async (tier: 'plus' | 'pro', plan: 'monthly' | 'yearly') => {
    setLoading({ tier, plan });
    track('premium_clicked', { tier, plan });

    if (isNative && revenuecat.isReady) {
      const result = await revenuecat.purchase(tier, plan);
      if (result.success) {
        onClose();
        const { toast } = await import('sonner');
        toast.success(t('common.upgrade_success', { tier: tier === 'pro' ? 'Pro' : 'Plus' }));
      }
    } else {
      await redirectToCheckout(plan, tier);
    }

    setLoading(null);
  };

  const handleRestore = async () => {
    const result = await revenuecat.restore();
    if (result.success) {
      const { toast } = await import('sonner');
      toast.success(t('common.restore_success'));
      onClose();
    }
  };

  const plusPricing = PRICING.plus[billingCycle];
  const proPricing = PRICING.pro[billingCycle];

  // Highlights arrays
  const plusFeatures = [
    t('premium_features.plus_1'),
    t('premium_features.plus_2'),
    t('premium_features.plus_3'),
    t('premium_features.plus_4'),
    t('premium_features.plus_5'),
    t('premium_features.plus_6'),
    t('premium_features.plus_7'),
    t('premium_features.plus_8')
  ];

  const proFeatures = [
    t('premium_features.pro_1'),
    t('premium_features.pro_2'),
    t('premium_features.pro_3'),
    t('premium_features.pro_4'),
    t('premium_features.pro_5'),
    t('premium_features.pro_6'),
    t('premium_features.pro_7'),
    t('premium_features.pro_8')
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all z-20 active:scale-95"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800 text-center relative shrink-0">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />
          <h2 className="text-2xl font-black text-white tracking-wide mt-2 relative z-10 flex items-center justify-center gap-2">
            {t('premium_features.upgrade_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">DIGIWELL</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto relative z-10 font-medium">
            {t('premium_features.upgrade_subtitle')}
          </p>

          {/* Billing Cycle Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 w-fit mx-auto mt-6 relative z-10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-cyan-400 border border-white/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
                {t('premium_features.billing_monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all relative flex items-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-slate-800 text-amber-400 border border-white/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t('premium_features.billing_yearly')}
              <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-black">
                {t('premium_features.yearly_discount')}
              </span>
            </button>
          </div>
        </div>

        {/* Content Side-by-Side Cards */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar bg-slate-900/50">
          
          {/* Card 1: PLUS TIER */}
          <div className="relative rounded-[2rem] border border-cyan-500/25 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-cyan-400/40 transition-all hover:bg-slate-950/60 group shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-widest">
                    {t('premium_features.plus_badge')}
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">DigiWell Plus</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-cyan-400">{plusPricing.label}</p>
                  {billingCycle === 'yearly' && (
                    <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
                      ~{PRICING.plus.yearly.perMonth}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-800/60 my-4" />

              <ul className="space-y-2.5 mb-6">
                {plusFeatures.map((feat, idx) => (
                  <li key={`plus-feat-${idx}`} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                    <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/40">
              <button
                onClick={() => handleCheckout('plus', billingCycle)}
                disabled={loading !== null}
                className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-cyan-500/5"
              >
                {loading?.tier === 'plus' && loading?.plan === billingCycle ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>
                  {loading?.tier === 'plus' && loading?.plan === billingCycle
                    ? t('premium_features.connecting')
                    : billingCycle === 'monthly'
                    ? t('premium_features.plus_subscribe_monthly')
                    : t('premium_features.plus_subscribe_yearly')}
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: PRO TIER */}
          <div className="relative rounded-[2rem] border-2 border-amber-500/30 bg-gradient-to-b from-slate-950/60 to-slate-950/40 p-5 flex flex-col justify-between hover:border-amber-400/50 transition-all group shadow-2xl">
            {/* Best Value Badge */}
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400 shadow-md">
              {t('premium_features.pro_best_value')}
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">
                    {t('premium_features.pro_badge')}
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">DigiWell Pro</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-amber-400">{proPricing.label}</p>
                  {billingCycle === 'yearly' && (
                    <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
                      ~{PRICING.pro.yearly.perMonth}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-800/60 my-4" />

              <ul className="space-y-2.5 mb-6">
                {proFeatures.map((feat, idx) => (
                  <li key={`pro-feat-${idx}`} className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                    <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/40">
              <button
                onClick={() => handleCheckout('pro', billingCycle)}
                disabled={loading !== null}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-60 text-slate-950 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/15"
              >
                {loading?.tier === 'pro' && loading?.plan === billingCycle ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>
                  {loading?.tier === 'pro' && loading?.plan === billingCycle
                    ? t('premium_features.connecting')
                    : billingCycle === 'monthly'
                    ? t('premium_features.pro_subscribe_monthly')
                    : t('premium_features.pro_subscribe_yearly')}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Feature Comparison Table */}
        <div className="px-6 pb-2 -mt-2">
          <div className="bg-slate-950/30 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                {t('premium_features.comparison_title')}
              </h4>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {[
                { label: t('premium_features.comparison_ai_chat'), free: t('premium_features.messages_5'), plus: t('premium_features.messages_15'), pro: t('premium_features.unlimited') },
                { label: t('premium_features.comparison_ai_advice'), free: t('premium_features.advice_3'), plus: t('premium_features.advice_5'), pro: t('premium_features.unlimited') },
                { label: t('premium_features.comparison_ai_coach'), free: t('premium_features.dash'), plus: t('premium_features.dash'), pro: t('premium_features.value_yes') },
                { label: t('premium_features.comparison_reminders'), free: t('premium_features.fixed'), plus: t('premium_features.fixed'), pro: t('premium_features.ai_smart') },
                { label: t('premium_features.comparison_weekly_report'), free: t('premium_features.dash'), plus: t('premium_features.value_yes'), pro: t('premium_features.value_yes') },
                { label: t('premium_features.comparison_advanced'), free: t('premium_features.dash'), plus: t('premium_features.dash'), pro: t('premium_features.value_yes') },
                { label: t('premium_features.comparison_streak_freeze'), free: t('premium_features.dash'), plus: t('premium_features.freeze_1day'), pro: t('premium_features.freeze_3day') },
                { label: t('premium_features.comparison_calendar'), free: t('premium_features.dash'), plus: t('premium_features.dash'), pro: t('premium_features.value_yes') },
                { label: t('premium_features.comparison_smartwatch'), free: t('premium_features.dash'), plus: t('premium_features.dash'), pro: t('premium_features.value_yes') },
                { label: t('premium_features.comparison_ads'), free: t('premium_features.value_yes'), plus: t('premium_features.ad_free'), pro: t('premium_features.ad_free') },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-[10px]">
                  <span className="font-bold text-white col-span-1">{row.label}</span>
                  <span className={`text-center font-medium ${row.free === t('premium_features.value_yes') || row.free === t('premium_features.ad_free') ? 'text-emerald-400' : row.free === t('premium_features.dash') ? 'text-slate-600' : 'text-slate-400'}`}>{row.free}</span>
                  <span className={`text-center font-medium ${row.plus === t('premium_features.value_yes') || row.plus === t('premium_features.ad_free') ? 'text-emerald-400' : row.plus === t('premium_features.dash') ? 'text-slate-600' : 'text-cyan-300'}`}>{row.plus}</span>
                  <span className={`text-center font-medium ${row.pro === t('premium_features.value_yes') || row.pro === t('premium_features.ad_free') ? 'text-emerald-400' : row.pro === t('premium_features.dash') ? 'text-slate-600' : 'text-amber-300'}`}>{row.pro}</span>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[8px] font-bold uppercase tracking-widest text-slate-600 border-t border-white/5">
                <span className="col-span-1" />
                <span className="text-center">{t('premium_features.free_tier')}</span>
                <span className="text-center text-cyan-500">Plus</span>
                <span className="text-center text-amber-500">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Plan Indicator */}
        {profile?.subscription_tier && profile.subscription_tier !== 'free' && (
          <div className="px-6 pb-2">
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold text-emerald-300">
                {t('premium_features.current_plan', { plan: profile.subscription_tier === 'pro' ? 'Pro' : 'Plus', endDate: profile.subscription_end ? new Date(profile.subscription_end).toLocaleDateString('vi-VN') : '' })}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center shrink-0 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold">
            <ShieldAlert size={12} />
            <span>
              {isNative && revenuecat.isReady
                ? t('premium_features.payment_native')
                : t('premium_features.payment_stripe')}
            </span>
          </div>
          {isNative && revenuecat.isReady && (
            <button
              onClick={handleRestore}
              disabled={revenuecat.isLoading}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <RotateCcw size={10} />
              {t('premium_features.restore_purchases')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
