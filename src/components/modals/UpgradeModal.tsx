import { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Check, ShieldAlert } from 'lucide-react';

import { useUIStore } from '../../store/useUIStore';
import { redirectToCheckout } from '../../lib/stripe';
import { PRICING } from '../../config/premium';
import { track } from '@/lib/analytics';

export default function UpgradeModal() {
  const open = useUIStore(s => s.showPremiumModal);
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
    await redirectToCheckout(plan, tier);
    setLoading(null);
  };

  const plusPricing = PRICING.plus[billingCycle];
  const proPricing = PRICING.pro[billingCycle];

  // Highlights arrays
  const plusFeatures = [
    'Không quảng cáo 100%',
    'Khung viền profile Bạc',
    'AI Chat: 15 tin nhắn/ngày',
    'AI Advice: 5 lời khuyên/ngày',
    '1 ngày Streak Freeze/tháng',
    'Lịch sử uống nước: 30 ngày',
    'Hệ số nước uống Cơ bản',
    'Xem biểu đồ tuần nâng cao'
  ];

  const proFeatures = [
    'Tất cả quyền lợi của gói Plus',
    'Không giới hạn AI Chat & Advice',
    'AI Hydration Coach thông minh',
    '3 ngày Streak Freeze/tháng',
    'Khung viền profile Vàng động',
    'Premium Health Score chi tiết',
    'Đồng bộ Smartwatch & Lịch trình',
    'VIP Club Tools tạo bang hội'
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
            NÂNG CẤP <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">DIGIWELL</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto relative z-10 font-medium">
            Chọn gói nâng cấp phù hợp để đồng hành cùng AI Coach và tối ưu hóa sức khỏe của bạn mỗi ngày.
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
              Thanh toán tháng
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all relative flex items-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-slate-800 text-amber-400 border border-white/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Thanh toán năm
              <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-black">
                -33%
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
                    Plus Gói Basic
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
                    ? 'Đang kết nối...'
                    : billingCycle === 'monthly'
                    ? 'Đăng ký Plus Tháng'
                    : 'Đăng ký Plus Năm'}
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: PRO TIER */}
          <div className="relative rounded-[2rem] border-2 border-amber-500/30 bg-gradient-to-b from-slate-950/60 to-slate-950/40 p-5 flex flex-col justify-between hover:border-amber-400/50 transition-all group shadow-2xl">
            {/* Best Value Badge */}
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400 shadow-md">
              Khuyên dùng
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">
                    Pro Trải Nghiệm AI
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
                    ? 'Đang kết nối...'
                    : billingCycle === 'monthly'
                    ? 'Đăng ký Pro Tháng'
                    : 'Đăng ký Pro Năm'}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center shrink-0 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold">
          <ShieldAlert size={12} />
          <span>Giao dịch an toàn và bảo mật qua cổng thanh toán Stripe.</span>
        </div>

      </div>
    </div>
  );
}
