import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Activity, Sparkles, ChevronUp } from "lucide-react";
import { expRequiredForLevel, totalExpForLevel, rankFromExpWithProgress, RANKS } from "../config/questConfig";

interface LevelBarProps {
  level: number;
  exp: number; // total_exp
  onDetailClick?: () => void;
}

const LevelBar = ({
  level,
  exp,
  onDetailClick,
}: LevelBarProps) => {
  const { progress, remainingExp, nextLevelExp, rankProgression, safeLevel } = useMemo(() => {
    const safeLevel = Math.max(level, 1);
    const expForCurrentLevelStart = totalExpForLevel(safeLevel);
    const progressInLevel = Math.max(0, exp - expForCurrentLevelStart);
    const requiredExpForLevel = expRequiredForLevel(safeLevel);
    const progress = requiredExpForLevel > 0 ? Math.min(100, (progressInLevel / requiredExpForLevel) * 100) : 0;
    const nextLevelTotalExp = totalExpForLevel(safeLevel + 1);
    const remainingExp = Math.max(0, nextLevelTotalExp - exp);
    const rankProgression = rankFromExpWithProgress(exp);

    return { progress, remainingExp, nextLevelExp: nextLevelTotalExp, rankProgression, safeLevel };
  }, [level, exp]);

  const { current: currentRank, next: nextRank, progress: rankProgress } = rankProgression;

  return (
    <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 mb-6 shadow-sm group hover:bg-slate-800/60 transition-colors">

      <div className="relative flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} className="text-cyan-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 border border-slate-700">
              <span className="flex items-center justify-center w-5 h-5 bg-cyan-500 text-slate-900 text-[10px] font-black rounded-full">
                {safeLevel}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Đẳng cấp
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-white text-base font-black" style={{ color: currentRank.color }}>
                {currentRank.name}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">
                Tier {currentRank.tier} · Lv.{safeLevel}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1 opacity-80 flex items-center gap-1">
              <Activity size={10} /> {exp.toLocaleString()} / {nextLevelExp.toLocaleString()} PTS
            </p>
          </div>
        </div>
        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-white/5 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-xl transition-all"
          >
            CHI TIẾT <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Rank progress bar */}
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-slate-500 font-medium text-[9px] uppercase tracking-widest">
          Rank progress
        </span>
        <span className="text-slate-400 font-bold text-[10px]">
          {rankProgress}%
        </span>
      </div>

      <div className="relative h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 mb-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rankProgress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)]"
          style={{ background: currentRank.color }}
        >
          <div className="absolute top-0 right-0 h-full w-3 bg-white/40 blur-[2px] rounded-full" />
        </motion.div>
      </div>

      {/* Perks row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {currentRank.perks.map((perk: string, i: number) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[8px] font-bold border border-white/10 bg-white/5 text-slate-300">
            {perk}
          </span>
        ))}
      </div>

      {/* Next rank preview */}
      {nextRank && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/30 border border-white/5">
          <Sparkles size={12} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Rank tiếp theo
            </p>
            <p className="text-xs font-black text-slate-300 truncate" style={{ color: nextRank.color }}>
              {nextRank.name}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
              Mở khóa
            </p>
            <p className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">
              {nextRank.perks[0]}
            </p>
          </div>
          <ChevronUp size={12} className="text-slate-600 shrink-0" />
        </div>
      )}

      {/* Level progress bar (smaller) */}
      <div className="flex justify-between text-[10px] mt-3 mb-1.5">
        <span className="text-slate-500 font-medium">
          Tiến độ thăng cấp
        </span>
        <span className="text-cyan-400 font-semibold">
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="relative h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
        >
          <div className="absolute top-0 right-0 h-full w-3 bg-white/60 blur-[2px] rounded-full" />
        </motion.div>
      </div>

      <div className="mt-2 flex justify-between items-center text-[9px] text-slate-500 font-medium">
        <span>
          Level {safeLevel} → {safeLevel + 1}
        </span>
        <span>
          Cần {remainingExp.toLocaleString()} PTS
        </span>
      </div>
    </div>
  );
};

export default React.memo(LevelBar);