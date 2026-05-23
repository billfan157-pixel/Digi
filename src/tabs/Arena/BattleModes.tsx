import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Clock, Zap, Trophy, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { glassControl } from '../../styles/glass';

interface BattleModesProps {
  selectedMode: 'daily' | 'quick' | 'tournament' | null;
  setSelectedMode: (mode: 'daily' | 'quick' | 'tournament' | null) => void;
}

const BattleModes: React.FC<BattleModesProps> = ({ selectedMode, setSelectedMode }) => {
  const { t } = useTranslation();
  const modes = [
    { id: 'daily' as const, icon: Clock, label: 'Hằng ngày', desc: '24h', wager: '50-200', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'quick' as const, icon: Zap, label: 'Tức thời', desc: '1h', wager: '10-100', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'tournament' as const, icon: Trophy, label: 'Giải đấu', desc: '7 ngày', wager: '100-500', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="px-5 mb-8">
      <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
        <Target size={20} className="text-cyan-400" /> Chọn chế độ
      </h3>
      <div className={`${glassControl} rounded-[2.5rem] p-2 flex gap-2 shadow-2xl`}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => {
              setSelectedMode(m.id);
              toast.info(t('battle.use_home_button'), { 
                icon: <Zap size={16} className="text-cyan-400" />,
                className: "bg-slate-900 border border-white/10 text-white rounded-2xl"
              });
              setTimeout(() => setSelectedMode(null), 1000);
            }}
            className={`flex-1 py-4 rounded-3xl flex flex-col items-center gap-2 transition-all duration-300 relative overflow-hidden group ${
              selectedMode === m.id 
                ? 'bg-white/10 border border-white/20 shadow-xl scale-[1.02]' 
                : 'hover:bg-white/5 border border-transparent active:scale-95'
            }`}
          >
            {selectedMode === m.id && (
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
            )}
            
            <div className={`w-10 h-10 rounded-2xl ${m.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
              <m.icon size={20} className={`${m.color} ${selectedMode === m.id ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
            </div>

            <div className="text-center relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${selectedMode === m.id ? 'text-white' : 'text-slate-400'}`}>
                {m.label}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold text-slate-500">
                <Coins size={10} className="text-amber-500/70" />
                <span>{m.wager}</span>
              </div>
            </div>
            
            {selectedMode === m.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BattleModes;
