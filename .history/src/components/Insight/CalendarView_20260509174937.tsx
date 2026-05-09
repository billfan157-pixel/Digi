import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Sparkles, CalendarDays, TrendingUp } from 'lucide-react';

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
  const isCompleted = pct >= 100;
  const isHalf = pct >= 50;

  let cellClass = 'bg-slate-800/30 border border-slate-700/20';

  if (cell.isFuture) {
    cellClass = 'bg-white/[0.03] border border-white/[0.03] opacity-30';
  } else if (isCompleted) {
    cellClass = 'bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.35)]';
  } else if (isHalf) {
    cellClass = 'bg-gradient-to-br from-cyan-900 to-cyan-700 border border-cyan-500/20';
  } else if (pct > 0) {
    cellClass = 'bg-cyan-950 border border-cyan-900/40';
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 14,
        delay: index * 0.01,
      }}
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        if (!cell.isFuture && !cell.isEmptySlot && cell.fullDate) {
          onSelectCell({ dayNum: cell.dayNum || 0, ml: cell.ml, fullDate: cell.fullDate });
          onDayClick(cell.fullDate, cell.ml);
        }
      }}
      className={`
        relative aspect-square overflow-hidden rounded-xl
        transition-all duration-300
        ${cellClass}
        ${isSelected ? 'ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-slate-950 scale-[1.05]' : ''}
        ${!cell.isFuture ? 'cursor-pointer' : ''}
      `}
    >
      {isCompleted && (
        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute inset-0 bg-cyan-200/10"
        />
      )}
      {cell.isToday && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-xl border border-cyan-300"
        />
      )}
      <div className="absolute top-1 left-1.5 z-10">
        <span className={`text-[10px] font-black ${cell.isToday ? 'text-white' : isCompleted ? 'text-cyan-950' : 'text-slate-300'}`}>
          {cell.dayNum}
        </span>
      </div>
      {!cell.isFuture && isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Droplets size={13} className="text-cyan-950 drop-shadow-sm" />
        </motion.div>
      )}
      {cell.isToday && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
        </div>
      )}
    </motion.button>
  );
});

export default function CalendarView({
  calendarCells,
  currentMonthName,
  waterGoal,
  selectedCell,
  onSelectCell,
  onDayClick,
}: CalendarViewProps) {

  const completedDays = useMemo(() => {
    return calendarCells.filter(
      (c) =>
        !c.isFuture &&
        !c.isEmptySlot &&
        c.ml >= waterGoal
    ).length;
  }, [calendarCells, waterGoal]);

  const consistency = useMemo(() => {
    const validDays = calendarCells.filter(
      (c) => !c.isFuture && !c.isEmptySlot
    );

    if (!validDays.length) return 0;

    return Math.round(
      (completedDays / validDays.length) * 100
    );
  }, [calendarCells, completedDays]);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="relative mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/55 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >

      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 p-5">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-black">
              MONTHLY OVERVIEW
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {currentMonthName}
            </h2>

            <p className="mt-1 text-sm text-slate-400 leading-relaxed">
              Theo dõi consistency hydration theo từng ngày.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300 font-black">
              CONSISTENCY
            </p>

            <p className="mt-1 text-lg font-black text-white">
              {consistency}%
            </p>

            <p className="text-[9px] text-cyan-100/60">
              hiệu suất
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-3 gap-2 mb-6">

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center gap-1 text-cyan-400">
              <Droplets size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Goal
              </span>
            </div>

            <p className="text-lg font-black text-white">
              {completedDays}
            </p>

            <p className="text-[10px] text-slate-500">
              ngày đạt
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center gap-1 text-emerald-400">
              <TrendingUp size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Trend
              </span>
            </div>

            <p className="text-lg font-black text-white">
              {consistency >= 70 ? 'Ổn' : consistency >= 40 ? 'TB' : 'Thấp'}
            </p>

            <p className="text-[10px] text-slate-500">
              consistency
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center gap-1 text-orange-400">
              <Sparkles size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Status
              </span>
            </div>

            <p className="text-lg font-black text-white">
              {completedDays >= 15 ? '🔥' : completedDays >= 8 ? '💧' : '🌱'}
            </p>

            <p className="text-[10px] text-slate-500">
              hydration
            </p>
          </div>
        </div>

        {/* Week Labels */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-black tracking-wide text-slate-500"
            >
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

        {/* Legend */}
        <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">

          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-cyan-950 border border-cyan-900/40" />
            <span>Ít</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-cyan-700" />
            <span>Ổn</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]" />
            <span>Đạt</span>
          </div>
        </div>

        {/* Selected Detail */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 15,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 16,
              }}
              className="mt-6 overflow-hidden rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.06]"
            >
              <div className="flex items-start gap-3 p-4">

                <div className="mt-0.5 rounded-xl border border-cyan-500/10 bg-cyan-500/10 p-2">
                  <CalendarDays
                    size={16}
                    className="text-cyan-300"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    Selected Day
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {selectedCell.ml.toLocaleString('vi-VN')} ml
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Ngày {selectedCell.dayNum}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}