import { Coins, ScrollText, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import CountUp from '@/components/CountUp';

interface GamificationBarProps {
  wp: number;
  coins: number;
  onShopClick: () => void;
  onBattleClick: () => void;
  onQuestClick: () => void;
}

const GamificationBar = React.memo(function GamificationBar({ wp, coins, onShopClick, onBattleClick, onQuestClick }: GamificationBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 mb-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Zap size={14} className="text-emerald-500 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
            <CountUp value={wp} />
          </span>
        </div>
        <button onClick={onShopClick} className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95">
          <Coins size={14} className="text-amber-500 dark:text-amber-400" />
          <span className="text-amber-600 dark:text-amber-400 font-black text-xs">
            <CountUp value={coins} />
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBattleClick}
          className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all font-bold text-xs"
        >
          ⚔️ {t('home.battle')}
        </button>
        <button
          onClick={onQuestClick}
          className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all font-bold text-xs"
        >
          <ScrollText size={14} /> {t('home.quest')}
        </button>
      </div>
    </div>
  );
});

export default GamificationBar;