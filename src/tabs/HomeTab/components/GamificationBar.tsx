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
    <div className="flex items-center justify-between px-6 mb-6 gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 px-4 py-2.5 rounded-2xl border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all">
          <Zap size={15} className="text-emerald-500 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs tracking-wide">
            <CountUp value={wp} />
          </span>
        </div>
        <button onClick={onShopClick} className="flex items-center gap-2 bg-gradient-to-br from-amber-500/15 to-amber-600/10 px-4 py-2.5 rounded-xl border border-amber-500/25 hover:from-amber-500/20 hover:to-amber-600/15 hover:border-amber-500/35 active:scale-95 transition-all shadow-[0_0_15px_rgba(217,119,6,0.1)] hover:shadow-[0_0_20px_rgba(217,119,6,0.15)] group">
          <Coins size={15} className="text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-amber-600 dark:text-amber-400 font-black text-xs tracking-wide">
            <CountUp value={coins} />
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBattleClick}
          className="flex items-center gap-2 bg-gradient-to-br from-rose-500/15 to-rose-600/10 px-4 py-2.5 rounded-xl border border-rose-500/25 text-rose-600 dark:text-rose-400 hover:from-rose-500/20 hover:to-rose-600/15 hover:border-rose-500/35 active:scale-95 transition-all font-bold text-xs shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] group"
        >
          <span className="group-hover:scale-110 transition-transform">⚔️</span> {t('home.battle')}
        </button>
        <button
          onClick={onQuestClick}
          className="flex items-center gap-2 bg-gradient-to-br from-purple-500/15 to-purple-600/10 px-4 py-2.5 rounded-xl border border-purple-500/25 text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:to-purple-600/15 hover:border-purple-500/35 active:scale-95 transition-all font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group"
        >
          <ScrollText size={15} className="group-hover:scale-110 transition-transform" /> {t('home.quest')}
        </button>
      </div>
    </div>
  );
});

export default GamificationBar;