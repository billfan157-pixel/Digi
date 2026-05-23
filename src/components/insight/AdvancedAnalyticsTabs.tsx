import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Flame } from 'lucide-react';
import { glassCard } from '../../styles/glass';
import TrendForecastingChart from '../../components/TrendForecastingChart';
import { WeekOverWeekCard } from './WeekOverWeekCard';
import { StreakAnalyticsCard } from './StreakAnalyticsCard';

type TabType = 'trend' | 'wow' | 'streak';

interface AdvancedAnalyticsTabsProps {
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean }>;
  previousWeekData: Array<{ d: string; ml: number }> | null;
  waterGoal: number;
  currentStreak: number;
}

const tabs = [
  { id: 'trend' as TabType, label: 'Xu hướng', icon: TrendingUp },
  { id: 'wow' as TabType, label: 'So sánh tuần', icon: BarChart3 },
  { id: 'streak' as TabType, label: 'Chuỗi ngày', icon: Flame },
];

export default function AdvancedAnalyticsTabs({
  weeklyChartData,
  previousWeekData,
  waterGoal,
  currentStreak,
}: AdvancedAnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trend');

  return (
    <div className={`${glassCard} p-5`}>
      {/* Tab Header */}
      <div className="glass-control relative flex p-1 mb-4 shadow-sm border border-white/5 bg-slate-900/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 z-10 ${
                isActive ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="advancedAnalyticsTabIndicator"
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/25 -z-10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'trend' && (
          <motion.div
            key="trend"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TrendForecastingChart weeklyChartData={weeklyChartData} waterGoal={waterGoal} />
          </motion.div>
        )}
        {activeTab === 'wow' && (
          <motion.div
            key="wow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <WeekOverWeekCard
              currentWeek={weeklyChartData}
              previousWeek={previousWeekData || []}
              waterGoal={waterGoal}
            />
          </motion.div>
        )}
        {activeTab === 'streak' && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StreakAnalyticsCard
              weeklyData={weeklyChartData}
              waterGoal={waterGoal}
              currentStreak={currentStreak}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
