import { useTranslation } from 'react-i18next';
import { Droplets, BellRing, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhotoProofCardProps {
  authorName: string;
  authorAvatar: string | null;
  imageUrl: string;
  caption?: string;
  waterAmount?: number;
  createdAt: string;
  onNudge: () => void;
}

export function PhotoProofCard({ authorName, authorAvatar, imageUrl, caption, waterAmount, createdAt, onNudge }: PhotoProofCardProps) {
  const { t } = useTranslation();
  // Format giờ hiển thị (VD: 14:30)
  const time = new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
      className="transition-all duration-500 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-sm shadow-xl relative overflow-hidden"
    >
      {/* Header thông tin người dùng */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border border-slate-700/50 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-slate-300">{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px]">{authorName}</span>
              <span className="bg-slate-800 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 border border-white/5">
                <Camera size={10} /> Live Snap
              </span>
            </div>
            <span className="text-slate-500 text-[10px] font-medium mt-0.5">{time}</span>
          </div>
        </div>
      </div>

      {/* Khu vực hiển thị Ảnh thực tế */}
      <div className="relative w-full bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
        <img src={imageUrl} alt={t('feed.photo_proof')} className="w-full h-full object-cover" loading="lazy" />
        
        {waterAmount && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg">
            <Droplets size={14} className="text-cyan-400" /> {waterAmount} ml
          </div>
        )}
      </div>

      {/* Footer chứa Caption và Nút Nudge */}
      <div className="p-4 relative z-10 bg-slate-900/90">
        {caption && <p className="text-sm text-slate-300 mb-4 leading-relaxed">"{caption}"</p>}
        
        <button 
          onClick={onNudge}
          className="w-full py-3.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 font-bold text-sm active:scale-95 transition-all hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
        >
          <BellRing size={16} className="text-cyan-400" /> Nhắc uống nước
        </button>
      </div>
    </motion.div>
  );
}