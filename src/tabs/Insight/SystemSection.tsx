import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Activity, Calendar, ChevronRight, RefreshCw, ChevronDown, ChevronUp, Target, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScheduleManager from '../../components/ScheduleManager';
import DateRangeExportModal from '../../components/modals/DateRangeExportModal';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../hooks/useSettings';
import type { AppProfile } from '../../services/profile.service';
import type { HydrationSchedule } from '../../lib/HydrationEngine';
import type { CalendarEventItem } from '../../hooks/useCalendarSync';
import { supabase } from '../../lib/supabase';
import { providerTokenStore } from '../../lib/providerTokenStore';

interface SystemSectionProps {
  profile: { id?: string } | null;
  isPremium: boolean;
  isExportingPDF: boolean;
  handleExportPDF: (dateRange?: { start: string; end: string } | null) => void;
  handleExportCSV: (dateRange?: { start: string; end: string } | null) => void;
  handleExportJSON: (dateRange?: { start: string; end: string } | null) => void;
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
  handleExportJSON,
  setShowPremiumModal,
  calendarEvents,
  syncCalendar,
}: SystemSectionProps) {
  const { t } = useTranslation();
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'PDF' | 'CSV' | 'JSON' | null>(null);

  const { settings, updateSettings } = useSettings(profile as AppProfile | null);

  const handleExportClick = (type: 'PDF' | 'CSV' | 'JSON') => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedExportType(type);
    setDateRangeModalOpen(true);
  };

  const handleDateRangeExport = (range: { start: string; end: string } | null) => {
    setDateRangeModalOpen(false);
    
    if (selectedExportType === 'PDF') handleExportPDF(range);
    else if (selectedExportType === 'CSV') handleExportCSV(range);
    else if (selectedExportType === 'JSON') handleExportJSON(range);
  };

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

  const handleDisconnectCalendar = async () => {
    const { confirmDialog } = await import('../../store/useConfirmDialog');
    const ok = await confirmDialog({
      title: 'Ngắt kết nối lịch',
      message: 'Bạn có chắc chắn muốn ngắt kết nối Google Calendar và xoá lịch trình đã đồng bộ?',
      confirmLabel: 'Ngắt kết nối',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      if (profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ google_refresh_token: null })
          .eq('id', profile.id);
        if (error) {
          console.error('Lỗi khi xoá token trên server:', error);
        }

        // Update public_profiles.is_calendar_synced to false
        const { error: syncError } = await supabase
          .from('public_profiles')
          .update({ is_calendar_synced: false })
          .eq('id', profile.id);
        if (syncError) {
          console.error('Lỗi khi cập nhật is_calendar_synced:', syncError);
        }
      }

      providerTokenStore.clear();

      localStorage.removeItem('digiwell_calendar_events_cache');
      localStorage.removeItem('digiwell_calendar_synced_flag');
      localStorage.removeItem('digiwell_pending_calendar_oauth');
      localStorage.removeItem('digiwell_calendar_oauth_mode');

      sessionStorage.removeItem('digiwell_pending_calendar_oauth');
      sessionStorage.removeItem('digiwell_calendar_oauth_mode');

      useAppStore.getState().setAppState({
        calendarEvents: [],
        isCalendarSynced: false,
      });

      const { toast } = await import('sonner');
      toast.success(t('calendar.disconnected'));
    } catch (err) {
      console.error('Lỗi ngắt kết nối lịch:', err);
      const { toast } = await import('sonner');
      toast.error(t('calendar.disconnect_error'));
    }
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCalendarSync}
                    className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Đồng bộ
                  </button>
                  <span className="text-[10px] text-slate-700">|</span>
                  <button
                    onClick={handleDisconnectCalendar}
                    className="flex items-center gap-1 text-[10px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Ngắt kết nối
                  </button>
                </div>
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

            {/* Chế độ riêng tư lịch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/10">
                  <Shield size={12} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">Riêng tư lịch trình</p>
                  <p className="text-[9px] text-slate-500">Bảo vệ thông tin cá nhân của bạn</p>
                </div>
              </div>
              <select
                value={settings.calendarPrivacyLevel}
                onChange={async (e) => {
                  const val = e.target.value as 'off' | 'standard' | 'strict';
                  await updateSettings({ calendarPrivacyLevel: val });
                  // Sync to useAppStore profile immediately
                  if (profile?.id) {
                    useAppStore.getState().setAppState({
                      profile: {
                        ...profile,
                        calendar_privacy_level: val,
                      } as AppProfile
                    });
                  }
                }}
                className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-violet-500/50 transition-all cursor-pointer font-semibold"
              >
                <option value="off">Tắt (Công khai)</option>
                <option value="standard">Tiêu chuẩn (Ẩn PII)</option>
                <option value="strict">Nghiêm ngặt (Ẩn tiêu đề)</option>
              </select>
            </div>
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
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => handleExportClick('PDF')}
            disabled={isExportingPDF}
            className="glass-card p-3 flex flex-col items-center gap-2 group hover:bg-slate-800/60 transition-all disabled:opacity-50 border border-white/5"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              {isExportingPDF ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-tight">PDF</h4>
              <p className="text-slate-500 text-[7px] uppercase mt-0.5 font-black">Y khoa</p>
            </div>
          </button>

          <button 
            onClick={() => handleExportClick('CSV')}
            className="glass-card p-3 flex flex-col items-center gap-2 group hover:bg-slate-800/60 transition-all border border-white/5"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw size={16} />
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-tight">CSV</h4>
              <p className="text-slate-500 text-[7px] uppercase mt-0.5 font-black">Dữ liệu thô</p>
            </div>
          </button>

          <button 
            onClick={() => handleExportClick('JSON')}
            className="glass-card p-3 flex flex-col items-center gap-2 group hover:bg-slate-800/60 transition-all border border-white/5"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Target size={16} />
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-tight">JSON</h4>
              <p className="text-slate-500 text-[7px] uppercase mt-0.5 font-black">Dữ liệu gốc</p>
            </div>
          </button>
        </div>
      </div>

      <DateRangeExportModal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        onExport={handleDateRangeExport}
        exportType={selectedExportType || 'PDF'}
      />
    </div>
  );
}
