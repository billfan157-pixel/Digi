import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

export interface WeeklyHistoryPoint {
  d: string;
  ml: number;
  isToday: boolean;
}

interface WeeklyChartProps {
  weeklyChartData: WeeklyHistoryPoint[];
  waterGoal: number;
  selectedWeekDay: { d: string; ml: number } | null;
  onSelectDay: (day: { d: string; ml: number }) => void;
  previousWeekData?: WeeklyHistoryPoint[];
}

export default function WeeklyChart({
  weeklyChartData,
  waterGoal,
  selectedWeekDay,
  onSelectDay,
}: WeeklyChartProps) {
  // --- SCALING LOGIC ---
  const maxVal = useMemo(() => {
    const highestInWeek = Math.max(...weeklyChartData.map(d => d.ml), 0);
    return Math.max(waterGoal * 1.25, highestInWeek * 1.1, 1000);
  }, [weeklyChartData, waterGoal]);

  const goalTopPct = useMemo(() => {
    return 100 - (waterGoal / maxVal) * 100;
  }, [waterGoal, maxVal]);

  return (
    <div className="glass-card-strong relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 shadow-2xl">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 p-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
             <h3 className="text-sm font-black text-white uppercase tracking-widest">Hiệu suất tuần</h3>
           </div>
           <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tight">Mục tiêu: {waterGoal}ml</span>
           </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-56 mt-4">
          {/* Goal Line */}
          <div 
            className="absolute left-0 w-full flex items-center gap-2 z-0 opacity-60 transition-all duration-500"
            style={{ top: `${goalTopPct}%` }}
          >
            <div className="w-full border-t border-dashed border-cyan-500/30"></div>
            <span className="text-[8px] font-black tracking-widest text-cyan-400">
              MỤC TIÊU
            </span>
          </div>

          {/* Bottom Line */}
          <div className="absolute bottom-7 left-0 w-full border-t border-white/5" />

          <div className="relative z-10 flex items-end justify-between h-full gap-3 px-1 pb-7">
            {weeklyChartData.map((day, index) => {
              const ratio = day.ml / maxVal;
              const heightPct = Math.min(ratio * 100, 100);
              const isCompleted = day.ml >= waterGoal;
              const isSelected = selectedWeekDay?.d === day.d;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    onSelectDay({
                      d: day.d,
                      ml: day.ml,
                    })
                  }
                  className="group relative flex flex-1 flex-col items-center justify-end h-full"
                >
                  {/* Floating Tooltip */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                        className="absolute -top-12 z-30 rounded-2xl border border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                      >
                        <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-black">
                          {day.d}
                        </p>
                        <p className="mt-1 text-sm font-black text-white whitespace-nowrap">
                          {day.ml.toLocaleString('vi-VN')} ml
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bar Area */}
                  <div className="relative flex items-end justify-center w-full h-full">
                    {/* Today marker */}
                    {day.isToday && (
                      <div
                        className="absolute bottom-0 w-10 rounded-full bg-cyan-400/10"
                        style={{
                          height: `${heightPct}%`,
                        }}
                      />
                    )}

                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${heightPct}%`, opacity: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
                      className={`
                        relative w-full max-w-[28px]
                        rounded-full
                        transition-colors duration-200
                        ${
                          day.isToday
                            ? 'bg-gradient-to-t from-cyan-600 via-sky-400 to-cyan-200'
                            : isCompleted
                            ? 'bg-gradient-to-t from-cyan-900 to-cyan-500'
                            : 'bg-gradient-to-t from-slate-800 to-slate-700'
                        }
                        ${isSelected ? 'ring-2 ring-cyan-300/70' : 'group-active:opacity-80'}
                      `}
                    >
                      {/* Shine */}
                      <div className="absolute inset-x-0 top-1 mx-auto h-[25%] w-[65%] rounded-full bg-white/25 blur-sm" />
                      {/* Today dot */}
                      {day.isToday && (
                        <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300" />
                      )}
                    </motion.div>
                  </div>

                  {/* Label */}
                  <div className="absolute -bottom-7">
                    <span
                      className={`text-[11px] font-black tracking-tight transition-colors ${
                        day.isToday ? 'text-cyan-300' : 'text-meta'
                      } ${isSelected ? 'text-white' : ''}`}
                    >
                      {day.d}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
