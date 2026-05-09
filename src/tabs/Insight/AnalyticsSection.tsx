import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarView from '../../components/insight/CalendarView';
import HourlyHeatmap from '../../components/HourlyHeatmap';
import AdvancedStatsGrid from '../AdvancedStatsGrid';
import WeeklyChart from '../../components/WeeklyChart';

interface AnalyticsSectionProps {
  timeRange: 'week' | 'month';
  setTimeRange: (range: 'week' | 'month') => void;
  calendarDate: Date;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  calendarCells: any[];
  currentMonthName: string;
  waterGoal: number;
  weeklyChartData: any[];
  previousWeekData: any;
  selectedWeekDay: any;
  setSelectedWeekDay: (day: any) => void;
  selectedCalendarCell: any;
  setSelectedCalendarCell: (cell: any) => void;
  handleDayClick: (dateStr: string, totalMl: number) => void;
  monthlyTotal: number;
  stats: { avg: number; completed: number };
  profile: any;
  weeklyTotal: number;
}

export default function AnalyticsSection({
  timeRange,
  setTimeRange,
  calendarDate,
  handlePrevMonth,
  handleNextMonth,
  calendarCells,
  currentMonthName,
  waterGoal,
  weeklyChartData,
  previousWeekData,
  selectedWeekDay,
  setSelectedWeekDay,
  selectedCalendarCell,
  setSelectedCalendarCell,
  handleDayClick,
  monthlyTotal,
  stats,
  profile,
  weeklyTotal,
}: AnalyticsSectionProps) {
  return (
    <div className="mb-6 mt-2">
      <div className="px-6 flex justify-between items-center mb-4">
        <h3 className="text-base font-black text-white tracking-tight">Hành trình & Thói quen</h3>
        <div className="glass-control relative flex p-1 shadow-sm">
          {(['week', 'month'] as const).map((t) => {
            const isActive = timeRange === t;
            return (
              <button 
                key={t}
                onClick={() => setTimeRange(t)}
                className={`relative px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 z-10 ${isActive ? 'text-cyan-200' : 'text-meta hover:text-slate-200'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="timeRangeIndicator"
                    className="absolute inset-0 active-treatment rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                {t === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            );
          })}
        </div>
      </div>
      
      {timeRange === 'month' && (
        <div className="px-6 flex justify-between mb-2">
          <button onClick={handlePrevMonth} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-meta hover:text-cyan-400 active:scale-95 transition-transform">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNextMonth} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-meta hover:text-cyan-400 active:scale-95 transition-transform">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="px-6">
        <AnimatePresence mode="wait">
          {timeRange === 'week' ? (
            <motion.div
              key="week-chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <WeeklyChart 
                weeklyChartData={weeklyChartData}
                waterGoal={waterGoal}
                selectedWeekDay={selectedWeekDay}
                onSelectDay={setSelectedWeekDay}
                previousWeekData={previousWeekData}
              />
            </motion.div>
          ) : (
            <motion.div
              key="month-chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CalendarView 
                calendarCells={calendarCells}
                currentMonthName={currentMonthName}
                waterGoal={waterGoal}
                selectedCell={selectedCalendarCell}
                onSelectCell={setSelectedCalendarCell}
                onDayClick={handleDayClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 mb-8 space-y-5">
        <AdvancedStatsGrid 
          weeklyTotal={weeklyTotal}
          monthlyTotal={monthlyTotal}
          stats={stats}
          weeklyChartData={weeklyChartData}
          profile={profile}
        />
        <HourlyHeatmap userId={profile?.id} />
      </div>
    </div>
  );
}
