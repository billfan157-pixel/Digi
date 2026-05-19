import { useMemo, useState, useEffect, memo, useCallback } from 'react';
import {
  Cpu, Droplets, TrendingUp, Settings2, Target, Crown, CloudSun, AlertTriangle, Clock
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
import TabHeader from '../components/layout/TabHeader';
import OverviewSection from './Insight/OverviewSection';
import AnalyticsSection from './Insight/AnalyticsSection';
import SystemSection from './Insight/SystemSection';
import SelectedDateModal from './Insight/SelectedDateModal';

import type { CalendarEventItem } from '../hooks/useCalendarSync';

interface InsightTabProps {
   isExportingPDF: boolean;
   handleExportPDF: () => void;
   handleExportCSV: () => void;
   isAiLoading: boolean;
   aiAdvice: string;
   fetchAIAdvice: () => void;
   calendarEvents: CalendarEventItem[];
   syncCalendar: (options?: { silent?: boolean; startOAuthIfNeeded?: boolean }) => Promise<number | false>;
   weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null | undefined;
   isWeatherSynced: boolean;
 }

const InsightTab = memo(function InsightTab({
   isExportingPDF, handleExportPDF, handleExportCSV,
   isAiLoading, aiAdvice, fetchAIAdvice,
   calendarEvents, syncCalendar,
   weatherData,
   isWeatherSynced,
 }: InsightTabProps) {
  
  const { profile, isPremium, waterGoal, weeklyHistory: weeklyChartData, streak, hydrationResult, waterIntake, waterEntries, actions } = useAppStore(useShallow((state: AppState) => ({
    profile: state.profile,
    isPremium: state.isPremium,
    waterGoal: state.waterGoal,
    weeklyHistory: state.weeklyHistory,
    streak: state.streak,
    hydrationResult: state.hydrationResult,
    waterIntake: state.waterIntake,
    waterEntries: state.waterEntries,
    actions: state.actions,
  })));
  const { setShowPremiumModal } = useUIStore(useShallow((state) => ({
    setShowPremiumModal: state.setShowPremiumModal,
  })));
  
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'system'>('overview');

  const [selectedDateModal, setSelectedDateModal] = useState<{date: string, ml: number} | null>(null);
  const [dayLogs, setDayLogs] = useState<WaterLog[]>([]);
  const [isDayLogsLoading, setIsDayLogsLoading] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedWeekDay, setSelectedWeekDay] = useState<{ d: string; ml: number } | null>(null);
  const [selectedCalendarCell, setSelectedCalendarCell] = useState<{ dayNum: number; ml: number; fullDate: string } | null>(null);

  const {
    monthlyDataMap,
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

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return { calendarCells: cells, currentMonthName: `${monthNames[month]} / ${year}` };
  }, [monthlyDataMap, waterIntake, calendarDate, waterEntries]);

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
      console.error('Lỗi tải lịch sử ngày:', err);
    } finally {
      setIsDayLogsLoading(false);
    }
   };

  const { data: previousWeekData } = usePreviousWeekData(profile?.id);

  const stats = useMemo(() => {
    if (weeklyChartData.length === 0) return { avg: 0, completed: 0 };
    const total = weeklyChartData.reduce((acc: number, curr: { ml: number }) => acc + curr.ml, 0);
    const avg = total / weeklyChartData.length;
    const completed = weeklyChartData.filter((day: { ml: number }) => day.ml >= waterGoal).length;
    return { avg: Math.round(avg), completed };
  }, [weeklyChartData, waterGoal]);

  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);

  const yesterdayIntake = useMemo(() => {
    if (weeklyChartData.length >= 2) {
      return weeklyChartData[weeklyChartData.length - 2].ml;
    }
    return 0;
  }, [weeklyChartData]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.nickname || 'bạn';
    if (hour < 12) return `Chào buổi sáng, ${name}.`;
    if (hour < 18) return `Chiều năng suất nhé, ${name}.`;
    return `Nghỉ ngơi thôi, ${name}.`;
  }, [profile?.nickname]);

  const primaryStory = useMemo(() => {
    if (streak >= 7) return `Cơ thể bạn đang ở trạng thái Hydration tối ưu nhất trong tuần qua với chuỗi ${streak} ngày.`;
    if (completionRate >= 80) return `Phong độ rất tốt! Bạn đã đạt ${completionRate}% mục tiêu tuần. Tiếp tục duy trì nhé.`;
    if (completionRate > 0 && completionRate < 50) return `Tuần này có vẻ hơi bận rộn? Cơ thể bạn đang thiếu hụt một lượng nước nhỏ đấy.`;
    return `Hành trình ngàn dặm bắt đầu từ một ngụm nước. Cùng DigiWell thiết lập lại thói quen nào.`;
  }, [streak, completionRate]);

  const nextBestAction = useMemo(() => {
    const remaining = Math.max(0, waterGoal - waterIntake);
    const hour = new Date().getHours();
    if (waterGoal === 0) return { title: 'Thiết lập mục tiêu', action: 'Cập nhật thông tin để AI tính toán lượng nước.', ml: 0, icon: Target, color: 'text-slate-400', bg: 'bg-slate-500/20' };
    if (remaining === 0) return { title: 'Hoàn thành xuất sắc', action: 'Bạn đã đạt mục tiêu. Chỉ uống thêm nếu thực sự khát.', ml: 0, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (hour >= 22) return { title: 'Trước khi ngủ', action: `Uống ${Math.min(remaining, 150)}ml nước ấm để tránh tiểu đêm.`, ml: Math.min(remaining, 150), icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
    if (hour <= 9 && waterIntake < 300) return { title: 'Bắt đầu ngày mới', action: 'Đánh thức cơ thể với ly nước 250ml đầu ngày.', ml: 250, icon: CloudSun, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (remaining > waterGoal * 0.5 && hour > 15) return { title: 'Đang tụt hậu', action: 'Bạn đang uống quá chậm. Hãy bù ngay 300ml để theo kịp tiến độ.', ml: 300, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' };
    return { title: 'Duy trì nhịp độ', action: `Tiếp tục nạp ${Math.min(remaining, 250)}ml để cơ thể luôn tươi mới.`, ml: Math.min(remaining, 250), icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
  }, [waterIntake, waterGoal]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      <TabHeader
        label="Huấn luyện thông minh"
        title="DigiCoach"
        profile={profile}
        actionIcon={<Cpu size={18} />}
      />

      <div className="px-5 mb-6 mt-1">
        <div className="glass-control flex items-center p-1.5 shadow-inner overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Cố vấn', icon: Cpu },
            { id: 'analytics', label: 'Phân tích', icon: TrendingUp },
            { id: 'system', label: 'Hệ thống', icon: Settings2 }
          ].map(tab => {
            const isActive = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'overview' | 'analytics' | 'system')}
                className={`flex-1 min-w-[72px] relative flex flex-col items-center justify-center py-2.5 transition-colors duration-200 z-10 rounded-xl ${
                  isActive ? 'text-cyan-300' : 'text-meta hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="insightSubTabIndicator"
                    className="absolute inset-0 active-treatment rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={16} className={`mb-1 ${isActive ? '' : 'opacity-80'}`} />
                <span className="text-[9px] font-bold tracking-wide whitespace-nowrap">{tab.label}</span>
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
              profile={profile}
              waterIntake={waterIntake}
              waterGoal={waterGoal}
              streak={streak}
              completionRate={completionRate}
              yesterdayIntake={yesterdayIntake}
              greeting={greeting}
              primaryStory={primaryStory}
              nextBestAction={nextBestAction}
              actions={actions}
              schedule={hydrationResult?.schedule || null}
              aiAdvice={aiAdvice}
              isAiLoading={isAiLoading}
              fetchAIAdvice={fetchAIAdvice}
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
            <AnalyticsSection
              isPremium={isPremium}
              setShowPremiumModal={setShowPremiumModal}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
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
              calendarEvents={calendarEvents}
              weatherData={weatherData}
              isWeatherSynced={isWeatherSynced}
            />
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
            <SystemSection
              profile={profile}
              isPremium={isPremium}
              isExportingPDF={isExportingPDF}
              handleExportPDF={handleExportPDF}
              handleExportCSV={handleExportCSV}
              setShowPremiumModal={setShowPremiumModal}
              calendarEvents={calendarEvents}
              syncCalendar={syncCalendar}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <SelectedDateModal
        selectedDateModal={selectedDateModal}
        onClose={() => setSelectedDateModal(null)}
        dayLogs={dayLogs}
        isDayLogsLoading={isDayLogsLoading}
        waterEntries={waterEntries}
        waterIntake={waterIntake}
      />
    </div>
  );
});

export default InsightTab;
