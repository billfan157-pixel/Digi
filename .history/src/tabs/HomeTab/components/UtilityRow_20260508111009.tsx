import { LayoutGrid, Clock } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface UtilityRowProps {
  onHistory: () => void;
  onDrinkMenu: () => void;
}

const UtilityRow = React.memo(function UtilityRow({ onHistory, onDrinkMenu }: UtilityRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-slate-200/50 to-slate-100/30 dark:from-slate-900/60 dark:to-slate-800/40 backdrop-blur-xl border border-slate-300/50 dark:border-white/10 rounded-[2rem] p-1.5 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all mx-6 mb-6">
      <button
        onClick={onHistory}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-90 transition-all duration-200 ease-out hover:bg-slate-200/50 dark:hover:bg-white/10 group"
      >
        <Clock size={16} className="text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
        <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
          {t('home.history')}
        </span>
      </button>
      <div className="w-[1px] h-7 bg-slate-300/50 dark:bg-white/10" />
      <button
        onClick={onDrinkMenu}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-90 transition-all duration-200 ease-out hover:bg-slate-200/50 dark:hover:bg-white/10 group"
      >
        <LayoutGrid size={16} className="text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
        <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
          {t('home.menu')}
        </span>
      </button>
    </div>
  );
});

export default UtilityRow;