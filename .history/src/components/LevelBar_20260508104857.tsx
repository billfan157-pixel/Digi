import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Activity, Star, Sparkles } from "lucide-react";
import { expRequiredForLevel, totalExpForLevel } from "../config/questConfig";

interface LevelBarProps {
  level: number;
  exp: number; // This is actually total_exp now
  onDetailClick?: () => void;
}

function getRankTitle(level: number) {
  if (level >= 100) return "VVIP Member";
  if (level >= 70) return "Diamond Member";
  if (level >= 50) return "Platinum Member";
  if (level >= 30) return "Gold Member";
  if (level >= 15) return "Silver Member";
  return "Standard Member";
}

const LevelBar = ({
  level,
  exp,
  onDetailClick,
}: LevelBarProps) => {
  const { progress, remainingExp, nextLevelExp, rankTitle, safeLevel } = useMemo(() => {
    const safeLevel = Math.max(level, 1);
    const expForCurrentLevelStart = totalExpForLevel(safeLevel);
    const progressInLevel = Math.max(0, exp - expForCurrentLevelStart);
    const requiredExpForLevel = expRequiredForLevel(safeLevel);
    const progress = requiredExpForLevel > 0 ? Math.min(100, (progressInLevel / requiredExpForLevel) * 100) : 0;
    const nextLevelTotalExp = totalExpForLevel(safeLevel + 1);
    const remainingExp = Math.max(0, nextLevelTotalExp - exp);
    const rankTitle = getRankTitle(safeLevel);

    return { progress, remainingExp, nextLevelExp: nextLevelTotalExp, rankTitle, safeLevel, progressInLevel, requiredExpForLevel };
  }, [level, exp]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-[2rem] p-5 mb-6 shadow-xl hover:shadow-[0_8px_24px_rgba(6,182,212,0.15)] transition-all">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/8 blur-3xl rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />

      <div className="relative flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/20 hover:ring-orange-400/40 transition-all">
              <span className="text-white font-black text-2xl">
                {safeLevel || 0}
              </span>
            </div>

            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-lg">
              <Star
                size={13}
                className="text-orange-500"
                fill="currentColor"
              />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-white font-bold text-sm opacity-90">
              Cấp độ hiện tại
            </h4>

            <div className="flex items-center gap-2 mt-1">
              <Sparkles size={12} className="text-cyan-400" />
              <span className="text-cyan-400 text-xs font-bold bg-cyan-500/20 px-2 py-1 rounded-lg">
                {rankTitle}
              </span>
            </div>

            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-2 opacity-80">
              {exp.toLocaleString()} / {nextLevelExp.toLocaleString()} EXP
            </p>
          </div>
        </div>
        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 rounded-xl transition-all active:scale-90 border border-cyan-500/30 hover:border-cyan-500/50"
          >
            CHI TIẾT <ChevronRight size={13} />
          </button>
        )}
      </div>

      <div className="flex justify-between text-[11px] mb-2.5 px-0.5">
        <span className="text-slate-400 font-medium">
          Tiến độ
        </span>
        <span className="text-white font-bold">
          {progress.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-3.5 w-full bg-slate-900/50 border border-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
        />
      </div>

      <div className="mt-3.5 flex justify-between items-center text-[11px] px-0.5">
        <span className="text-slate-500 font-medium">
          Level {safeLevel}
        </span>

        <span className="text-amber-400 font-bold bg-amber-500/20 px-2 py-1 rounded-lg">
          +{remainingExp.toLocaleString()} EXP
        </span>
      </div>
    </div>
  );
};

export default React.memo(LevelBar);