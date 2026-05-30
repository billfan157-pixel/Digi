import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Activity, Trophy, Zap, Shield, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { expRequiredForLevel, totalExpForLevel } from '../config/questConfig';

interface LevelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  exp: number;
}

const milestones = [
  { level: 5, reward: "Newcomer Badge", icon: <Shield size={16} /> },
  { level: 10, reward: "Unlock Advanced Analytics", icon: <Activity size={16} /> },
  { level: 15, reward: "Consistency Badge", icon: <Trophy size={16} /> },
  { level: 25, reward: "+1,000 Wellness Points", icon: <Zap size={16} /> },
  { level: 30, reward: "Optimizer Badge", icon: <Crown size={16} /> },
  { level: 50, reward: "Group Support Feature", icon: <ShieldCheck size={16} /> },
];

function getRankTitle(level: number): string {
  if (level >= 100) return "Perfect";
  if (level >= 70) return "Elite";
  if (level >= 50) return "Excellent";
  if (level >= 30) return "Optimizer";
  if (level >= 15) return "Consistent";
  return "Starter";
}

export default function LevelDetailModal({ isOpen, onClose, level, exp }: LevelDetailModalProps) {
  const { t } = useTranslation();
  const { progress, remainingExp, nextLevelExp, rankTitle, safeLevel } = useMemo(() => {
    const safeLevel = Math.max(level, 1);
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
                <h2 className="text-white font-black text-xl">Chi tiết Cấp độ</h2>
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
                  <p className="text-slate-400 text-xs">{t('common.level')} {safeLevel}</p>
                </div>
              </div>

              {/* Progress Bar & EXP */}
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">{t('common.progress')} {t('common.level')} {safeLevel + 1}</span>
                  <span className="text-cyan-400 font-bold">{progress.toFixed(1)}%</span>
                </div>
                <div className="relative h-2 w-full bg-slate-800/50 border border-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">{exp.toLocaleString()} PTS</span>
                  <span className="text-slate-500">{nextLevelExp.toLocaleString()} PTS</span>
                </div>
                <p className="text-center text-cyan-400 text-xs font-semibold pt-2">
                  Need {remainingExp.toLocaleString()} more PTS to rank up!
                </p>
              </div>

              {/* Upcoming Milestones */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next Privilege</h4>
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