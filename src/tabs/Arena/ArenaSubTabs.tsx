import { Swords, Trophy, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type ArenaTabType = 'arena' | 'leaderboard' | 'history';

interface ArenaSubTabsProps {
  activeTab: ArenaTabType;
  onTabChange: (tab: ArenaTabType) => void;
}

export default function ArenaSubTabs({ activeTab, onTabChange }: ArenaSubTabsProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'arena' as ArenaTabType, label: t('battle.arena', 'Đấu Trường'), icon: Swords },
    { id: 'leaderboard' as ArenaTabType, label: t('league.ranking', 'Xếp Hạng'), icon: Trophy },
    { id: 'history' as ArenaTabType, label: t('club.battle_history', 'Lịch Sử'), icon: History },
  ];

  return (
    <div className="px-5 mb-6">
      <div className="relative flex p-1 shadow-sm border border-white/5 bg-slate-950/20 rounded-2xl backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all relative ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="arenaSubTabPill"
                  className="absolute inset-0 rounded-xl bg-slate-800/60 border border-white/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] font-black">
                <Icon size={12} className={isActive ? 'text-rose-400' : 'text-slate-500'} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
