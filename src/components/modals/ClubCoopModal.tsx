import React, { useState } from 'react';
import { X, Flame, Droplet, Trophy, Users, Target, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
// @ts-ignore
import confetti from 'canvas-confetti';
import type { Profile } from '@/models';

import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';

export default function ClubCoopModal() {
  const isOpen = useUIStore(s => s.showClubCoopModal);
  const onClose = () => useUIStore.getState().setShowClubCoopModal(false);
  const profile = useAppStore(s => s.profile);
  const waterIntake = useAppStore(s => s.waterIntake);
  const [hasContributed, setHasContributed] = useState(false);
  
  // Mock data cho Boss (Có thể nối với Backend sau)
  const GOAL_ML = 500000; // 500 Lít
  const [currentProgress, setCurrentProgress] = useState(384500); 
  const membersCount = 124;

  const topContributors = [
    { name: 'Diệu Linh', amount: 15400, isMVP: true },
    { name: 'Quốc Bảo', amount: 12200, isMVP: false },
    { name: 'Hải Đăng', amount: 10500, isMVP: false },
  ];

  const handleContribute = () => {
    if (waterIntake <= 0) {
      toast.error('Sếp chưa uống giọt nào hôm nay để góp sát thương cả!');
      return;
    }
    
    setHasContributed(true);
    const newProgress = currentProgress + waterIntake;
    setCurrentProgress(newProgress);
    
    // Kiểm tra xem đây có phải đòn kết liễu không
    if (newProgress >= GOAL_ML && currentProgress < GOAL_ML) {
      confetti({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ef4444', '#fcd34d', '#10b981'] // Hiệu ứng nổ rực rỡ hơn
      });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200, 100, 300]); // Rung dài hơn
      toast.success('🎉 Sếp đã tiêu diệt Boss!');
    } else {
      // Hiệu ứng ăn mừng bình thường
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#60a5fa'] // Nước bắn tung tóe
      });
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      toast.success(`💥 Chí mạng! Bạn đã góp ${waterIntake}ml sát thương vào Boss!`);
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.min((currentProgress / GOAL_ML) * 100, 100);
  const remaining = Math.max(GOAL_ML - currentProgress, 0);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-orange-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] relative flex flex-col max-h-[90vh]"
      >
        {/* Nền Header phong cách Raid Boss */}
        <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 border-b border-orange-500/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-600/30 blur-[80px] rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/30 blur-[80px] rounded-full"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white/70 hover:text-white backdrop-blur-md z-20">
            <X size={20} />
          </button>

          <div className="relative z-10 flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 bg-orange-950/80 border-2 border-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.6)] mb-2">
              <Flame size={40} className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,1)]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase text-shadow-sm">Hỏa Thần Sa Mạc</h2>
            <p className="text-[10px] text-orange-400 font-bold tracking-[0.3em] uppercase mt-1">World Boss Tuần Này</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
          {/* Thanh Máu Boss (Progress Bar) */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Thanh Máu Boss</p>
                <p className="text-white font-black text-xl">{remaining.toLocaleString('vi-VN')} <span className="text-xs text-slate-400">ml</span></p>
              </div>
              <div className="text-right">
                <p className="text-orange-500 font-black text-xl">{progressPercent.toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative p-0.5">
              {/* Thanh máu Boss (chạy ngược) */}
              <div className="absolute inset-0 bg-orange-600/20"></div>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, type: "spring" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] relative z-10"
              />
            </div>
          </div>

          {/* Phần Thưởng */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none"></div>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Trophy size={12}/> Phần thưởng diệt Boss</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-950/50 border border-amber-500/50 rounded-xl flex items-center justify-center relative">
                <Shield className="text-amber-400" size={24} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-ping"></div>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Khung Avatar: Rồng Lửa</p>
                <p className="text-amber-400 text-xs font-semibold">+ 2,000 Vàng mỗi thành viên</p>
              </div>
            </div>
          </div>

          {/* Bảng Xếp Hạng Góp Sát Thương */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1"><Users size={12}/> Top Sát Thương Bang Hội</p>
            <div className="space-y-2">
              {topContributors.map((user, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${user.isMVP ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/50 border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${user.isMVP ? 'text-cyan-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                    <span className="text-white font-bold text-sm">{user.name}</span>
                    {user.isMVP && <span className="bg-cyan-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">MVP</span>}
                  </div>
                  <div className="text-cyan-400 font-bold text-sm font-mono tracking-tighter">
                    {user.amount.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500">ml</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nút Góp Sát Thương */}
        <div className="p-4 bg-slate-950 border-t border-white/5 shrink-0">
          <button onClick={handleContribute} disabled={hasContributed} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2">
            {hasContributed ? <><Target size={18} /> Đã góp sát thương hôm nay</> : <><Droplet size={18} /> Góp {waterIntake}ml sát thương <ArrowRight size={16} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}