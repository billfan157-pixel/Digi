import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { AICoachModal } from '../../components/insight/AICoach';
import { Skeleton } from '../../components/Skeleton';

interface AiCoachSectionProps {
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
  setShowAiChat: (show: boolean) => void;
  isAiLoading: boolean;
  aiAdvice: string;
  fetchAIAdvice: () => void;
  streak: number;
  waterIntake: number;
  waterGoal: number;
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  handleExportCSV: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Làm sao để uống đủ 2L nước mỗi ngày?',
  'Tại sao da tôi vẫn khô mặc dù uống nhiều nước?',
  'Nên uống nước lúc nào trong ngày?',
  'Liệu tôi có đang uống quá nhiều nước?',
];

export default function AiCoachSection({
  isPremium,
  setShowPremiumModal,
  setShowAiChat,
  isAiLoading,
  aiAdvice,
  fetchAIAdvice,
  streak,
  waterIntake,
  waterGoal,
  isExportingPDF,
  handleExportPDF,
  handleExportCSV,
}: AiCoachSectionProps) {
  const getStatusText = () => {
    if (waterIntake >= waterGoal) return 'Tối ưu ✅';
    if (waterIntake >= waterGoal * 0.7) return 'Tốt 👌';
    return 'Cần uống 💧';
  };

  return (
    <>
      <div className="px-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-[1px] shadow-lg shadow-indigo-500/5"
        >
          <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-[calc(2rem-1px)] p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-inner">
                <Cpu size={20} className={isAiLoading ? 'animate-spin text-indigo-400' : 'text-indigo-400'} />
                {isAiLoading && <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 animate-ping" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    DigiCoach <span className="text-indigo-400 text-[9px] font-black uppercase tracking-widest bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/20">AI</span>
                  </h3>
                  <button 
                    onClick={() => isPremium ? fetchAIAdvice() : setShowPremiumModal(true)}
                    className="text-slate-500 hover:text-indigo-400 transition-colors p-1.5 bg-white/5 rounded-lg active:scale-95"
                  >
                    <RefreshCw size={14} className={isAiLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                {isAiLoading ? (
                  <div className="space-y-2 mt-3">
                    <Skeleton className="h-3 w-full bg-slate-800" />
                    <Skeleton className="h-3 w-4/5 bg-slate-800" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {aiAdvice || 'Đang tổng hợp dữ liệu sinh học và thói quen của bạn...'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Streak</p>
                <p className="text-white font-black text-lg">{streak} ngày 🔥</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Trạng thái</p>
                <p className="text-white font-black text-lg">{getStatusText()}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Câu hỏi gợi ý</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (isPremium) {
                        setShowAiChat(true);
                      } else {
                        setShowPremiumModal(true);
                      }
                    }}
                    className="text-left px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-slate-300 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => isPremium ? setShowAiChat(true) : setShowPremiumModal(true)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold text-xs uppercase tracking-wider hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
            >
              Mở Chat AI Coach
            </button>
          </div>
        </motion.div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-3 mt-6">
        <button 
          onClick={() => isPremium ? handleExportPDF() : setShowPremiumModal(true)}
          disabled={isExportingPDF}
          className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-3 group cursor-pointer hover:bg-slate-800/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          </div>
          <div>
            <h4 className="text-white font-bold text-xs">Xuất File PDF</h4>
            <p className="text-slate-500 text-[10px] mt-1">Báo cáo Y khoa</p>
          </div>
        </button>

        <button 
          onClick={() => isPremium ? handleExportCSV() : setShowPremiumModal(true)}
          className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-3 group cursor-pointer hover:bg-slate-800/60 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs">Xuất File CSV</h4>
            <p className="text-slate-500 text-[10px] mt-1">Dữ liệu chi tiết</p>
          </div>
        </button>
      </div>

      <AICoachModal />
    </>
  );
}