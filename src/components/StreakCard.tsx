import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakCardProps {
  authorName: string;
  authorAvatar: string | null;
  streakDays: number;
  createdAt: string;
  onCheers: () => void;
}

export function StreakCard({ authorName, authorAvatar, streakDays, createdAt, onCheers }: StreakCardProps) {
  // Format giờ hiển thị (VD: 14:30)
  const time = new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
      className="transition-all duration-500 rounded-3xl p-5 border border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-slate-900/80 backdrop-blur-sm shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden"
    >
      {/* Nền Gradient chìm tỏa sáng */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
      
      {/* Header thông tin người dùng */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border-2 border-orange-500/50 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-orange-400">{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px]">{authorName}</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                <Flame size={10} /> Streak
              </span>
            </div>
            <span className="text-slate-400 text-xs font-medium mt-0.5">{time}</span>
          </div>
        </div>
      </div>

      {/* Khối trung tâm hiển thị ngày duy trì */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 rounded-2xl border border-white/5 relative z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
          <Flame size={32} className="text-white animate-pulse" />
        </div>
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Cột mốc duy trì</p>
        <h4 className="text-white text-3xl font-black mb-1">{streakDays} <span className="text-lg text-slate-300 font-bold">ngày</span></h4>
        <p className="text-slate-400 text-sm">Vừa bảo vệ chuỗi thành công!</p>
      </div>

      {/* Nút Cụng Ly / Chúc mừng */}
      <div className="mt-4 flex relative z-10">
        <button 
          onClick={onCheers}
          className="w-full py-3.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 font-black text-sm active:scale-95 transition-all hover:bg-orange-500/25 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
        >
          <Flame size={18} /> Cụng ly chúc mừng
        </button>
      </div>
    </motion.div>
  );
}