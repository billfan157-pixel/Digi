import { Trophy, Droplets, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuestCompleteCardProps {
  authorName: string;
  authorAvatar: string | null;
  questTitle: string;
  rewardExp: number;
  createdAt: string;
  onCheers: () => void;
}

export function QuestCompleteCard({ authorName, authorAvatar, questTitle, rewardExp, createdAt, onCheers }: QuestCompleteCardProps) {
  // Format giờ hiển thị (VD: 14:30)
  const time = new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
      className="transition-all duration-500 rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-slate-900/80 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.1)] relative overflow-hidden"
    >
      {/* Nền Gradient chìm tỏa sáng */}
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      
      {/* Header thông tin người dùng */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border-2 border-cyan-500/50 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-cyan-400">{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px]">{authorName}</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                <Trophy size={10} /> Quest
              </span>
            </div>
            <span className="text-slate-400 text-xs font-medium mt-0.5">{time}</span>
          </div>
        </div>
      </div>

      {/* Khối trung tâm hiển thị Nhiệm vụ đã hoàn thành */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 rounded-2xl border border-white/5 relative z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <Trophy size={32} className="text-white drop-shadow-md" />
        </div>
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1">Quest Completed</p>
        <h4 className="text-white text-xl font-black mb-3 text-center leading-tight">{questTitle}</h4>
        
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-yellow-400 font-black text-sm">+{rewardExp} EXP</span>
        </div>
      </div>

      {/* Nút Cụng Ly / Chúc mừng */}
      <div className="mt-4 flex relative z-10">
        <button 
          onClick={onCheers}
          className="w-full py-3.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-black text-sm active:scale-95 transition-all hover:bg-cyan-500/25 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <Droplets size={18} /> Cheers & Celebrate
        </button>
      </div>
    </motion.div>
  );
}