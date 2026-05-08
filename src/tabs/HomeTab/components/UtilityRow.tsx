import { LayoutGrid, Clock, Settings } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface UtilityRowProps {
  onProfileSettings: () => void;
  onHistory: () => void;
  onDrinkMenu: () => void;
}

const UtilityRow = React.memo(function UtilityRow({ onProfileSettings, onHistory, onDrinkMenu }: UtilityRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-1.5 shadow-lg mx-1 mb-6">
      <button
        onClick={onProfileSettings}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group"
      >
        <Settings size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
          {t('home.settings')}
        </span>
      </button>
      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50" />
      <button
        onClick={onHistory}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group"
      >
        <Clock size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
          {t('home.history')}
        </span>
      </button>
      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50" />
      <button
        onClick={onDrinkMenu}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full active:scale-95 transition-all duration-200 ease-out hover:bg-slate-100 dark:hover:bg-white/5 group"
      >
        <LayoutGrid size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors" />
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
          {t('home.menu')}
        </span>
      </button>
    </div>
  );
});

export default UtilityRow;