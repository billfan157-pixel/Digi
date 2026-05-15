import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Info, Check } from 'lucide-react';

interface CalendarCell {
  dayNum: number | null;
  ml: number;
  isFuture: boolean;
  isToday: boolean;
  isEmptySlot: boolean;
  fullDate: string;
}

interface CalendarViewProps {
  calendarCells: CalendarCell[];
  currentMonthName: string;
  waterGoal: number;
  selectedCell: {
    dayNum: number;
    ml: number;
    fullDate: string;
  } | null;
  onSelectCell: (
    cell: {
      dayNum: number;
      ml: number;
      fullDate: string;
    }
  ) => void;
  onDayClick: (dateStr: string, totalMl: number) => void;
}

// ── Memo'd CalendarCell ─────────────────────────────────---
const CalendarCell = React.memo(function CalendarCell({
  cell,
  waterGoal,
  index,
  isSelected,
  onSelectCell,
  onDayClick,
}: {
  cell: CalendarCell;
  waterGoal: number;
  index: number;
  isSelected: boolean;
  onSelectCell: CalendarViewProps['onSelectCell'];
  onDayClick: CalendarViewProps['onDayClick'];
}) {
  if (cell.isEmptySlot) {
    return <div className="aspect-square" />;
  }

  const pct = (cell.ml / (waterGoal || 1)) * 100;
  const isCompleted = cell.ml >= waterGoal;
  const isPartial = cell.ml > 0 && !isCompleted;
  const isHalf = pct >= 50;

  // Determine Cell Background based on completion (Intuitive Color Coding)
  let cellStyle = 'bg-slate-800/30 border-white/5';
  let textStyle = 'text-slate-400';

  if (!cell.isFuture) {
    if (isCompleted) {
      cellStyle = 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-cyan-300/50 shadow-[0_0_15px_rgba(34,211,238,0.25)]';
      textStyle = 'text-white';
    } else if (isHalf) {
      cellStyle = 'bg-cyan-900/60 border-cyan-500/30';
      textStyle = 'text-cyan-100';
    } else if (isPartial) {
      cellStyle = 'bg-cyan-950/40 border-cyan-900/30';
      textStyle = 'text-cyan-400/80';
    }
  } else {
    cellStyle = 'bg-white/[0.02] border-transparent opacity-30';
    textStyle = 'text-slate-600';
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.005 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        if (!cell.isFuture && !cell.isEmptySlot && cell.fullDate) {
          onSelectCell({ dayNum: cell.dayNum || 0, ml: cell.ml, fullDate: cell.fullDate });
          onDayClick(cell.fullDate, cell.ml);
        }
      }}
      className={`
        relative aspect-square rounded-[14px] flex flex-col items-center justify-center
        transition-all duration-300 border
        ${cellStyle}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-20 scale-105' : ''}
        ${cell.isToday && !isSelected && !isCompleted ? 'ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}
      `}
    >
      {/* Visual Feedback for Completion */}
      {isCompleted && (
        <div className="absolute top-1 right-1 opacity-60">
            <Check size={8} strokeWidth={4} className="text-white" />
        </div>
      )}

      {/* Day Number */}
      <span className={`text-xs font-black tracking-tight ${textStyle}`}>
        {cell.dayNum}
      </span>

      {/* Today indicator label (Very subtle) */}
      {cell.isToday && (
         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_white]" />
      )}
    </motion.button>
  );
});

export default function CalendarView({
  calendarCells,
  waterGoal,
  selectedCell,
  onSelectCell,
  onDayClick,
}: CalendarViewProps) {

  const completedDays = useMemo(() => {
    return calendarCells.filter(
      (c) => !c.isFuture && !c.isEmptySlot && c.ml >= waterGoal
    ).length;
  }, [calendarCells, waterGoal]);

  const consistency = useMemo(() => {
    const validDays = calendarCells.filter((c) => !c.isFuture && !c.isEmptySlot);
    return validDays.length ? Math.round((completedDays / validDays.length) * 100) : 0;
  }, [calendarCells, completedDays]);

  return (
    <div className="space-y-6">
        {/* Main Calendar Card */}
        <div className="glass-card-strong p-5 rounded-[32px] border border-white/10 bg-slate-900/40 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {/* Ambient background glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            {/* Week Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <div key={d} className="text-center text-[10px] font-black tracking-widest text-slate-500 uppercase">
                {d}
                </div>
            ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, index) => (
                <CalendarCell
                    key={cell.isEmptySlot ? `empty-${index}` : `day-${cell.dayNum}`}
                    cell={cell}
                    waterGoal={waterGoal}
                    index={index}
                    isSelected={selectedCell?.fullDate === cell.fullDate}
                    onSelectCell={onSelectCell}
                    onDayClick={onDayClick}
                />
            ))}
            </div>

            {/* Intuitive Legend */}
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-cyan-400 to-cyan-600" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Đạt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-cyan-900/60" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">{'>'}50%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Ít</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                    <Info size={10} />
                    <span className="text-[8px] font-bold uppercase tracking-tighter">Bấm ngày để xem chi tiết</span>
                </div>
            </div>
        </div>

        {/* Selected Day Detail (If active) */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass-card p-5 rounded-[24px] border border-cyan-500/20 bg-slate-900/60 relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày {selectedCell.dayNum}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{selectedCell.ml.toLocaleString('vi-VN')} <span className="text-sm text-slate-500 font-bold">ml</span></p>
                  </div>
                  
                  <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          selectedCell.ml >= waterGoal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                          {selectedCell.ml >= waterGoal ? 'Hoàn thành' : 'Chưa đạt'}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                          Tiến độ: {Math.round((selectedCell.ml / waterGoal) * 100)}%
                      </p>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Card */}
        <div className="glass-card p-4 flex items-center justify-between border border-white/5 bg-slate-900/30">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-cyan-400" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Hiệu suất tháng</p>
                    <p className="text-lg font-black text-white">{consistency}%</p>
                </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Đã đạt</p>
                <p className="text-lg font-black text-cyan-400 text-center">{completedDays} <span className="text-xs text-slate-500">ngày</span></p>
            </div>
        </div>
    </div>
  );
}