import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, RefreshCw } from 'lucide-react';
import BasicTodayRingUpgraded from '../../components/BasicTodayRingUpgraded';
import WellnessDashboard from '../../components/Wellness/WellnessDashboard';
import CoachHero from './CoachHero';
import type { HydrationSchedule } from '../../lib/HydrationEngine';

interface OverviewSectionProps {
  profile?: { id?: string } | null;
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
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    bg: string;
  };
  actions?: {
    handleAddWater?: (amount: number, type: number, name: string) => void;
  };
  schedule?: HydrationSchedule[] | null;
  aiAdvice: string;
  isAiLoading: boolean;
  fetchAIAdvice: () => void;
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
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
  aiAdvice,
  isAiLoading,
  fetchAIAdvice,
  isPremium,
  setShowPremiumModal,
}: OverviewSectionProps) {
  const handleHeroClick = () => {
    if (nextBestAction.ml > 0 && actions?.handleAddWater) {
      actions.handleAddWater(nextBestAction.ml, 0, 'Gợi ý AI');
    }
  };
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
      <CoachHero
        greeting={greeting}
        primaryStory={primaryStory}
        nextBestAction={nextBestAction}
        onClickAction={handleHeroClick}
      />

      <div className="px-6 mb-3 mt-4 space-y-4">

        {/* AI Morning Briefing Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden glass-card p-5 border border-cyan-500/20 bg-slate-900/60"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Cpu size={120} />
           </div>
           
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <Cpu size={20} className={isAiLoading ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                    <Sparkles size={10} /> DigiCoach Insight
                  </h4>
                  <button 
                    onClick={() => isPremium ? fetchAIAdvice() : setShowPremiumModal(true)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw size={12} className={isAiLoading ? 'animate-spin text-slate-400' : 'text-slate-400'} />
                  </button>
                </div>
                
                {isAiLoading ? (
                  <div className="space-y-2">
                    <div className="h-2.5 w-full bg-white/5 rounded-full animate-pulse" />
                    <div className="h-2.5 w-4/5 bg-white/5 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {aiAdvice || "Chào đệ, tao đang chuẩn bị báo cáo sức khỏe cho đệ..."}
                  </p>
                )}
              </div>
           </div>
        </motion.div>
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

     </>
   );
}