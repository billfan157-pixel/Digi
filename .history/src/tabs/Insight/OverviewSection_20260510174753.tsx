import React from 'react';
import { motion } from 'framer-motion';
import BasicTodayRingUpgraded from '../../components/BasicTodayRingUpgraded';
import WellnessDashboard from '../../components/Wellness/WellnessDashboard';
import HydrationTimeline from '../../components/HydrationTimeline';
import type { WaterLog } from '../../models';
import type { HydrationSchedule } from '../../lib/HydrationEngine';

interface OverviewSectionProps {
  profile?: any;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  completionRate: number;
  yesterdayIntake: number;
  greeting: string;
  primaryStory: string;
  nextBestAction: {
    title: string;
    action: string;
    ml: number;
    icon: any;
    color: string;
    bg: string;
  };
  actions?: {
    handleAddWater?: (amount: number, type: number, name: string) => void;
  };
  schedule?: HydrationSchedule[] | null;
}

export default function OverviewSection({
  profile,
  waterIntake,
  waterGoal,
  streak,
  completionRate,
  yesterdayIntake,
  greeting,
  primaryStory,
  nextBestAction,
  actions,
  schedule,
}: OverviewSectionProps) {
  // Pass profile from props, not from hook's internal store
  // This ensures the component uses the same profile reference
  const wellnessData = {}; // Placeholder - hook internally reads from store

  if (waterGoal === 0) {
    return (
      <div className="px-6 py-12">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/5">
          <h3 className="text-lg font-black text-white mb-2">Chưa thiết lập mục tiêu</h3>
          <p className="text-slate-400 text-sm">
            Cập nhật thông tin cá nhân để AI tính toán lượng nước phù hợp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 mb-3 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-black tracking-tight text-white"
        >
          {greeting}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-1 text-xs text-slate-400 leading-relaxed"
        >
          {primaryStory}
        </motion.p>
      </div>

      {/* Wellness Dashboard - new multipurpose health overview */}
      {profile && <WellnessDashboard />}

      <div className="mt-4 mb-4">
        <BasicTodayRingUpgraded
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          streak={streak}
          completionRate={completionRate}
          yesterdayIntake={yesterdayIntake}
        />
       </div>

       {/* Schedule timeline — đồng bộ từ HydrationEngine */}
       {schedule && schedule.length > 0 && (
         <div className="px-6">
           <HydrationTimeline schedule={schedule} />
         </div>
       )}
     </>
   );
}