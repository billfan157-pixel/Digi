import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

import { useUIStore } from '../../store/useUIStore';
import { redirectToCheckout } from '../../lib/stripe';
import { PREMIUM_HIGHLIGHTS } from '../../config/premium';

export default function UpgradeModal() {
  const open = useUIStore(s => s.showPremiumModal);
  const onClose = () => useUIStore.getState().setShowPremiumModal(false);
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  if (!open) return null;

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan);
    await redirectToCheckout(plan);
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-20">
          <X size={18} />
        </button>

        <div className="w-full p-6 bg-slate-950/50 border-b border-slate-800 flex flex-col justify-center relative shrink-0">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10 mt-4">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Sparkles size={24} />
            </div>
            <h2 className="text-3xl font-black text-white">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">Nâng cấp để mở khóa toàn bộ tính năng thông minh và tối ưu hóa sức khỏe của bạn.</p>
          
          <ul className="space-y-2 relative z-10">
            {PREMIUM_HIGHLIGHTS.slice(0, 6).map((ft, index) => (
              <li key={`feat-${index}`} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 text-xs">
                  {ft.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-200 font-bold text-xs">{ft.title}</span>
                  <p className="text-[10px] text-slate-500 leading-tight">{ft.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full p-6 relative flex flex-col justify-center shrink-0 space-y-3">
          <button
            onClick={() => handleCheckout('monthly')}
            disabled={loading !== null}
            className="w-full py-4 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          >
            {loading === 'monthly' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {loading === 'monthly' ? 'Đang kết nối...' : 'Đăng ký Pro Tháng — 29.000₫/tháng'}
          </button>

          <button
            onClick={() => handleCheckout('yearly')}
            disabled={loading !== null}
            className="w-full py-4 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}
          >
            {loading === 'yearly' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {loading === 'yearly' ? 'Đang kết nối...' : 'Đăng ký Pro Năm — 199.000₫/năm (Tiết kiệm 43%)'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
