import { Droplet, Settings, Plus } from 'lucide-react';
import { Droplet, Settings } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuickAddSectionProps {
  quickAmounts: number[];
  handleAddWater: (amount: number, factor: number, name: string) => void;
  onEditQuickAmounts: () => void;
}

const QuickAddSection = React.memo(function QuickAddSection({ quickAmounts, handleAddWater, onEditQuickAmounts }: QuickAddSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-cyan-500/20 text-cyan-400">
             <Plus size={12} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t('home.quick_add')}
          </span>
        </div>
    <div className="mt-2 px-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest opacity-85">
          {t('home.quick_add')}
        </span>
        <button
          onClick={onEditQuickAmounts}
          className="text-slate-500 hover:text-white transition-colors active:scale-95 p-1 rounded-md hover:bg-white/5"
          className="text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 active:scale-90"
        >
          <Settings size={14} />
        </button>
      </div>
      
      <div className="flex gap-2.5">
      <div className="flex items-center justify-center gap-3 w-full">
        {quickAmounts.map((amount, index) => (
          <button
            key={`qa-${amount}-${index}`}
            onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
            className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 rounded-2xl py-4 px-2 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 active:scale-95 shadow-sm"
            className="flex-1 bg-gradient-to-br from-slate-200/60 to-slate-100/40 dark:from-slate-800/50 dark:to-slate-900/30 backdrop-blur-md border border-slate-300/50 dark:border-white/10 rounded-2xl px-3 py-5 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 hover:from-cyan-500/20 hover:to-cyan-400/10 dark:hover:from-cyan-500/15 dark:hover:to-cyan-600/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/30 active:scale-95 transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
            
            <Droplet size={32} className="absolute text-cyan-500/5 group-hover:text-cyan-500/10 group-hover:scale-125 transition-all duration-500" fill="currentColor" />
            
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-sm">{amount}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-cyan-500/70 transition-colors">ml</span>
              </div>
            </div>
            <Droplet size={22} className="text-cyan-500 dark:text-cyan-400 mb-1.5 group-hover:scale-125 transition-transform" />
            <span className="font-bold text-lg">+{amount}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 font-semibold">ml</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default QuickAddSection;