import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';

interface CoachHeroProps {
  greeting: string;
  primaryStory: string;
  nextBestAction: {
    title: string;
    action: string;
    ml: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
  };
  onClickAction?: () => void;
  aiAdvice: string;
  isAiLoading: boolean;
  fetchAiAdvice: () => void;
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

const CoachHero: React.FC<CoachHeroProps> = ({ greeting, primaryStory, nextBestAction, onClickAction, aiAdvice, isAiLoading, fetchAiAdvice, isPremium, setShowPremiumModal }) => {
  const Icon = nextBestAction.icon;

  return (
    <div className="px-5 mb-5">
      {/* 1. Refined Coach Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center relative z-10 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
            <Cpu size={24} className="text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
            
            {/* Elegant Scan Effect */}
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1], top: ['-10%', '110%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-6 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent z-20"
            />
          </div>

          {/* Soft Outer Glow */}
          <div className="absolute -inset-4 bg-indigo-500/10 blur-[30px] rounded-full -z-0" />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-black text-white tracking-tight drop-shadow-sm">{greeting}</h2>
          <p className="text-[11px] font-medium text-slate-400 leading-normal mt-0.5">
            {primaryStory}
          </p>
        </div>
      </div>

      {/* 2. AI Morning Briefing Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden glass-card p-4 mb-4"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Cpu size={80} />
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Cpu size={16} className={isAiLoading ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                <Sparkles size={8} /> DigiCoach Insight
              </h4>
              <button 
                onClick={() => isPremium ? fetchAiAdvice() : setShowPremiumModal(true)}
                className="p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={10} className={isAiLoading ? 'animate-spin text-slate-400' : 'text-slate-400'} />
              </button>
            </div>
            
            {isAiLoading ? (
              <div className="space-y-1.5 py-1">
                <div className="h-2 w-full bg-white/5 rounded-full animate-pulse" />
                <div className="h-2 w-4/5 bg-white/5 rounded-full animate-pulse" />
              </div>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {aiAdvice || "Chào đệ, tao đang chuẩn bị báo cáo sức khỏe cho đệ..."}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Premium Action Card (Minimalist Glass) */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClickAction}
        className="w-full text-left relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl group transition-all duration-500"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl ${nextBestAction.bg} bg-opacity-10 flex items-center justify-center border border-white/5`}>
                <Icon size={20} className={nextBestAction.color} />
             </div>
             <div>
               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Khuyến nghị hiện tại</p>
               <h3 className="text-sm font-black text-white tracking-tight mt-0.5">{nextBestAction.title}</h3>
             </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all">
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 relative z-10">
           <p className="text-xs font-medium text-slate-300 leading-relaxed flex gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
              {nextBestAction.action}
           </p>
        </div>

        {nextBestAction.ml > 0 && (
          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
              />
            </div>
            <span className="text-[10px] font-black text-cyan-400 tracking-widest">+{nextBestAction.ml}ML</span>
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default CoachHero;
