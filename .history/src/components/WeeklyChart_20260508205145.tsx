import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, TrendingUp, Sparkles, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  previousWeekData,
}: WeeklyChartProps) {
  const weeklyAverage = useMemo(() => {
    if (!weeklyChartData.length) return 0;

    return Math.round(
      weeklyChartData.reduce((sum, day) => sum + day.ml, 0) /
        weeklyChartData.length
    );
  }, [weeklyChartData]);

  const completedDays = useMemo(() => {
    return weeklyChartData.filter((d) => d.ml >= waterGoal).length;
  }, [weeklyChartData, waterGoal]);

  const bestDay = useMemo(() => {
    return [...weeklyChartData].sort((a, b) => b.ml - a.ml)[0];
  }, [weeklyChartData]);

  // --- COMPARATIVE ANALYSIS ---
  const comparisonData = useMemo(() => {
    if (!previousWeekData || previousWeekData.length === 0) {
      return { trend: 'neutral', percentChange: 0, avgThisWeek: weeklyAverage, avgLastWeek: 0 };
    }
    
    const lastWeekAvg = Math.round(
      previousWeekData.reduce((sum, d) => sum + d.ml, 0) / previousWeekData.length
    );
    
    const diff = weeklyAverage - lastWeekAvg;
    const percentChange = lastWeekAvg > 0 ? Math.round((diff / lastWeekAvg) * 100) : 0;
    
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (percentChange > 5) trend = 'up';
    else if (percentChange < -5) trend = 'down';
    
    return { trend, percentChange: Math.abs(percentChange), avgThisWeek: weeklyAverage, avgLastWeek: lastWeekAvg };
  }, [weeklyChartData, previousWeekData, weeklyAverage]);

  return (
    <div className="relative mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/55 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 p-5">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
<p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-black">
               PHÂN TÍCH NHIỆT
             </p>

            <h3 className="mt-2 text-xl font-black text-white tracking-tight">
              Hiệu suất tuần
            </h3>

            <p className="mt-1 text-sm text-slate-400 leading-relaxed">
              Theo dõi độ ổn định hydration mỗi ngày.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-right">
<p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300 font-black">
               TRUNG BÌNH
             </p>

            <p className="mt-1 text-lg font-black text-white">
              {weeklyAverage.toLocaleString('vi-VN')}
            </p>

            <p className="text-[9px] text-cyan-100/60">
              ml / ngày
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-3 gap-2 mb-7">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1 text-cyan-400 mb-1">
              <Sparkles size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Goal
              </span>
            </div>

            <p className="text-lg font-black text-white">
              {completedDays}
            </p>

            <p className="text-[10px] text-slate-500">
              ngày đạt mục tiêu
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
<div className="flex items-center gap-1 text-emerald-400 mb-1">
                   <TrendingUp size={12} />
                   <span className="text-[9px] font-black uppercase tracking-wider">
                     TỐT NHẤT
                   </span>
                 </div>

            <p className="text-lg font-black text-white">
              {bestDay?.d || '--'}
            </p>

            <p className="text-[10px] text-slate-500">
              ngày tốt nhất
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
<div className="flex items-center gap-1 text-orange-400 mb-1">
                   <Droplets size={12} />
                   <span className="text-[9px] font-black uppercase tracking-wider">
                     ĐỈNH
                   </span>
                 </div>

            <p className="text-lg font-black text-white">
              {bestDay?.ml
                ? `${Math.round(bestDay.ml / 1000)}L`
                : '--'}
            </p>

<p className="text-[10px] text-slate-500">
               cao nhất
             </p>
           </div>
           
           {/* Comparative Analysis */}
           {previousWeekData && previousWeekData.length > 0 && (
             <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 col-span-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1 text-cyan-400 mb-1">
                   <BarChart3 size={12} />
                   <span className="text-[9px] font-black uppercase tracking-wider">
                     SO SÁNH TUẦN
                   </span>
                 </div>
                 <div className={`flex items-center gap-1 text-[10px] font-bold ${
                   comparisonData.trend === 'up' ? 'text-emerald-400' : 
                   comparisonData.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                 }`}>
                   {comparisonData.trend === 'up' && <ArrowUpRight size={12} />}
                   {comparisonData.trend === 'down' && <ArrowDownRight size={12} />}
                   <span>{comparisonData.percentChange}%</span>
                 </div>
               </div>
               <p className="text-[10px] text-slate-500 mt-1">
                 {comparisonData.avgLastWeek.toLocaleString('vi-VN')} → {comparisonData.avgThisWeek.toLocaleString('vi-VN')} ml/ngày
               </p>
             </div>
           )}
         </div>

        {/* Chart */}
        <div className="relative h-60">

          {/* Goal Line */}
          <div className="absolute top-[12%] left-0 w-full flex items-center gap-2 z-0 opacity-60">
            <div className="w-full border-t border-dashed border-cyan-500/30"></div>

            <span className="text-[8px] font-black tracking-widest text-cyan-400">
              GOAL
            </span>
          </div>

          {/* Bottom Line */}
          <div className="absolute bottom-7 left-0 w-full border-t border-white/5" />

          <div className="relative z-10 flex items-end justify-between h-full gap-3 px-1 pb-7">

            {weeklyChartData.map((day, index) => {
              const ratio = day.ml / (waterGoal || 1);
              const heightPct = Math.min(ratio * 100, 100);

              const isCompleted = ratio >= 1;
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
                        transition={{
                          type: 'spring',
                          stiffness: 180,
                          damping: 16,
                        }}
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

                    {/* Glow */}
                    {day.isToday && (
                      <motion.div
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.08, 1],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                        }}
                        className="absolute bottom-0 w-10 rounded-full bg-cyan-400/20 blur-xl"
                        style={{
                          height: `${heightPct}%`,
                        }}
                      />
                    )}

                    {/* Bar */}
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: `${heightPct}%`,
                        opacity: 1,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 90,
                        damping: 18,
                        delay: index * 0.05,
                      }}
                      className={`
                        relative w-full max-w-[28px]
                        rounded-full
                        transition-all duration-300
                        ${
                          day.isToday
                            ? 'bg-gradient-to-t from-cyan-600 via-sky-400 to-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.45)]'
                            : isCompleted
                            ? 'bg-gradient-to-t from-cyan-900 to-cyan-500'
                            : 'bg-gradient-to-t from-slate-800 to-slate-700'
                        }
                        ${
                          isSelected
                            ? 'scale-110 brightness-110'
                            : 'group-active:scale-95'
                        }
                      `}
                    >
                      
                      {/* Shine */}
                      <div className="absolute inset-x-0 top-1 mx-auto h-[25%] w-[65%] rounded-full bg-white/25 blur-sm" />

                      {/* Today Pulse */}
                      {day.isToday && (
                        <motion.div
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                          }}
                          className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]"
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Label */}
                  <div className="absolute -bottom-7">
                    <span
                      className={`
                        text-[11px]
                        font-black
                        tracking-tight
                        transition-all
                        ${
                          day.isToday
                            ? 'text-cyan-300'
                            : 'text-slate-500'
                        }
                        ${
                          isSelected
                            ? 'text-white'
                            : ''
                        }
                      `}
                    >
                      {day.d}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Insight */}
        <motion.div
          layout
          className="mt-6 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.06] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-cyan-500/10 p-2 border border-cyan-500/10">
              <Droplets size={16} className="text-cyan-300" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                Weekly Insight
              </p>

              <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                {completedDays >= 5
                  ? 'Hydration consistency của bạn đang rất tốt tuần này.'
                  : completedDays >= 3
                  ? 'Bạn đang xây dựng thói quen khá ổn định. Cố duy trì thêm.'
                  : 'Hãy cố gắng duy trì hydration đều hơn giữa các ngày.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}