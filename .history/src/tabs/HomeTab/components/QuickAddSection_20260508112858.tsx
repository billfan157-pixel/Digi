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
      <div className="flex items-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-lg">
        <div className="flex flex-1 items-center justify-between">
          {quickAmounts.map((amount, index) => (
            <button
              key={`qa-${amount}-${index}`}
              onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full hover:bg-white/5 active:scale-95 transition-all group border border-transparent hover:border-white/5"
            >
              <Droplet size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-white font-bold text-sm">+{amount}</span>
            </button>
          ))}
        </div>
        <div className="pl-1 pr-2 border-l border-white/10 ml-1">
          <button
            onClick={onEditQuickAmounts}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default QuickAddSection;