import React from 'react';
import { motion } from 'framer-motion';

interface LiquidProgressProps {
  percentage: number; // 0 đến 100
}

export const LiquidProgress: React.FC<LiquidProgressProps> = ({ percentage }) => {
  // Giới hạn an toàn từ 0 - 100%
  const clamped = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div 
      className="relative w-56 h-56 rounded-full border-[6px] border-slate-700 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden shadow-2xl shadow-cyan-900/40 mx-auto hover:shadow-cyan-900/60 transition-all ring-2 ring-cyan-500/20"
      role="progressbar"
      aria-label="Tiến độ nước"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Vùng sóng nước sẽ dâng lên từ dưới đáy */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-cyan-600 to-cyan-500 origin-bottom"
        initial={{ y: "100%" }}
        animate={{ y: `${100 - clamped}%` }}
        transition={{ type: 'spring', damping: 12, stiffness: 35 }}
      >
        {/* Lớp SVG sóng trước (nhanh hơn, đậm màu hơn) */}
        <motion.div
          className="absolute bottom-full left-0 w-[200%] h-14 flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
        >
          <svg className="w-full h-full text-cyan-500 drop-shadow-lg" viewBox="0 0 800 100" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,50 Q100,20 200,50 T400,50 T600,50 T800,50 L800,100 L0,100 Z" />
          </svg>
        </motion.div>
        
        {/* Lớp SVG sóng sau (chậm hơn, mờ hơn để tạo chiều sâu 3D) */}
        <motion.div
          className="absolute bottom-full left-0 w-[200%] h-16 flex opacity-50 mix-blend-screen"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "linear" }}
        >
          <svg className="w-full h-full text-cyan-300" viewBox="0 0 800 100" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,50 Q150,80 300,50 T600,50 T900,50 L900,100 L0,100 Z" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Shimmer effect for more polish */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        animate={{ x: ["-200%", "200%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />
    </div>
  );
};

export default LiquidProgress;