import React from 'react';
import { Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BattleCard from './BattleCard';
import type { Battle, Profile } from '../../models';

interface ActiveBattlesProps {
  battles: Battle[];
  profile: Profile | null;
  now: number;
  onSelectBattle: (battle: Battle) => void;
}

const ActiveBattles: React.FC<ActiveBattlesProps> = ({ battles, profile, now, onSelectBattle }) => {
  const { t } = useTranslation();
  if (battles.length === 0) {
    return (
      <div className="px-5 mb-8">
        <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
          <div className="relative">
            <Swords size={20} className="text-slate-500" />
          </div>
          {t('common.in_progress') || 'Trận Đấu Đang Diễn Ra'}
        </h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-center flex flex-col items-center gap-3 relative overflow-hidden backdrop-blur-md">
          {/* Ambient glow */}
          <div className="absolute -right-10 -bottom-10 w-24 h-24 blur-[40px] rounded-full bg-rose-500/10 pointer-events-none" />
          
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <Swords size={22} className="opacity-40" />
          </div>
          
          <div className="space-y-1">
            <p className="text-white font-bold text-sm">Không có trận nào đang diễn ra</p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto">
              Hãy chọn một chế độ chơi ở trên hoặc thách đấu để bắt đầu cuộc chiến giữ nước!
            </p>
          </div>
          
          <button 
            onClick={() => {
              // Smooth scroll to the mode selection header
              const element = document.querySelector('.px-5.mb-8 h3');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="mt-1 px-4 py-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-white/10 transition-all flex items-center gap-1.5"
          >
            Bắt đầu đấu ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 mb-8">
      <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
        <div className="relative">
          <Swords size={20} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
        </div>
        {t('common.in_progress')}
      </h3>
      <div className="space-y-4">
        {battles.map((battle, index) => (
          <BattleCard
            key={battle.id || `active-battle-${index}`}
            battle={battle}
            profile={profile}
            now={now}
            onClick={() => onSelectBattle(battle)}
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveBattles;
