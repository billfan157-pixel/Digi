import { Droplet, Settings, Plus } from 'lucide-react';
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
    <div className="px-6 mb-5">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 shadow-sm group">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
               <Droplet size={12} className="text-cyan-400" />
             </div>
             <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
               {t('home.quick_add')}
             </span>
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
        <button
          onClick={onEditQuickAmounts}
          className="text-slate-500 hover:text-white transition-colors active:scale-95 p-1 rounded-md hover:bg-white/5"
        >
          <Settings size={14} />
        </button>
      </div>
      
      <div className="flex gap-2.5">
        {quickAmounts.map((amount, index) => (
          <button
            onClick={onEditQuickAmounts}
            className="text-slate-500 hover:text-white transition-colors active:scale-95 p-1"
            key={`qa-${amount}-${index}`}
            onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
            className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 rounded-2xl py-4 px-2 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 active:scale-95 shadow-sm"
          >
            <Settings size={14} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
            
            <Droplet size={32} className="absolute text-cyan-500/5 group-hover:text-cyan-500/10 group-hover:scale-125 transition-all duration-500" fill="currentColor" />
            
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-sm">{amount}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-cyan-500/70 transition-colors">ml</span>
              </div>
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full">
          {quickAmounts.map((amount, index) => {
            const sizeClasses = index === 0 ? 'w-2 h-2' : index === 1 ? 'w-3 h-3' : 'w-4 h-4';
            
            return (
              <button
                key={`qa-${amount}-${index}`}
                onClick={() => handleAddWater(amount, 1, t('home.pure_water'))}
                className="flex-1 relative overflow-hidden bg-slate-800/40 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-[1.25rem] py-3.5 px-2 flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group/btn"
              >
                <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                
                <div className="h-6 flex items-center justify-center mb-1">
                  <div className={`rounded-full bg-cyan-500/20 border border-cyan-500/40 ${sizeClasses} group-hover/btn:bg-cyan-400 group-hover/btn:shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-300`} />
                </div>
                
                <div className="flex items-baseline gap-0.5 relative z-10">
                  <span className="text-white font-black text-base">{amount}</span>
                  <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">ml</span>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                  <Plus size={10} className="text-cyan-400" />
                </div>
              </button>
            );
          })}
        </div>
        ))}
      </div>
    </div>
  );
});

export default QuickAddSection;