import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, memo, useCallback, lazy, Suspense } from 'react';
import {
  Cpu, Droplets, TrendingUp, Settings2, Target, Crown, CloudSun, AlertTriangle, Clock, Loader2,
  Award, Flame, Sparkles, Zap, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { WaterLog } from '../models';
import { useAppStore } from '../store/useAppStore';
import type { AppState } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { useShallow } from 'zustand/react/shallow';
import { useInsightData } from '../hooks/useInsightData';
import { usePreviousWeekData } from '../hooks/usePreviousWeekData';
import { useHydrationPattern } from '../hooks/useHydrationPattern';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import TabHeader from '../components/layout/TabHeader';
import OverviewSection from './Insight/OverviewSection';

const AnalyticsSection = lazy(() => import('./Insight/AnalyticsSection'));
const SystemSection = lazy(() => import('./Insight/SystemSection'));
const SelectedDateModal = lazy(() => import('./Insight/SelectedDateModal'));
import { glassControl } from '../styles/glass';

import type { CalendarEventItem } from '../hooks/useCalendarSync';

interface InsightTabProps {
   isExportingPDF: boolean;
   handleExportPDF: () => void;
   handleExportCSV: () => void;
   handleExportJSON: () => void;
   isAiLoading: boolean;
   aiAdvice: string;
   aiAdviceObj?: {
     text: string;
     suggestedAmount?: number;
     nextBestAction?: {
       title: string;
       action: string;
       ml: number;
       icon: string;
     };
   } | null;
   fetchAIAdvice: () => void;
   calendarEvents: CalendarEventItem[];
   syncCalendar: (options?: { silent?: boolean; startOAuthIfNeeded?: boolean }) => Promise<number | false>;
   weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null | undefined;
 }

const InsightTab = memo(function InsightTab({
   isExportingPDF, handleExportPDF, handleExportCSV, handleExportJSON,
   isAiLoading, aiAdvice, aiAdviceObj, fetchAIAdvice,
   calendarEvents, syncCalendar,
   weatherData,
  }: InsightTabProps) {
  const { t, i18n } = useTranslation();
  
  const { profile, isPremium, waterGoal, weeklyHistory: weeklyChartData, streak, waterIntake, waterEntries, actions } = useAppStore(useShallow((state: AppState) => ({
    profile: state.profile,
    isPremium: state.isPremium,
    waterGoal: state.waterGoal,
    weeklyHistory: state.weeklyHistory,
    streak: state.streak,
    waterIntake: state.waterIntake,
    waterEntries: state.waterEntries,
    actions: state.actions,
  })));
  const { setShowPremiumModal, setShowMainMenu } = useUIStore(useShallow((state) => ({
    setShowPremiumModal: state.setShowPremiumModal,
    setShowMainMenu: state.setShowMainMenu,
  })));
  
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'system'>('overview');

  const [selectedDateModal, setSelectedDateModal] = useState<{date: string, ml: number} | null>(null);
  const [dayLogs, setDayLogs] = useState<WaterLog[]>([]);
  const [isDayLogsLoading, setIsDayLogsLoading] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedWeekDay, setSelectedWeekDay] = useState<{ d: string; ml: number } | null>(null);
  const [selectedCalendarCell, setSelectedCalendarCell] = useState<{ dayNum: number; ml: number; fullDate: string } | null>(null);

  const {
    monthlyDataMap,
    isLoading: isInsightLoading,
    error: insightError,
    refetchMonthly,
  } = useInsightData(profile?.id, calendarDate);

  useEffect(() => {
    if (profile?.id && waterEntries.length > 0) {
      refetchMonthly();
    }
  }, [waterEntries?.length, profile?.id, refetchMonthly]);

  const { calendarCells, currentMonthName } = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayIndex = new Date(year, month, 1).getDay();
    if (firstDayIndex === 0) firstDayIndex = 6;
    else firstDayIndex = firstDayIndex - 1; 

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, ml: 0, isFuture: false, isToday: false, isEmptySlot: true, fullDate: '' });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = year === currentYear && month === currentMonth && i === currentDate;
      const isFuture = year > currentYear || (year === currentYear && month > currentMonth) || (year === currentYear && month === currentMonth && i > currentDate);
      const fullDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const entriesForDay = waterEntries?.filter((e: { day: string }) => e.day === fullDateStr) || [];
      let ml = Number(monthlyDataMap[fullDateStr] || 0);
      if (entriesForDay.length > 0) {
        ml = entriesForDay.reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0);
      } else if (isToday) {
        ml = waterIntake;
      }
      cells.push({ dayNum: i, ml, isFuture, isToday, isEmptySlot: false, fullDate: fullDateStr });
    }

    const currentMonthName = new Date(year, month).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
    return { calendarCells: cells, currentMonthName };
  }, [monthlyDataMap, waterIntake, calendarDate, waterEntries, i18n.language]);

  const handlePrevMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDayClick = async (dateStr: string, totalMl: number) => {
    if (!profile?.id) return;
    setSelectedDateModal({ date: dateStr, ml: totalMl });
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const entriesInStore = waterEntries?.filter((e: { day: string }) => e.day === dateStr) || [];
    if (entriesInStore.length > 0 || dateStr === todayStr || totalMl === 0) {
      if (totalMl === 0) setDayLogs([]);
      setIsDayLogsLoading(false);
      return;
    }
    setIsDayLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('day', dateStr)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDayLogs(data || []);
    } catch (err) {
      const { toast } = await import('sonner');
      toast.error(t('water.day_detail_load_error'));
      console.error('Lỗi tải lịch sử ngày:', err);
    } finally {
      setIsDayLogsLoading(false);
    }
   };

  const { data: previousWeekData } = usePreviousWeekData(profile?.id);

  // Hydration pattern analysis
  const { pattern } = useHydrationPattern({
    waterLogs: waterEntries.map(e => ({ ...e, day: e.day || e.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10) })),
    waterGoal,
    userId: profile?.id || null,
    weatherHistory: (weatherData?.temp !== undefined && weatherData?.humidity !== undefined) 
      ? [{ date: new Date().toISOString().slice(0, 10), temp: weatherData.temp, humidity: weatherData.humidity }] 
      : [],
  });

  // Weekly report - use the hook instead of relying on parent props
  const { report: weeklyReportHook, isLoading: isWeeklyReportLoadingHook, refreshReport } = useWeeklyReport({
    currentWeekLogs: weeklyChartData?.map(d => ({
      id: d.d,
      user_id: profile?.id || '',
      amount: d.ml,
      name: 'Water',
      day: d.d,
      exp: 0,
      created_at: d.d
    })) || [],
    previousWeekLogs: previousWeekData?.map(d => ({ id: d.fullDate, user_id: profile?.id || '', amount: d.ml, name: 'Water', day: d.fullDate, exp: 0, created_at: d.fullDate })) || [],
    waterGoal,
    userId: profile?.id || null,
  });

  const stats = useMemo(() => {
    if (weeklyChartData.length === 0) return { avg: 0, completed: 0 };
    const total = weeklyChartData.reduce((acc: number, curr: { ml: number }) => acc + curr.ml, 0);
    const avg = total / weeklyChartData.length;
    const completed = weeklyChartData.filter((day: { ml: number }) => day.ml >= waterGoal).length;
    return { avg: Math.round(avg), completed };
  }, [weeklyChartData, waterGoal]);

  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.nickname || (i18n.language === 'vi' ? 'bạn' : 'you');
    if (hour < 12) return t('insight.good_morning', { name });
    if (hour < 18) return t('insight.good_afternoon', { name });
    return t('insight.good_evening', { name });
  }, [profile?.nickname, i18n.language, t]);

  const primaryStory = useMemo(() => {
    if (streak >= 7) return t('insight.optimal_hydration', { days: streak });
    if (completionRate >= 80) return t('insight.good_performance', { rate: completionRate });
    if (completionRate > 0 && completionRate < 50) return t('insight.busy_week');
    return t('insight.journey_start');
  }, [streak, completionRate, t]);

  const nextBestAction = useMemo(() => {
    // If we have a smart, custom nextBestAction generated by the AI coach, use it!
    if (aiAdviceObj?.nextBestAction) {
      const aiNba = aiAdviceObj.nextBestAction;
      const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
        droplets: Droplets,
        zap: Zap,
        alert: AlertTriangle,
        sparkles: Sparkles,
        clock: Clock,
        target: Target,
        crown: Crown,
        award: Award,
        weather: CloudSun,
        flame: Flame,
      };

      const COLOR_MAP: Record<string, { color: string; bg: string }> = {
        droplets: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
        zap: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        alert: { color: 'text-rose-400', bg: 'bg-rose-500/20' },
        sparkles: { color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
        clock: { color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
        target: { color: 'text-slate-400', bg: 'bg-slate-500/20' },
        crown: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        award: { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        weather: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
        flame: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
      };

      const mappedIcon = ICON_MAP[aiNba.icon] || Sparkles;
      const themeColors = COLOR_MAP[aiNba.icon] || { color: 'text-cyan-400', bg: 'bg-cyan-500/20' };

      return {
        title: aiNba.title,
        action: aiNba.action,
        ml: aiNba.ml,
        icon: mappedIcon,
        ...themeColors,
      };
    }

    const remaining = Math.max(0, waterGoal - waterIntake);
    const hour = new Date().getHours();
    const temp = weatherData?.temp || 25;
    const humidity = weatherData?.humidity || 60;
    
    // Priority 1: No goal set
    if (waterGoal === 0) return { title: t('insight.setup_goal'), action: t('insight.setup_goal_desc'), ml: 0, icon: Target, color: 'text-slate-400', bg: 'bg-slate-500/20' };
    
    // Priority 2: Already completed
    if (remaining === 0) {
      if (streak >= 7) return { title: t('insight.great_streak'), action: t('insight.great_streak_desc', { days: streak }), ml: 0, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      return { title: t('insight.completed_today'), action: t('insight.completed_today_desc'), ml: 100, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    }
    
    // Priority 3: Critical deficit (>50% behind after 3PM)
    if (remaining > waterGoal * 0.5 && hour > 15) {
      const catchUp = Math.min(remaining, 400);
      if (temp > 30) return { title: t('insight.too_hot'), action: t('insight.too_hot_desc', { temp, ml: catchUp }), ml: catchUp, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' };
      return { title: t('insight.need_water_urgent'), action: t('insight.need_water_urgent_desc', { remaining: Math.round(remaining), ml: catchUp }), ml: catchUp, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' };
    }
    
    // Priority 4: Weather-based adjustments
    if (temp > 32) {
      const hotBonus = Math.min(remaining, 200);
      return { title: t('insight.hot_weather'), action: t('insight.hot_weather_desc', { temp, ml: hotBonus }), ml: hotBonus, icon: CloudSun, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    }
    if (humidity < 40) {
      const dryBonus = Math.min(remaining, 150);
      return { title: 'Dry Air', action: `Humidity ${humidity}% → skin and throat need water. Drink ${dryBonus}ml.`, ml: dryBonus, icon: CloudSun, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    }
    
    // Priority 5: Streak protection
    if (streak >= 3 && waterIntake < waterGoal * 0.3 && hour > 18) {
      const saveStreak = Math.min(remaining, 300);
      return { title: t('insight.protect_streak'), action: t('insight.protect_streak_desc', { days: streak, ml: saveStreak }), ml: saveStreak, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    }
    
    // Priority 6: Time-based specific advice
    if (hour >= 22) return { title: t('insight.before_sleep'), action: t('insight.before_sleep_desc', { ml: Math.min(remaining, 120) }), ml: Math.min(remaining, 120), icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
    if (hour <= 9 && waterIntake < 300) return { title: t('insight.wake_up_body'), action: t('insight.wake_up_body_desc'), ml: 250, icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (hour >= 11 && hour <= 13 && waterIntake < waterGoal * 0.4) return { title: t('insight.noon_water'), action: t('insight.noon_water_desc'), ml: 200, icon: Droplets, color: 'text-sky-400', bg: 'bg-sky-500/20' };
    if (hour >= 15 && hour <= 17 && waterIntake < waterGoal * 0.6) return { title: t('insight.afternoon_water'), action: t('insight.afternoon_water_desc'), ml: 180, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    
    // Priority 7: Pattern-based (if available)
    if (pattern?.blindSpots && pattern.blindSpots.length > 0) {
      const currentSlot = Math.floor(hour / 3) * 3;
      const blindSpot = pattern.blindSpots.find(bs => {
        const slotHour = parseInt(bs.slot.split('-')[0], 10);
        return slotHour >= currentSlot && slotHour < currentSlot + 3;
      });
      if (blindSpot && blindSpot.completionRate < 40) {
        return { title: t('insight.blind_spot_warning'), action: t('insight.blind_spot_warning_desc', { slot: blindSpot.slot }), ml: 200, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' };
      }
    }
    
    // Priority 8: Default maintain pace
    const maintainAmount = Math.min(remaining, 200);
    return { title: t('insight.maintain_pace'), action: t('insight.maintain_pace_desc', { remaining: Math.round(remaining), ml: maintainAmount }), ml: maintainAmount, icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
  }, [waterIntake, waterGoal, streak, weatherData, pattern, aiAdviceObj, t]);

  if (isInsightLoading && !profile) {
    return (
      <div className="space-y-6 pb-28 animate-in fade-in duration-300 flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-cyan-400" />
          <p className="text-sm font-medium text-slate-400">{t('common.loading_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {insightError && (
        <div className="px-5" role="alert" aria-live="assertive">
          <div className="flex items-center gap-2 rounded-[var(--theme-border-radius-inner,12px)] bg-orange-500/10 border border-orange-500/20 px-4 py-3">
            <AlertTriangle size={16} className="text-orange-400 shrink-0" />
            <p className="text-xs text-orange-300">{insightError}</p>
          </div>
        </div>
      )}
      <TabHeader
        label={t('insight.smart_coaching')}
        title="DigiCoach"
        profile={profile}
        actionIcon={<Cpu size={18} />}
        onAvatarClick={() => setShowMainMenu(true)}
      />

      <div className="px-5 mb-5 mt-1">
        <div className={`${glassControl} flex items-center p-1 shadow-inner overflow-x-auto scrollbar-hide`}>
          {[
            { id: 'overview', label: t('insight.coach_tab'), icon: Cpu },
            { id: 'analytics', label: t('insight.analytics_tab'), icon: TrendingUp },
            { id: 'system', label: t('insight.system_tab'), icon: Settings2 }
          ].map(tab => {
            const isActive = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'overview' | 'analytics' | 'system')}
                className={`flex-1 min-w-[80px] relative flex items-center justify-center gap-1.5 py-2 px-3 transition-colors duration-200 z-10 rounded-[var(--theme-border-radius-inner,12px)] ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="insightSubTabIndicator"
                    className="absolute inset-0 rounded-[var(--theme-border-radius-inner,12px)] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 -z-10 shadow-[0_0_12px_var(--theme-glow-color,rgba(34,211,238,0.15))]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'opacity-70'} />
                <span className="text-[10px] font-bold tracking-wide whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <OverviewSection
              greeting={greeting}
              primaryStory={primaryStory}
              nextBestAction={nextBestAction}
              actions={actions}
              aiAdvice={aiAdvice}
              isAiLoading={isAiLoading}
              fetchAiAdvice={fetchAIAdvice}
              isPremium={isPremium}
              setShowPremiumModal={setShowPremiumModal}
            />
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center p-12 min-h-[400px]" role="status" aria-live="polite">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
              </div>
            }>
              <AnalyticsSection
                isPremium={isPremium}
                setShowPremiumModal={setShowPremiumModal}
                calendarDate={calendarDate}
                handlePrevMonth={handlePrevMonth}
                handleNextMonth={handleNextMonth}
                calendarCells={calendarCells}
                currentMonthName={currentMonthName}
                waterGoal={waterGoal}
                weeklyChartData={weeklyChartData as unknown as Array<{ d: string; ml: number; isToday: boolean }>}
                previousWeekData={previousWeekData as unknown as Array<{ d: string; ml: number }> | null}
                selectedWeekDay={selectedWeekDay}
                setSelectedWeekDay={setSelectedWeekDay}
                selectedCalendarCell={selectedCalendarCell}
                setSelectedCalendarCell={setSelectedCalendarCell}
                handleDayClick={handleDayClick}
                stats={stats}
                profile={profile}
                streak={streak}
                completionRate={completionRate}
                weeklyReport={weeklyReportHook}
                isWeeklyReportLoading={isWeeklyReportLoadingHook}
                generateWeeklyReport={refreshReport}
                hydrationPattern={pattern}
              />
            </Suspense>
          </motion.div>
        )}

        {activeView === 'system' && (
          <motion.div
            key="system"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center p-12 min-h-[300px]" role="status" aria-live="polite">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
              </div>
            }>
              <SystemSection
                profile={profile}
                isPremium={isPremium}
                isExportingPDF={isExportingPDF}
                handleExportPDF={handleExportPDF}
                handleExportCSV={handleExportCSV}
                handleExportJSON={handleExportJSON}
                setShowPremiumModal={setShowPremiumModal}
                calendarEvents={calendarEvents}
                syncCalendar={syncCalendar}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Suspense fallback={null}>
        <SelectedDateModal
          selectedDateModal={selectedDateModal}
          onClose={() => setSelectedDateModal(null)}
          dayLogs={dayLogs}
          isDayLogsLoading={isDayLogsLoading}
          waterEntries={waterEntries}
          waterIntake={waterIntake}
        />
      </Suspense>
    </div>
  );
});

export default InsightTab;
