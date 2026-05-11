import React, { useMemo } from 'react';
import { Cpu, Activity, CloudSun, Calendar, Wifi, ChevronRight, RefreshCw } from 'lucide-react';
import ScheduleManager from '../../components/ScheduleManager';
import { useAppStore } from '../../store/useAppStore';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import type { HydrationSchedule } from '../../lib/HydrationEngine';

interface SystemSectionProps {
  profile: any;
  isPremium: boolean;
  isWatchConnected: boolean;
  isWeatherSynced: boolean;
  isCalendarSynced: boolean;
}

export default function SystemSection({
  profile,
  isPremium,
  isWatchConnected,
  isWeatherSynced,
  isCalendarSynced,
}: SystemSectionProps) {
  // Lấy lịch đề xuất từ AI & mục tiêu nước
  const hydrationResult = useAppStore(s => s.hydrationResult);
  const waterGoal = useAppStore(s => s.waterGoal);
  const aiSchedule: HydrationSchedule[] | null = hydrationResult?.schedule ?? null;

  // Calendar — dùng state từ hook (real-time), không dùng prop (stale sau OAuth reload)
  const { calendarEvents, syncCalendar, isCalendarSynced: calendarSynced } = useCalendarSync();

  const hasAnySyncSource = isWatchConnected || isWeatherSynced || calendarSynced || isCalendarSynced;

  // Lọc events hôm nay
  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return calendarEvents.filter(ev => ev.startRaw.startsWith(today));
  }, [calendarEvents]);

  const handleCalendarSync = async () => {
    await syncCalendar({ startOAuthIfNeeded: true });
  };

  return (
    <div className="space-y-6 mt-2">
      {/* Calendar Events Section */}
      <div className="px-6">
        {/* Connect button when not synced */}
        {!calendarSynced && (
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

        {/* Events today */}
        {calendarSynced && (
          <div className="mb-4">
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
                {todayEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/40">
                    <div className="w-[3px] h-[3px] rounded-full bg-violet-400 shrink-0" />
                    <span className="flex-1 text-xs text-slate-300 truncate">{event.title}</span>
                    <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                      {event.start} - {event.end}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 px-1">Không có sự kiện nào hôm nay.</p>
            )}
          </div>
        )}

        <ScheduleManager
          profile={profile}
          alwaysExpanded={true}
          aiSchedule={aiSchedule}
          waterGoal={waterGoal}
          calendarEvents={calendarSynced ? calendarEvents : []}
        />
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" /> DigiWell Intelligence
          </h3>
          {!isPremium && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_#f59e0b]">Upgrade</span>}
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold text-sm">Trạng thái đồng bộ</h4>
            <p className="text-slate-400 text-xs mt-0.5">HealthKit, Thiết bị, Lịch trình</p>
          </div>
          <div className="flex -space-x-2">
            {isWatchConnected && <div className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-slate-950 flex items-center justify-center"><Activity size={12} className="text-rose-400"/></div>}
            {isWeatherSynced && <div className="w-8 h-8 rounded-full bg-sky-500/20 border-2 border-slate-950 flex items-center justify-center"><CloudSun size={12} className="text-sky-400"/></div>}
            {(isCalendarSynced || calendarSynced) && <div className="w-8 h-8 rounded-full bg-violet-500/20 border-2 border-slate-950 flex items-center justify-center"><Calendar size={12} className="text-violet-400"/></div>}
            {!hasAnySyncSource && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/5">
                <Wifi size={14} className="text-slate-600 animate-pulse" />
                <span className="text-xs font-medium text-slate-500">Chưa kết nối nguồn nào</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
