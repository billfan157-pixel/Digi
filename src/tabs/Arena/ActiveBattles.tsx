import React from 'react';
import { Swords } from 'lucide-react';
import BattleCard from './BattleCard';
import type { Battle, Profile } from '../../models';

interface ActiveBattlesProps {
  battles: Battle[];
  profile: Profile | null;
  now: number;
  onSelectBattle: (battle: Battle) => void;
}

const ActiveBattles: React.FC<ActiveBattlesProps> = ({ battles, profile, now, onSelectBattle }) => {
  if (battles.length === 0) return null;

  return (
    <div className="px-5 mb-8">
      <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
        <div className="relative">
          <Swords size={20} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
        </div>
        Đang diễn ra
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
