import { Home, BarChart2, Swords, Rss, User } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { impact } from '@/lib/haptics';

export type TabType = 'home' | 'insight' | 'league' | 'feed' | 'profile' | 'bottle' | 'arena';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const BottomNav = (props: BottomNavProps) => {
  const { t } = useTranslation();
  const navItems: { id: TabType; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string }[] = [
    { id: 'home', icon: Home, label: t('common.home', 'Trang chủ') },
    { id: 'insight', icon: BarChart2, label: t('common.insight', 'Phân tích') },
    { id: 'league', icon: Swords, label: t('common.arena', 'Đấu trường') },
    { id: 'feed', icon: Rss, label: t('common.feed', 'Bảng tin') },
    { id: 'profile', icon: User, label: t('common.profile', 'Hồ sơ') },
  ];

  return (
    <nav aria-label={t('common.main_navigation')} className="absolute bottom-0 left-0 right-0 px-4 pt-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none pb-[calc(env(safe-area-inset-bottom,1.5rem)+2.5rem)]">
      <div role="tablist" className="glass-nav flex items-center justify-between rounded-[2rem] px-2 py-2 mx-auto max-w-md pointer-events-auto relative">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = props.activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => { impact('light'); props.setActiveTab(id); }}
              aria-label={label}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-colors duration-200 group z-10"
            >
              {/* Cục sáng trượt theo tab (Liquid effect) */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 active-treatment rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 2}
                className={`transition-colors duration-200 ${isActive ? 'text-cyan-300' : 'text-meta group-hover:text-slate-300'}`}
              />

              <span
                className={`mt-1 text-[9px] font-black leading-none transition-colors duration-200 ${isActive ? 'text-cyan-300' : 'text-meta'
                  }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;