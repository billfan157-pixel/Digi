import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Activity, Calendar, ChevronRight, RefreshCw, ChevronDown, ChevronUp, Target, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScheduleSummaryCard from '../../components/insight/ScheduleSummaryCard';
import ScheduleDrawerModal from '../../components/insight/ScheduleDrawerModal';
import { AppStorage } from '@/lib/storage';
import DateRangeExportModal from '../../components/modals/DateRangeExportModal';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../hooks/useSettings';
import type { AppProfile } from '../../services/profile.service';
import type { HydrationSchedule } from '../../lib/HydrationEngine';
import type { CalendarEventItem } from '../../hooks/useCalendarSync';
import { supabase } from '../../lib/supabase';
import { providerTokenStore } from '../../lib/providerTokenStore';
import { glassInner } from '../../styles/glass';

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

function getEventTimeLabel(event: CalendarEventItem, dateKey: string, t: (key: string) => string) {
  if (event.isAllDay) return t('all_day');

  const startKey = getEventDateKey(event.startRaw);
  const endKey = getEventDateKey(event.endRaw);
  const start = startKey && startKey < dateKey ? '00:00' : event.start;
  const end = endKey && endKey > dateKey ? t('until_tomorrow') : event.end;

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
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleUpdateTrigger, setScheduleUpdateTrigger] = useState(0);

  const { todayCount, todayTotalMl } = useMemo(() => {
    scheduleUpdateTrigger;
    if (!profile?.id) return { todayCount: 0, todayTotalMl: 0 };
    const saved = AppStorage.getItem(`digiwell_custom_schedule_today_${profile.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = parsed.length;
        const total = parsed.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);
        return { todayCount: count, todayTotalMl: total };
      } catch {
        return { todayCount: 0, todayTotalMl: 0 };
      }
    }
    return { todayCount: 0, todayTotalMl: 0 };
  }, [profile?.id, scheduleUpdateTrigger]);

  const { tomorrowCount, tomorrowTotalMl } = useMemo(() => {
    scheduleUpdateTrigger;
    if (!profile?.id) return { tomorrowCount: 0, tomorrowTotalMl: 0 };
    const saved = AppStorage.getItem(`digiwell_custom_schedule_tomorrow_${profile.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = parsed.length;
        const total = parsed.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);
        return { tomorrowCount: count, tomorrowTotalMl: total };
      } catch {
        return { tomorrowCount: 0, tomorrowTotalMl: 0 };
      }
    }
    return { tomorrowCount: 0, tomorrowTotalMl: 0 };
  }, [profile?.id, scheduleUpdateTrigger]);

  const triggerScheduleRefresh = () => setScheduleUpdateTrigger(prev => prev + 1);

  const handleCalendarSync = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    await syncCalendar({ startOAuthIfNeeded: true });
  };

  const handleDisconnectCalendar = async () => {
    const { confirmDialog } = await import('../../store/useConfirmDialog');
    const ok = await confirmDialog({
      title: t('calendar_disconnect_title'),
      message: t('calendar_disconnect_confirm'),
      confirmLabel: t('disconnect'),
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
    <div className="space-y-4 mt-2">
      {/* Calendar Events Section */}
      <div className="px-6">
        {/* Connect button when not synced */}
        {!isCalendarSynced && (
          <button
            onClick={handleCalendarSync}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-white flex items-center justify-between hover:from-violet-500/20 hover:to-purple-500/20 transition-all active:scale-[0.98] mb-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Calendar size={16} className="text-violet-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">{t('connect_calendar')}</p>
                <p className="text-[9px] text-slate-400">{t('auto_adjust_schedule')}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-violet-400" />
          </button>
        )}

        {/* Events list */}
        {isCalendarSynced && (
          <div className="space-y-3 mb-3">
            {/* Hôm nay */}
            <div>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Cpu size={80} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-cyan-400" />
                  <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    {t('today_schedule')}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleCalendarSync}
                    className="flex items-center gap-0.5 text-[9px] font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <RefreshCw size={9} />
                    {t('sync')}
                  </button>
                  <span className="text-[9px] text-slate-700">|</span>
                  <button
                    onClick={handleDisconnectCalendar}
                    className="flex items-center gap-0.5 text-[9px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    {t('disconnect')}
                  </button>
                </div>
              </div>

              {todayEvents.length > 0 ? (
                <div className="space-y-[1px] bg-white/[0.03] rounded-xl overflow-hidden border border-white/5">
                  {todayEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className={`${glassInner} flex items-center gap-2.5 px-3 py-2`}>
                      <div className="w-[3px] h-[3px] rounded-full bg-violet-400 shrink-0" />
                      <span className="flex-1 text-xs text-slate-300 truncate">{event.title}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                        {getEventTimeLabel(event, todayKey, t)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 px-1">{t('no_events_today')}</p>
              )}
            </div>

            {/* Ngày mai Toggle */}
            {tomorrowEvents.length > 0 && (
              <div>
                <button
                  onClick={() => setIsTomorrowExpanded(!isTomorrowExpanded)}
                  className="w-full flex items-center justify-between mb-2 p-1.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 transition-colors border border-purple-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-purple-400" />
                    <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      {t('tomorrow_schedule')}
                    </h3>
                  </div>
                  {isTomorrowExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                </button>
                
                <AnimatePresence>
                  {isTomorrowExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-[1px] bg-white/[0.03] rounded-xl overflow-hidden border border-purple-500/10">
                        {tomorrowEvents.slice(0, 4).map((event) => (
                          <div key={event.id} className={`${glassInner} flex items-center gap-2.5 px-3 py-2`}>
                            <div className="w-[3px] h-[3px] rounded-full bg-purple-400 shrink-0" />
                            <span className="flex-1 text-xs text-slate-400 truncate">{event.title}</span>
                            <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                              {getEventTimeLabel(event, tomorrowKey, t)}
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
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 mt-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/10">
                  <Shield size={10} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-200">{t('privacy_schedule')}</p>
                  <p className="text-[8px] text-slate-500">{t('protect_personal_info')}</p>
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
                className="bg-slate-950 border border-white/10 rounded-md px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-violet-500/50 transition-all cursor-pointer font-semibold"
              >
                <option value="off">{t('privacy_off')}</option>
                <option value="standard">{t('privacy_standard')}</option>
                <option value="strict">{t('privacy_strict')}</option>
              </select>
            </div>
          </div>
        )}

        <ScheduleSummaryCard
          selectedDay={selectedDay}
          scheduleCount={selectedDay === 'today' ? todayCount : tomorrowCount}
          totalMl={selectedDay === 'today' ? todayTotalMl : tomorrowTotalMl}
          onClick={() => setIsScheduleModalOpen(true)}
        />
      </div>

      {/* Reporting & Exports */}
      <div className="px-6 space-y-3 pb-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('reports_data')}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => handleExportClick('PDF')}
            disabled={isExportingPDF}
            className="glass-card py-2 px-2.5 flex items-center justify-center gap-1.5 group hover:bg-slate-800/60 transition-all disabled:opacity-50 border border-white/5 rounded-xl"
          >
            {isExportingPDF ? <RefreshCw size={12} className="animate-spin text-emerald-400" /> : <Activity size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />}
            <span className="text-white font-bold text-[10px] tracking-tight">PDF</span>
          </button>

          <button 
            onClick={() => handleExportClick('CSV')}
            className="glass-card py-2 px-2.5 flex items-center justify-center gap-1.5 group hover:bg-slate-800/60 transition-all border border-white/5 rounded-xl"
          >
            <RefreshCw size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold text-[10px] tracking-tight">CSV</span>
          </button>

          <button 
            onClick={() => handleExportClick('JSON')}
            className="glass-card py-2 px-2.5 flex items-center justify-center gap-1.5 group hover:bg-slate-800/60 transition-all border border-white/5 rounded-xl"
          >
            <Target size={12} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold text-[10px] tracking-tight">JSON</span>
          </button>
        </div>
      </div>

      <DateRangeExportModal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        onExport={handleDateRangeExport}
        exportType={selectedExportType || 'PDF'}
      />

      <ScheduleDrawerModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        profile={profile}
        aiSchedule={aiSchedule}
        waterGoal={waterGoal}
        waterEntries={waterEntries}
        calendarEvents={isCalendarSynced ? (selectedDay === 'today' ? todayEvents : tomorrowEvents) : []}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onSave={triggerScheduleRefresh}
      />
    </div>
  );
}
