import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Swords, Shield } from 'lucide-react';

export type CompeteSubTabType = 'battles' | 'clubs';

interface CompeteSubTabsProps {
  activeTab: CompeteSubTabType;
  onTabChange: (tab: CompeteSubTabType) => void;
}

const TABS: { id: CompeteSubTabType; labelKey: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'battles', labelKey: 'compete.battles', icon: Swords },
  { id: 'clubs', labelKey: 'compete.clubs', icon: Shield },
];

const CompeteSubTabs = React.memo(function CompeteSubTabs({ activeTab, onTabChange }: CompeteSubTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="px-5 mb-4">
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800/50 border border-white/5 backdrop-blur-sm">
        {TABS.map(({ id, labelKey, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="competePill"
                  className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/30 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default CompeteSubTabs;
