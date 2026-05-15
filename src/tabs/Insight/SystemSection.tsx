import React, { useMemo } from 'react';
import { Cpu, Activity, Calendar, ChevronRight, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScheduleManager from '../../components/ScheduleManager';
import { useAppStore } from '../../store/useAppStore';
import type { HydrationSchedule } from '../../lib/HydrationEngine';
import type { CalendarEventItem } from '../../hooks/useCalendarSync';

interface SystemSectionProps {
  profile: { id?: string } | null;
  isPremium: boolean;
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  handleExportCSV: () => void;
  setShowPremiumModal: (show: boolean) => void;
  calendarEvents: CalendarEventItem[];
  syncCalendar: (options?: { silent?: boolean; startOAuthIfNeeded?: boolean }) => Promise<number | false>;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEventDateKey(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return getLocalDateKey(date);
}

function isEventOnDate(event: CalendarEventItem, dateKey: string) {
  const startKey = getEventDateKey(event.startRaw);
  const endKey = getEventDateKey(event.endRaw);

  if (!startKey) return false;
  if (!event.isAllDay) {
    return startKey <= dateKey && (!endKey || endKey >= dateKey);
  }

  return startKey <= dateKey && (!endKey || endKey > dateKey);
}

function getEventSortTime(event: CalendarEventItem, dateKey: string) {
  if (event.isAllDay) return -1;

  const startKey = getEventDateKey(event.startRaw);
  if (startKey && startKey < dateKey) return 0;

  const rawTime = new Date(event.startRaw).getTime();
  if (!Number.isNaN(rawTime)) return rawTime;

  const [hour, minute] = event.start.split(':').map(Number);
  if (Number.isFinite(hour) && Number.isFinite(minute)) {
    return hour * 60 + minute;
  }

  return Number.MAX_SAFE_INTEGER;
}

function getEventTimeLabel(event: CalendarEventItem, dateKey: string) {
  if (event.isAllDay) return 'Cả ngày';

  const startKey = getEventDateKey(event.startRaw);
  const endKey = getEventDateKey(event.endRaw);
  const start = startKey && startKey < dateKey ? '00:00' : event.start;
  const end = endKey && endKey > dateKey ? 'đến mai' : event.end;

  return `${start} - ${end}`;
}

export default function SystemSection({
  profile,
  isPremium,
  isExportingPDF,
  handleExportPDF,
  handleExportCSV,
  setShowPremiumModal,
  calendarEvents,
  syncCalendar,
}: SystemSectionProps) {
  // Lấy lịch đề xuất từ AI & mục tiêu nước
  const hydrationResult = useAppStore(s => s.hydrationResult);
  const waterGoal = useAppStore(s => s.waterGoal);
  const waterEntries = useAppStore(s => s.waterEntries);
  const aiSchedule: HydrationSchedule[] | null = hydrationResult?.schedule ?? null;

  const isCalendarSynced = calendarEvents.length > 0;

  const todayKey = getLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = getLocalDateKey(tomorrow);

  // Lọc events hôm nay
  const todayEvents = useMemo(() => {
    return calendarEvents
      .filter(ev => isEventOnDate(ev, todayKey))
      .sort((a, b) => getEventSortTime(a, todayKey) - getEventSortTime(b, todayKey));
  }, [calendarEvents, todayKey]);

  // Lọc events ngày mai
  const tomorrowEvents = useMemo(() => {
    return calendarEvents
      .filter(ev => isEventOnDate(ev, tomorrowKey))
      .sort((a, b) => getEventSortTime(a, tomorrowKey) - getEventSortTime(b, tomorrowKey));
  }, [calendarEvents, tomorrowKey]);

  const [selectedDay, setSelectedDay] = React.useState<'today' | 'tomorrow'>('today');
  const [isTomorrowExpanded, setIsTomorrowExpanded] = React.useState(false);

  const handleCalendarSync = async () => {
    await syncCalendar({ startOAuthIfNeeded: true });
  };

  return (
    <div className="space-y-6 mt-2">
      {/* Calendar Events Section */}
      <div className="px-6">
        {/* Connect button when not synced */}
        {!isCalendarSynced && (
          <button
            onClick={handleCalendarSync}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-white flex items-center justify-between hover:from-violet-500/20 hover:to-purple-500/20 transition-all active:scale-[0.98] mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Calendar size={20} className="text-violet-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Kết nối Google Calendar</p>
                <p className="text-[10px] text-slate-400">Tự động điều chỉnh lịch uống nước theo cuộc họp</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-violet-400" />
          </button>
        )}

        {/* Events list */}
        {isCalendarSynced && (
          <div className="space-y-4 mb-4">
            {/* Hôm nay */}
            <div>
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Cpu size={120} />
              </div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-cyan-400" />
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Lịch hôm nay
                  </h3>
                </div>
                <button
                  onClick={handleCalendarSync}
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <RefreshCw size={10} />
                  Đồng bộ
                </button>
              </div>

              {todayEvents.length > 0 ? (
                <div className="space-y-[1px] bg-white/[0.04] rounded-xl overflow-hidden">
                  {todayEvents.slice(0, 8).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/40">
                      <div className="w-[3px] h-[3px] rounded-full bg-violet-400 shrink-0" />
                      <span className="flex-1 text-xs text-slate-300 truncate">{event.title}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                        {getEventTimeLabel(event, todayKey)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 px-1">Không có sự kiện nào hôm nay.</p>
              )}
            </div>

            {/* Ngày mai Toggle */}
            {tomorrowEvents.length > 0 && (
              <div>
                <button
                  onClick={() => setIsTomorrowExpanded(!isTomorrowExpanded)}
                  className="w-full flex items-center justify-between mb-2.5 p-2 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 transition-colors border border-purple-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-purple-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Lịch ngày mai
                    </h3>
                  </div>
                  {isTomorrowExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>
                
                <AnimatePresence>
                  {isTomorrowExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-[1px] bg-white/[0.04] rounded-xl overflow-hidden border border-purple-500/10">
                        {tomorrowEvents.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/40">
                            <div className="w-[3px] h-[3px] rounded-full bg-purple-400 shrink-0" />
                            <span className="flex-1 text-xs text-slate-400 truncate">{event.title}</span>
                            <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                              {getEventTimeLabel(event, tomorrowKey)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Day Switcher for Schedule */}
        <div className="flex p-1 bg-slate-900/60 rounded-xl mb-4 border border-white/5">
          <button
            onClick={() => setSelectedDay('today')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedDay === 'today'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedDay === 'tomorrow'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Ngày mai
          </button>
        </div>

        <ScheduleManager
          profile={profile}
          alwaysExpanded={true}
          aiSchedule={aiSchedule}
          waterGoal={waterGoal}
          dateKey={selectedDay}
          waterEntries={waterEntries}
          calendarEvents={isCalendarSynced ? (selectedDay === 'today' ? todayEvents : tomorrowEvents) : []}
        />
      </div>

      {/* Reporting & Exports */}
      <div className="px-6 space-y-4 pb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Báo cáo & Dữ liệu</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => isPremium ? handleExportPDF() : setShowPremiumModal(true)}
            disabled={isExportingPDF}
            className="glass-card p-4 flex flex-col items-center gap-3 group hover:bg-slate-800/60 transition-all disabled:opacity-50 border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              {isExportingPDF ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold text-[11px] uppercase tracking-tight">Xuất PDF</h4>
              <p className="text-slate-500 text-[8px] uppercase mt-1 font-black">Báo cáo Y khoa</p>
            </div>
          </button>

          <button 
            onClick={() => isPremium ? handleExportCSV() : setShowPremiumModal(true)}
            className="glass-card p-4 flex flex-col items-center gap-3 group hover:bg-slate-800/60 transition-all border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw size={18} />
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold text-[11px] uppercase tracking-tight">Xuất CSV</h4>
              <p className="text-slate-500 text-[8px] uppercase mt-1 font-black">Dữ liệu thô</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
