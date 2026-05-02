import React from 'react';
import { Sparkles, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

import { useUIStore } from '../../store/useUIStore';

export default function UpgradeModal() {
  const open = useUIStore(s => s.showPremiumModal);
  const onClose = () => useUIStore.getState().setShowPremiumModal(false);
  if (!open) return null;
  const isNativeBuild = Capacitor.isNativePlatform();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-20">
          <X size={18} />
        </button>

        {/* Left Column - Features */}
        <div className="w-full p-6 bg-slate-950/50 border-b border-slate-800 flex flex-col justify-center relative shrink-0">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10 mt-4">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Sparkles size={24} />
            </div>
            <h2 className="text-3xl font-black text-white">DigiWell <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">Nâng cấp để mở khóa toàn bộ tính năng thông minh và tối ưu hóa sức khỏe của bạn.</p>
          
          <ul className="space-y-3 relative z-10">
            {[
              'Xuất báo cáo PDF chuẩn Y khoa',
              'Chế độ Nhịn ăn gián đoạn (Fasting)',
              'AI Analytics chuyên sâu phân tích thói quen',
              'Không giới hạn lưu trữ dữ liệu'
            ].map((ft, index) => (
              <li key={`feat-${index}`} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-amber-400" />
                </div>
                {ft}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full p-6 relative flex flex-col justify-center shrink-0">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-white font-black text-base">Premium purchase đang bị tắt</h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Build hiện tại không mở thanh toán cho tính năng số trong app. Điều này tránh rủi ro vi phạm chính sách App Store trước khi có luồng In-App Purchase chuẩn.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 space-y-3 text-sm text-slate-300">
            <p>{isNativeBuild ? 'iOS/Android build:' : 'Build hiện tại:'} Premium vẫn được giữ ở trạng thái giới thiệu tính năng.</p>
            <p>Luồng QR trực tiếp và checkout ngoài app cho digital premium đã bị loại khỏi màn hình này.</p>
            <p>Khi cần phát hành thanh toán, nên thay bằng StoreKit / App Store In-App Purchase và luồng tương đương trên Android.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 rounded-2xl bg-slate-800 text-white font-black text-sm active:scale-95 transition-transform border border-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
