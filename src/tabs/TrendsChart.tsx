import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Calendar, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface TrendsChartProps {
  timeRange: 'week' | 'month';
  onTimeRangeChange: (range: 'week' | 'month') => void;
  weeklyChartData: Array<{ d: string; ml: number; isToday: boolean; fullDate: string }>;
  waterGoal: number;
  selectedWeekDay: { d: string; ml: number } | null;
  onSelectDay: (day: { d: string; ml: number } | null) => void;
  calendarCells: Array<{ dayNum: number | null; ml: number; isFuture: boolean; isToday: boolean; isEmptySlot: boolean; fullDate: string }>;
  currentMonthName: string;
  selectedCalendarCell: { dayNum: number; ml: number; fullDate: string } | null;
  onSelectCell: (cell: { dayNum: number | null; ml: number; fullDate: string }) => void;
  onDayClick: (dateStr: string, ml: number) => void;
  isMonthDataLoading: boolean;
  hasAnyInsightData: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({
  timeRange,
  onTimeRangeChange,
  weeklyChartData,
  waterGoal,
  selectedWeekDay,
  onSelectDay,
  calendarCells,
  currentMonthName,
  selectedCalendarCell,
  onSelectCell,
  onDayClick,
  isMonthDataLoading,
  onPrevMonth,
  onNextMonth,
}) => {
  return (
    <div className="px-6">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        {/* Toggle Week/Month */}
        <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-full border border-white/5 mb-6 relative z-10 w-max">
          <button 
            onClick={() => onTimeRangeChange('week')} 
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${timeRange === 'week' ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
          >
            <BarChart2 size={14} /> 7 Ngày
          </button>
          <button 
            onClick={() => onTimeRangeChange('month')} 
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${timeRange === 'month' ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar size={14} /> Tháng này
          </button>
        </div>

        {/* Chart Content */}
        <div className="relative min-h-[220px]">
          <AnimatePresence mode="wait">
            {timeRange === 'week' ? (
              <motion.div 
                key="week-chart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-end justify-between gap-2 h-48"
              >
                {weeklyChartData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <BarChart2 size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Chưa có dữ liệu tuần này</p>
                  </div>
                ) : (
                  weeklyChartData.map((day, i) => {
                    const isSelected = selectedWeekDay?.d === day.d;
                    const fillPct = Math.min((day.ml / (waterGoal || 1)) * 100, 100);
                    const isReached = day.ml >= waterGoal;

                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div 
                          className="relative w-full rounded-full cursor-pointer h-full flex items-end justify-center"
                          onClick={() => {
                            if (isSelected) onSelectDay(null);
                            else onSelectDay(day);
                            if (day.ml >= 0) onDayClick(day.fullDate, day.ml);
                          }}
                        >
                          <div className="w-full bg-slate-800/80 rounded-full h-full border border-white/5 overflow-hidden flex items-end relative">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${fillPct}%` }}
                              transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                              className={`w-full rounded-full transition-colors ${
                                isSelected ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 
                                isReached ? 'bg-emerald-500/80' : 'bg-cyan-500/50 group-hover:bg-cyan-500/70'
                              }`}
                            />
                            {isSelected && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 whitespace-nowrap z-20">
                                {day.ml} ml
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-cyan-400' : isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {day.d}
                        </span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="month-chart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <button onClick={onPrevMonth} className="p-1 text-slate-400 hover:text-white rounded-lg bg-white/5 active:scale-95"><ChevronLeft size={18}/></button>
                  <span className="text-white font-bold text-sm">{currentMonthName}</span>
                  <button onClick={onNextMonth} className="p-1 text-slate-400 hover:text-white rounded-lg bg-white/5 active:scale-95"><ChevronRight size={18}/></button>
                </div>
                
                {isMonthDataLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-500">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarCells.map((cell, i) => {
                        if (cell.isEmptySlot) return <div key={i} className="aspect-square" />;
                        
                        const fillPct = waterGoal > 0 ? Math.min((cell.ml / waterGoal) * 100, 100) : 0;
                        const isReached = cell.ml >= waterGoal;
                        const isSelected = selectedCalendarCell?.dayNum === cell.dayNum;
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => {
                              onSelectCell(cell);
                              if (!cell.isFuture && cell.ml >= 0) onDayClick(cell.fullDate, cell.ml);
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center relative cursor-pointer overflow-hidden border transition-all ${
                              cell.isFuture ? 'opacity-20 border-transparent bg-slate-900/50' : 
                              isSelected ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] scale-110 z-10' : 
                              'border-white/5 bg-slate-800/40 hover:border-white/20 hover:bg-slate-800/80'
                            }`}
                          >
                            {!cell.isFuture && fillPct > 0 && (
                              <div 
                                className={`absolute bottom-0 left-0 right-0 opacity-40 transition-all ${isReached ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
                                style={{ height: `${fillPct}%` }}
                              />
                            )}
                            <span className={`relative z-10 text-[10px] font-bold ${cell.isToday ? 'text-cyan-400' : isReached ? 'text-emerald-400' : cell.isFuture ? 'text-slate-600' : 'text-slate-300'}`}>
                              {cell.dayNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};