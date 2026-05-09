import React from 'react';
import { motion } from 'framer-motion';
import BasicTodayRingUpgraded from '../../components/BasicTodayRingUpgraded';
import type { WaterLog } from '../../models';

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
}: OverviewSectionProps) {
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
      <div className="px-6 mb-3">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-xl font-black tracking-tight text-white"
        >
          {greeting}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-1 text-xs text-slate-400 leading-relaxed"
        >
          {primaryStory}
        </motion.p>
      </div>

      <div className="mt-2 mb-4">
        <BasicTodayRingUpgraded 
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          streak={streak}
          completionRate={completionRate}
          yesterdayIntake={yesterdayIntake}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-6 mt-3 relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-4 shadow-lg group"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 ${nextBestAction.bg.replace('/20', '/10')} blur-3xl rounded-full pointer-events-none transition-colors duration-500`} />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${nextBestAction.bg} flex items-center justify-center shrink-0 border border-white/5 shadow-inner`}>
              <nextBestAction.icon size={22} className={nextBestAction.color} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${nextBestAction.color} mb-0.5`}>
                {nextBestAction.title}
              </p>
              <p className="text-sm font-semibold text-white leading-snug truncate">
                {nextBestAction.action}
              </p>
            </div>

            {nextBestAction.ml > 0 && (
              <button
                onClick={() => actions?.handleAddWater?.(nextBestAction.ml, 1, 'Nước đề xuất')}
                className={`shrink-0 px-4 py-3 bg-white text-slate-950 text-xs font-black rounded-xl active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)]`}>
                +{nextBestAction.ml}ml
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}