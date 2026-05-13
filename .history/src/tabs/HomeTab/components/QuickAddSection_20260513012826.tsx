import { Droplet, SlidersHorizontal, Clock, LayoutGrid, CloudOff } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

interface QuickAddSectionProps {
  quickAmounts: number[];
  handleAddWater: (amount: number, factor: number, name: string) => void;
  onEditQuickAmounts: () => void;
  onHistory?: () => void;
  onDrinkMenu?: () => void;
}

const QuickAddSection = React.memo(function QuickAddSection({
  quickAmounts,
  handleAddWater,
  onEditQuickAmounts,
  onHistory,
  onDrinkMenu,
}: QuickAddSectionProps) {
  const { t } = useTranslation();
  const hasPendingCloudSync = useAppStore((s) => s.hasPendingCloudSync);

  return (
    <div className="px-5 mt-3 mb-6 space-y-3">
      {/* Quick add buttons */}
      <div className="relative rounded-[28px] border border-white/[0.06] bg-slate-900/60 backdrop-blur-2xl px-3 py-3 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.06),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            {quickAmounts.map((amount, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
                className="relative flex-1 h-[86px] rounded-[22px] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.04] group-hover:bg-cyan-400/[0.06] group-hover:border-cyan-300/[0.10] transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_75%)]" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center">
                  <Droplet size={20} className="text-cyan-300/90 mb-1.5" />
                  <span className="text-white font-black text-[20px] tracking-tight leading-none">+{amount}</span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-[0.20em] text-slate-500 font-bold">ml</span>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onEditQuickAmounts}
            className="relative shrink-0 w-[68px] h-[86px] rounded-[22px] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.04] group-hover:bg-white/[0.05] transition-all duration-300" />
            <div className="relative z-10 h-full flex items-center justify-center">
              <SlidersHorizontal size={20} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Utility row (history + drink menu) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDrinkMenu?.()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900/50 border border-white/[0.04] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 active:scale-95 transition-all"
        >
          <LayoutGrid size={15} />
          <span className="text-[10px] font-black uppercase tracking-widest">Đồ uống</span>
        </button>
        <button
          onClick={() => onHistory?.()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900/50 border border-white/[0.04] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 active:scale-95 transition-all"
        >
          <Clock size={15} />
          <span className="text-[10px] font-black uppercase tracking-widest">Lịch sử</span>
        </button>

        {hasPendingCloudSync && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-2">
            <CloudOff size={14} className="text-amber-300" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">Chờ đồng bộ</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default QuickAddSection;