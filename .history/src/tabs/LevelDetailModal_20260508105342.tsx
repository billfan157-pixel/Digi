import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Activity, Trophy, Zap, Shield, Crown } from 'lucide-react';
import { expRequiredForLevel, totalExpForLevel } from '../config/questConfig';

interface LevelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  exp: number;
}

const milestones = [
  { level: 5, reward: "Trạng thái Silver Member", icon: <Shield size={16} /> },
  { level: 10, reward: "Mở khóa Phân tích Chuyên sâu", icon: <Activity size={16} /> },
  { level: 15, reward: "Trạng thái Gold Member", icon: <Trophy size={16} /> },
  { level: 25, reward: "+1,000 Wellness Points", icon: <Zap size={16} /> },
  { level: 30, reward: "Trạng thái Platinum Member", icon: <Crown size={16} /> },
  { level: 50, reward: "Tính năng Nhóm hỗ trợ", icon: <ShieldCheck size={16} /> },
];

function getRankTitle(level: number): string {
  if (level >= 100) return "VVIP Member";
  if (level >= 70) return "Diamond Member";
  if (level >= 50) return "Platinum Member";
  if (level >= 30) return "Gold Member";
  if (level >= 15) return "Silver Member";
  return "Standard Member";
}

export default function LevelDetailModal({ isOpen, onClose, level, exp }: LevelDetailModalProps) {
  const { progress, remainingExp, nextLevelExp, rankTitle, safeLevel } = useMemo(() => {
    const safeLevel = Math.max(level, 1);
    const currentLevelExp = totalExpForLevel(safeLevel);
    const progressInLevel = exp - currentLevelExp;
    const progressInLevel = exp - totalExpForLevel(safeLevel);
    const requiredExpForLevel = expRequiredForLevel(safeLevel);
    const progress = requiredExpForLevel > 0 ? Math.min(100, (progressInLevel / requiredExpForLevel) * 100) : 0;
    const nextLevelExp = totalExpForLevel(safeLevel + 1);
    const remainingExp = Math.max(0, nextLevelExp - exp);
    const rankTitle = getRankTitle(safeLevel);
    return { progress, remainingExp, nextLevelExp, rankTitle, safeLevel };
  }, [level, exp]);

  const upcomingMilestones = useMemo(() => {
    return milestones.filter(m => m.level > safeLevel).slice(0, 3);
  }, [safeLevel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="level-detail-overlay" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-7 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute -top-1/4 left-0 w-full h-1/2 bg-cyan-500/10 blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-black text-xl">Wellness Tier</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Current Level & Rank */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <ShieldCheck size={28} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">{rankTitle}</h3>
                  <p className="text-slate-400 text-xs">Cấp độ {safeLevel}</p>
                </div>
              </div>

              {/* Progress Bar & EXP */}
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tiến độ lên Cấp {safeLevel + 1}</span>
                  <span className="text-cyan-400 font-bold">{progress.toFixed(1)}%</span>
                </div>
                <div className="relative h-2 w-full bg-slate-800/50 border border-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">{exp.toLocaleString()} PTS</span>
                  <span className="text-slate-500">{nextLevelExp.toLocaleString()} PTS</span>
                </div>
                <p className="text-center text-cyan-400 text-xs font-semibold pt-2">
                  Cần thêm {remainingExp.toLocaleString()} PTS để lên hạng!
                </p>
              </div>

              {/* Upcoming Milestones */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đặc quyền tiếp theo</h4>
                {upcomingMilestones.length > 0 ? (
                  upcomingMilestones.map(milestone => (
                    <div key={milestone.level} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-white/5 rounded-xl">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {milestone.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Cấp {milestone.level}</p>
                        <p className="text-xs text-slate-400">{milestone.reward}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 bg-slate-800/50 border border-white/5 rounded-xl text-slate-500 text-sm">
                    Bạn đã đạt được tất cả đặc quyền!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}