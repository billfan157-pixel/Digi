import { Home, BarChart2, Trophy, Rss, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'home' | 'insight' | 'league' | 'feed' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabIcons: Record<TabType, any> = {
  home: Home,
  insight: BarChart2,
  league: Trophy,
  feed: Rss,
  profile: User,
};

const tabLabel: Record<TabType, string> = {
  home: 'Nhà',
  insight: 'Coach',
  league: 'BXH',
  feed: 'Tin',
  profile: 'Hồ sơ',
};

/* ── Gradient hues cho mỗi tab ── */
const tabGlow: Record<TabType, string> = {
  home: 'from-cyan-400 to-teal-400',
  insight: 'from-violet-400 to-fuchsia-400',
  league: 'from-amber-400 to-orange-400',
  feed: 'from-rose-400 to-pink-400',
  profile: 'from-blue-400 to-indigo-400',
};

const BottomNav = (props: BottomNavProps) => {
  const { activeTab, setActiveTab } = props;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="absolute bottom-0 left-0 right-0 px-4 pt-8 pointer-events-none"
    >
      {/* Gradient line phía trên navbar */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

      <div
        role="tablist"
        className="relative flex items-center justify-between rounded-[1.75rem] px-1.5 py-1.5 mx-auto max-w-sm pointer-events-auto
                   bg-slate-900/70 backdrop-blur-2xl saturate-[1.8]
                   border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        {Object.keys(tabIcons).map((key) => {
          const id = key as TabType;
          const Icon = tabIcons[id];
          const isActive = activeTab === id;
          const glow = tabGlow[id];

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
              aria-label={tabLabel[id]}
              className="relative flex flex-col items-center justify-center w-[3.25rem] h-14 rounded-2xl transition-all duration-200 group"
            >
              {/* Active indicator pill - gradient + glow */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${glow} shadow-lg`}
                  style={{
                    boxShadow: `0 0 20px -2px var(--tw-shadow-color)`,
                    // @ts-ignore
                    '--tw-shadow-color': 'rgba(34,211,238,0.25)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 28,
                    mass: 0.8,
                  }}
                />
              )}

              {/* Inner highlight cho active pill */}
              {isActive && (
                <motion.div
                  className="absolute inset-[2px] rounded-[calc(1rem-2px)] bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Icon */}
              <Icon
                size={isActive ? 20 : 18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`relative z-10 transition-all duration-200 ${
                  isActive
                    ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />

              {/* Label - chỉ hiện full opacity khi active */}
              <motion.span
                className={`relative z-10 mt-0.5 text-[8px] font-black leading-none tracking-tight ${
                  isActive ? 'text-white' : 'text-slate-600'
                }`}
                animate={{
                  opacity: isActive ? 1 : 0.5,
                  y: isActive ? 0 : 1,
                }}
                transition={{ duration: 0.15 }}
              >
                {tabLabel[id]}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;