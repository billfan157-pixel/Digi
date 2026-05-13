import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, Zap, ChevronRight } from 'lucide-react';

interface CoachHeroProps {
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
}

const CoachHero: React.FC<CoachHeroProps> = ({ greeting, primaryStory, nextBestAction }) => {
  const Icon = nextBestAction.icon;

  return (
    <div className="px-5 mb-10">
      {/* 1. Refined Coach Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
            <Cpu size={32} className="text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
            
            {/* Elegant Scan Effect */}
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1], top: ['-10%', '110%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent z-20"
            />
          </div>

          {/* Soft Outer Glow */}
          <div className="absolute -inset-6 bg-indigo-500/10 blur-[40px] rounded-full -z-0" />
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 drop-shadow-sm">{greeting}</h2>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[240px]">
            {primaryStory}
          </p>
        </div>
      </div>

      {/* 2. Premium Action Card (Minimalist Glass) */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        className="w-full text-left relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl group transition-all duration-500"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl ${nextBestAction.bg} bg-opacity-10 flex items-center justify-center border border-white/5`}>
                <Icon size={24} className={nextBestAction.color} />
             </div>
             <div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Khuyến nghị hiện tại</p>
               <h3 className="text-lg font-black text-white tracking-tight mt-0.5">{nextBestAction.title}</h3>
             </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all">
            <ChevronRight size={20} />
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 relative z-10">
           <p className="text-[13px] font-medium text-slate-300 leading-relaxed flex gap-3">
              <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
              {nextBestAction.action}
           </p>
        </div>

        {nextBestAction.ml > 0 && (
          <div className="mt-6 flex items-center gap-4 px-1">
            <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
              />
            </div>
            <span className="text-[11px] font-black text-cyan-400 tracking-widest">+{nextBestAction.ml}ML</span>
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default CoachHero;
