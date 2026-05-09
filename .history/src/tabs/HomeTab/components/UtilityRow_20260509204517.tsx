rimport { LayoutGrid, Clock, Droplets, CloudOff } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

interface UtilityRowProps {
  onHistory: () => void;
  onDrinkMenu: () => void;
}

const actions = [
  { key: 'quick_add', icon: Droplets, label: 'Uống nhanh', action: 'drink' as const },
  { key: 'history', icon: Clock, label: 'Lịch sử', action: 'history' as const },
  { key: 'menu', icon: LayoutGrid, label: 'Đồ uống', action: 'menu' as const },
];

const UtilityRow = React.memo(function UtilityRow({ onHistory, onDrinkMenu }: UtilityRowProps) {
  const { t } = useTranslation();
  const hasPendingCloudSync = useAppStore((s) => s.hasPendingCloudSync);

  const handleAction = (action: 'history' | 'menu' | 'drink') => {
    switch (action) {
      case 'history': onHistory(); break;
      case 'menu': onDrinkMenu(); break;
      case 'drink': break; // handled by LiquidProgress tap
    }
  };

  return (
    <div className="flex justify-between items-center glass-control p-1.5 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all mx-6 mb-6">
      {actions.map(({ key, icon: Icon, label, action }) => (
        <React.Fragment key={key}>
          {key !== 'quick_add' && <div className="w-[1px] h-7 bg-white/10 first:hidden" />}
          <button
            onClick={() => handleAction(action)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 rounded-xl active:scale-90 transition-all duration-200 ease-out hover:bg-cyan-500/10 group"
          >
            <Icon size={16} className="text-slate-400 group-hover:text-cyan-400 transition-all group-hover:scale-110" />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
              {label}
            </span>
          </button>
        </React.Fragment>
      ))}

      {hasPendingCloudSync && (
        <div className="ml-2 mr-1 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1">
            <CloudOff size={14} className="text-amber-300" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">
              Chờ đồng bộ
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default UtilityRow;
