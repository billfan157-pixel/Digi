import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Swords, Shield } from 'lucide-react';
import { glassControl, activeTabClass } from '@/styles/glass';

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
      <div className={glassControl}>
        {TABS.map(({ id, labelKey, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="competePill"
                  className={activeTabClass}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={14} className={`relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="relative z-10">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default CompeteSubTabs;
