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
    <div className="mt-2">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
          {t('home.quick_add')}
        </span>
        <button
          onClick={onEditQuickAmounts}
          className="text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors p-1"
        >
          <Settings size={14} />
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 w-full">
        {quickAmounts.map((amount, index) => (
          <button
            key={`qa-${amount}-${index}`}
            onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
            className="flex-1 bg-slate-200/50 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-300/50 dark:hover:bg-white/20 active:scale-90 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(0,0,0,0.02)] dark:shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
          >
            <Droplet size={20} className="text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-base">+{amount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">ml</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default QuickAddSection;