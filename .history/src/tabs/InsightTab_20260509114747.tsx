import React, { useMemo, useState, useEffect, memo, useCallback, useRef } from 'react';
import {
  Cpu, Droplets, Activity, TrendingUp, Settings2, Target, Crown, CloudSun, AlertTriangle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AvatarFrame from '../components/AvatarFrame';
import type { WaterLog } from '../models';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { useShallow } from 'zustand/react/shallow';
import { useInsightData } from '../hooks/useInsightData';
import { usePreviousWeekData } from '../hooks/usePreviousWeekData';
import { useBehaviorAnalysis } from '../hooks/useBehaviorAnalysis';
import { toast } from 'sonner';

import OverviewSection from './Insight/OverviewSection';
import AiCoachSection from './Insight/AiCoachSection';
import AnalyticsSection from './Insight/AnalyticsSection';
import SystemSection from './Insight/SystemSection';
import SelectedDateModal from './Insight/SelectedDateModal';

interface InsightTabProps {
   isExportingPDF: boolean;
   handleExportPDF: () => void;
   handleExportCSV: () => void;
   isAiLoading: boolean;
   aiAdvice: string;
   fetchAIAdvice: () => void;
   weeklyReport?: any;
   isWeeklyReportLoading?: boolean;
   generateWeeklyReport?: () => void;
 }

const InsightTab = memo(function InsightTab({
   isExportingPDF, handleExportPDF, handleExportCSV,
   isAiLoading, aiAdvice, fetchAIAdvice,
   weeklyReport, isWeeklyReportLoading, generateWeeklyReport
 }: InsightTabProps) {
  
  const { profile, isPremium, waterGoal, weeklyHistory: weeklyChartData, streak, hydrationResult, waterIntake, waterEntries, isWatchConnected, isWeatherSynced, isCalendarSynced, actions } = useAppStore(useShallow((state: any) => ({
    profile: state.profile,
    isPremium: state.isPremium,
    waterGoal: state.waterGoal,
    weeklyHistory: state.weeklyHistory,
    streak: state.streak,
    hydrationResult: state.hydrationResult,
    waterIntake: state.waterIntake,
    waterEntries: state.waterEntries,
    isWatchConnected: state.isWatchConnected,
    isWeatherSynced: state.isWeatherSynced,
    isCalendarSynced: state.isCalendarSynced,
    actions: state.actions,
  })));
  const { setShowPremiumModal, setShowAiChat } = useUIStore(useShallow((state) => ({
    setShowPremiumModal: state.setShowPremiumModal,
    setShowAiChat: state.setShowAiChat,
  })));
  
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [activeView, setActiveView] = useState<'overview' | 'ai' | 'analytics' | 'system'>('overview');
  const secretClickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- STATES CHO MODAL LỊCH SỬ NGÀY ---
  const [selectedDateModal, setSelectedDateModal] = useState<{date: string, ml: number} | null>(null);
  const [dayLogs, setDayLogs] = useState<WaterLog[]>([]);
  const [isDayLogsLoading, setIsDayLogsLoading] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, number>>({});
  const [selectedWeekDay, setSelectedWeekDay] = useState<{ d: string; ml: number } | null>(null);
  const [selectedCalendarCell, setSelectedCalendarCell] = useState<{ dayNum: number; ml: number; fullDate: string } | null>(null);

  const monthKey = useMemo(() => {
    return `${calendarDate.getFullYear()}-${calendarDate.getMonth()}`;
  }, [calendarDate]);

  const waterEntriesSig = useMemo(() => 
    waterEntries?.map((e: any) => `${e.id}-${e.amount}`).join(',') ?? '', 
    [waterEntries]);

  useEffect(() => {
    let mounted = true;
    const fetchMonthData = async () => {
      if (!profile?.id) return;
      try {
        const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
        const startStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}`;
        const endStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

        const { data, error } = await supabase
          .from('water_logs')
          .select('amount, day')
          .eq('user_id', profile.id)
          .gte('day', startStr)
          .lte('day', endStr);

        if (error) throw error;
        if (!mounted) return;

        const dataMap: Record<string, number> = {};
        (data || []).forEach((log: any) => {
          if (log.day && log.amount) {
            dataMap[log.day] = (dataMap[log.day] || 0) + log.amount;
          }
        });
        setMonthlyDataMap(dataMap);
      } catch (err) {
        console.error('Lỗi tải dữ liệu tháng:', err);
      }
    };

    fetchMonthData();
    return () => { mounted = false; };
  }, [profile?.id, monthKey, waterEntriesSig]);

  // --- THUẬT TOÁN TRUE CALENDAR: Tự động tạo lưới lịch chuẩn theo Tháng hiện tại ---
  const { calendarCells, currentMonthName } = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // Tìm số ngày trong tháng (tự động 28, 29, 30, 31)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Tìm thứ của ngày mùng 1 (0 = CN, 1 = T2...). Đổi sang T2 là đầu tuần (0 = T2... 6 = CN)
    let firstDayIndex = new Date(year, month, 1).getDay();
    // Chuyển đổi: CN(0) -> 6, T2(1) -> 0, ..., T7(6) -> 5
    // Để có T2 là đầu tuần (index 0)
    if (firstDayIndex === 0) firstDayIndex = 6;
    else firstDayIndex = firstDayIndex - 1; 

    const cells = [];
    
    // 1. Lấp đầy các ô trống ở đầu tháng
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, ml: 0, isFuture: false, isToday: false, isEmptySlot: true, fullDate: '' });
    }

    // 2. Điền các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = year === currentYear && month === currentMonth && i === currentDate;
      const isFuture = year > currentYear || (year === currentYear && month > currentMonth) || (year === currentYear && month === currentMonth && i > currentDate);

      const fullDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const entriesForDay = waterEntries?.filter((e: any) => e.day === fullDateStr) || [];
      let ml = Number(monthlyDataMap[fullDateStr] || 0);
      if (entriesForDay.length > 0) {
        ml = entriesForDay.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      } else if (isToday) {
        ml = waterIntake;
      }

      cells.push({ dayNum: i, ml, isFuture, isToday, isEmptySlot: false, fullDate: fullDateStr });
    }

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    return { 
      calendarCells: cells, 
      currentMonthName: `${monthNames[month]} / ${year}` 
    };
  }, [monthlyDataMap, waterIntake, calendarDate, waterEntries]);

  const handlePrevMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // --- HÀM LẤY CHI TIẾT LỊCH SỬ NGÀY KHI BẤM VÀO LỊCH ---
  const handleDayClick = async (dateStr: string, totalMl: number) => {
    if (!profile?.id) return;
    setSelectedDateModal({ date: dateStr, ml: totalMl });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const entriesInStore = waterEntries?.filter((e: any) => e.day === dateStr) || [];
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

  // --- DEVELOPER CHEAT: BẬT/TẮT PRO TRONG NHÁY MẮT ---
  const handleSecretClick = useCallback(() => {
    // Reset bộ đếm nếu sếp ngừng click quá 2 giây
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      secretClickCountRef.current = 0;
    }, 2000);

    secretClickCountRef.current += 1;
    const count = secretClickCountRef.current;

    if (count === 3) toast.info('Nhấp 2 lần nữa để thay đổi chế độ PRO', { id: 'secret-toast' });
    if (count === 4) toast.info('Nhấp 1 lần nữa để thay đổi chế độ PRO', { id: 'secret-toast' });
    
    if (count >= 5) {
      const currentStatus = useAppStore.getState().isPremium;
      useAppStore.setState({ isPremium: !currentStatus });
      toast.success(currentStatus ? 'Đã TẮT chế độ PRO' : '🚀 Đã MỞ KHÓA chế độ PRO thành công!', { id: 'secret-toast' });
      secretClickCountRef.current = 0;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    }
  }, []);

  // --- COMPARATIVE ANALYSIS: Lấy dữ liệu tuần trước ---
  const { data: previousWeekData } = usePreviousWeekData(profile?.id);

  // --- BEHAVIOR ANALYSIS: Phân tích thói quen uống nước ---
  const { patterns, getAdaptiveRecommendation } = useBehaviorAnalysis({
    weeklyData: weeklyChartData,
    waterLogs: waterEntries,
    waterGoal
  });

  const stats = useMemo(() => {
    if (weeklyChartData.length === 0) return { avg: 0, completed: 0 };
    const total = weeklyChartData.reduce((acc: number, curr: any) => acc + curr.ml, 0);
    const avg = total / weeklyChartData.length;
    const completed = weeklyChartData.filter((day: any) => day.ml >= waterGoal).length;
    return { avg: Math.round(avg), completed };
  }, [weeklyChartData, waterGoal]);

  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);
  
  const weeklyTotal = useMemo(() => weeklyChartData.reduce((sum: number, d: any) => sum + d.ml, 0), [weeklyChartData]);
  const monthlyTotal = useMemo(() => Object.values(monthlyDataMap).reduce((sum, ml) => sum + ml, 0), [monthlyDataMap]);

  const yesterdayIntake = useMemo(() => {
    if (weeklyChartData.length >= 2) {
      return weeklyChartData[weeklyChartData.length - 2].ml;
    }
    return 0;
  }, [weeklyChartData]);

  // --- DYNAMIC NARRATIVE ENGINE ---
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

  // --- NEXT BEST ACTION ENGINE ---
  const nextBestAction = useMemo(() => {
    const remaining = Math.max(0, waterGoal - waterIntake);
    const hour = new Date().getHours();

    if (waterGoal === 0) {
      return { title: 'Thiết lập mục tiêu', action: 'Cập nhật thông tin để AI tính toán lượng nước.', ml: 0, icon: Target, color: 'text-slate-400', bg: 'bg-slate-500/20' };
    }
    if (remaining === 0) {
      return { title: 'Hoàn thành xuất sắc', action: 'Bạn đã đạt mục tiêu. Chỉ uống thêm nếu thực sự khát.', ml: 0, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    if (hour >= 22) {
      return { title: 'Trước khi ngủ', action: `Uống ${Math.min(remaining, 150)}ml nước ấm để tránh tiểu đêm.`, ml: Math.min(remaining, 150), icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
    }
    if (hour <= 9 && waterIntake < 300) {
      return { title: 'Bắt đầu ngày mới', action: 'Đánh thức cơ thể với ly nước 250ml đầu ngày.', ml: 250, icon: CloudSun, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    }
    if (remaining > waterGoal * 0.5 && hour > 15) {
      return { title: 'Đang tụt hậu', action: 'Bạn đang uống quá chậm. Hãy bù ngay 300ml để theo kịp tiến độ.', ml: 300, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' };
    }
    return { title: 'Duy trì nhịp độ', action: `Tiếp tục nạp ${Math.min(remaining, 250)}ml để cơ thể luôn tươi mới.`, ml: Math.min(remaining, 250), icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
  }, [waterIntake, waterGoal]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      
      {/* --- PHẦN TIÊU ĐỀ (HEADER) --- */}
      <div className="flex justify-between items-start pt-6 pb-4 px-6">
        <div onClick={handleSecretClick} className="cursor-pointer select-none touch-manipulation">
          <p className="text-[10px] font-bold tracking-widest text-meta uppercase mb-1">PHÂN TÍCH CHUYÊN SÂU</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white active:scale-95 transition-transform origin-left">
            Insight
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="active:scale-95 transition-transform rounded-full shadow-lg shadow-black/20">
             <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
           </div>
         </div>
      </div>

      {/* --- ĐIỀU HƯỚNG SUB-TABS --- */}
      <div className="px-5 mb-6 mt-1">
        <div className="glass-control flex items-center p-1.5 shadow-inner">
          {[
            { id: 'overview', label: 'TỔNG QUAN', icon: Target },
            { id: 'ai', label: 'AI COACH', icon: Cpu },
            { id: 'analytics', label: 'PHÂN TÍCH', icon: TrendingUp },
            { id: 'system', label: 'HỆ THỐNG', icon: Settings2 }
          ].map(tab => {
            const isActive = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex-1 relative flex flex-col items-center justify-center py-2.5 transition-colors duration-200 z-10 rounded-xl ${
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
                <Icon size={16} className={`mb-1.5 ${isActive ? '' : 'opacity-80'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
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
            />
          </motion.div>
        )}

{activeView === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <AiCoachSection
              isPremium={isPremium}
              setShowPremiumModal={setShowPremiumModal}
              setShowAiChat={setShowAiChat}
              isAiLoading={isAiLoading}
              aiAdvice={aiAdvice}
              fetchAIAdvice={fetchAIAdvice}
              streak={streak}
              waterIntake={waterIntake}
              waterGoal={waterGoal}
              isExportingPDF={isExportingPDF}
              handleExportPDF={handleExportPDF}
              handleExportCSV={handleExportCSV}
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
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              calendarDate={calendarDate}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              calendarCells={calendarCells}
              currentMonthName={currentMonthName}
              waterGoal={waterGoal}
              weeklyChartData={weeklyChartData}
              previousWeekData={previousWeekData}
              selectedWeekDay={selectedWeekDay}
              setSelectedWeekDay={setSelectedWeekDay}
              selectedCalendarCell={selectedCalendarCell}
              setSelectedCalendarCell={setSelectedCalendarCell}
              handleDayClick={handleDayClick}
              monthlyTotal={monthlyTotal}
              stats={stats}
              profile={profile}
              weeklyTotal={weeklyTotal}
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
              isWatchConnected={isWatchConnected}
              isWeatherSynced={isWeatherSynced}
              isCalendarSynced={isCalendarSynced}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* MODAL LỊCH SỬ UỐNG NƯỚC THEO NGÀY (CALENDAR VIEW) */}
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
