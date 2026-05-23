import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ScheduleManager from '../ScheduleManager';
import type { HydrationSchedule } from '@/lib/HydrationEngine';
import type { CalendarEventItem } from '@/hooks/useCalendarSync';
import type { WaterLog } from '@/models';

interface ScheduleDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Record<string, unknown> | null;
  aiSchedule: HydrationSchedule[] | null;
  waterGoal: number;
  waterEntries: WaterLog[];
  calendarEvents: CalendarEventItem[];
  selectedDay: 'today' | 'tomorrow';
  setSelectedDay: (day: 'today' | 'tomorrow') => void;
  onSave: () => void;
}

export default function ScheduleDrawerModal({
  isOpen,
  onClose,
  profile,
  aiSchedule,
  waterGoal,
  waterEntries,
  calendarEvents,
  selectedDay,
  setSelectedDay,
  onSave,
}: ScheduleDrawerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 120) {
                onClose();
              }
            }}
            className="relative w-full max-h-[85vh] bg-slate-900 border-t border-cyan-500/20 rounded-t-3xl p-5 pb-8 z-10 shadow-2xl flex flex-col focus:outline-none"
          >
            {/* Drag Handle Bar */}
            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h3 className="text-base font-black text-white tracking-tight leading-none">
                  Lịch trình uống nước
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-none">
                  Thiết lập mốc nhắc nhở uống nước trong ngày
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Day Switcher inside Modal */}
            <div className="flex p-0.5 bg-slate-950/60 rounded-xl mb-4 border border-white/5 mx-1">
              <button
                onClick={() => setSelectedDay('today')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDay === 'today'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setSelectedDay('tomorrow')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDay === 'tomorrow'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Ngày mai
              </button>
            </div>

            {/* ScheduleManager Wrapper */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-1 pb-4">
              <ScheduleManager
                profile={profile}
                alwaysExpanded={true}
                aiSchedule={aiSchedule}
                waterGoal={waterGoal}
                dateKey={selectedDay}
                waterEntries={waterEntries}
                calendarEvents={calendarEvents}
                onSave={onSave}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
