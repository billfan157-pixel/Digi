import React from 'react';
import { Sparkles, ShieldAlert, Crown, Zap, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumModalProps {
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  setIsPremium: (isPremium: boolean) => void;
}

export default function PremiumModal({
  showPremiumModal,
  setShowPremiumModal,
}: PremiumModalProps) {

  if (!showPremiumModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowPremiumModal(false)}>
      <div className="w-full max-w-sm rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]" style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(245,158,11,0.3)' }} onClick={e => e.stopPropagation()}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <Sparkles size={28} className="text-amber-400" />
        </div>
        
        <h3 className="text-2xl font-black text-white mb-2">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">Mở khóa thêm tính năng nâng cao khi gói mobile premium sẵn sàng phát hành.</p>
        
        <ul className="space-y-4 mb-8">
          {[
            { text: 'Bảo vệ Chuỗi (2 Thẻ Đóng băng/tháng)', icon: ShieldAlert, color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { text: 'Hào quang Đấu Trường (Viền Avatar VIP)', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20' },
            { text: 'Boost X2 Vàng (Từ Quest & Gacha)', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
            { text: 'AI CyberMinder Nâng Cao', icon: BrainCircuit, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
          ].map((ft, index) => {
            const Icon = ft.icon;
            return (
              <li key={`premium-ft-${index}`} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <div className={`w-8 h-8 rounded-full ${ft.bg} flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner`}>
                  <Icon size={14} className={ft.color} />
                </div>
                {ft.text}
              </li>
            );
          })}
        </ul>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
          Thanh toán mobile đang được giữ ở trạng thái tắt cho đến khi có luồng StoreKit / Play Billing hoàn chỉnh.
        </div>
        <button
          onClick={() => {
            setShowPremiumModal(false);
            toast.info('Premium hien dang o che do gioi thieu. Luong mua trong app se duoc mo khi billing mobile san sang.');
          }}
          className="w-full mt-4 py-4 rounded-xl font-bold text-slate-900 text-sm active:scale-95 transition-all shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}
        >
          Theo dõi cập nhật Premium
        </button>
        <button onClick={() => setShowPremiumModal(false)} className="w-full mt-3 py-3 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-800 transition-colors">
          Để sau
        </button>
      </div>
    </div>
  );
}
