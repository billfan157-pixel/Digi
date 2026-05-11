import React, { useMemo, useState, useEffect, memo, useCallback } from 'react';
import {
  Cpu, RefreshCw, Droplets, FileText, Crown, Sparkles,
  X, Clock, Bluetooth, Loader2, ChevronRight, Activity, TrendingUp, AlertTriangle,
  CloudSun, Calendar, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import AvatarFrame from '../components/AvatarFrame';
import type { WaterLog } from '../models';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { useShallow } from 'zustand/react/shallow';
import { useInsightData } from '../hooks/useInsightData';

import { AdvancedStatsGrid } from './AdvancedStatsGrid';
import ScheduleManager from '../components/ScheduleManager';
import CalendarView from '../components/CalendarView';
import BasicTodayRingUpgraded from '../components/BasicTodayRingUpgraded';
import WeeklyChart from '../components/WeeklyChart';
import HourlyHeatmap from '../components/HourlyHeatmap';

interface InsightTabProps {
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  isAiLoading: boolean;
  aiAdvice: string;
  fetchAIAdvice: () => void;
  weeklyReport?: any;
  isWeeklyReportLoading?: boolean;
  generateWeeklyReport?: () => void;
}

const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl";

const InsightTab = memo(function InsightTab({
  isExportingPDF, handleExportPDF,
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
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; 

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

  const weeklyTrend = useMemo(() => {
    return weeklyChartData.map((d: any) => {
      const pct = (d.ml / (waterGoal || 1)) * 100;
      return Math.min(Math.max(pct, 0), 100);
    });
  }, [weeklyChartData, waterGoal]);

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
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* --- PHẦN TIÊU ĐỀ (HEADER) --- */}
      <div className="flex justify-between items-start pt-6 pb-4 px-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">PHÂN TÍCH CHUYÊN SÂU</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Insight</h1>
        </div>
<div className="flex items-center gap-3">
           <div className="active:scale-95 transition-all rounded-full shadow-lg shadow-black/20 dark:shadow-white/10 hover:shadow-cyan-500/20">
             <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
           </div>
         </div>
      </div>

      {/* --- ĐIỀU HƯỚNG SUB-TABS --- */}
      <div className="px-5 mb-4">
        <div className="flex bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-sm">
          {[
            { id: 'overview', label: 'Tổng quan', icon: Target },
            { id: 'ai', label: 'AI Coach', icon: Cpu },
            { id: 'analytics', label: 'Phân tích', icon: TrendingUp },
            { id: 'system', label: 'Hệ thống', icon: Clock }
          ].map(tab => {
            const isActive = activeView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-300 relative ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="insightSubTabIndicator"
                    className="absolute inset-0 bg-slate-800 border border-slate-700/50 rounded-xl -z-10 shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                <Icon size={18} className={`mb-1.5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* --- LAYER 1: THE NARRATIVE (HERO SECTION) --- */}
            <div className="pt-2 pb-2 px-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit mb-4">
                <Activity size={12} className="text-cyan-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Health Intelligence</span>
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="text-2xl font-black tracking-tight text-white leading-snug"
              >
                {greeting}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-2 text-sm text-slate-400 leading-relaxed max-w-[90%]"
              >
                {primaryStory}
              </motion.p>
            </div>

            {/* --- LAYER 2: CORE METRIC (TODAY RING) --- */}
            <div className="mt-4 mb-4">
              <BasicTodayRingUpgraded 
                waterIntake={waterIntake}
                waterGoal={waterGoal}
                streak={streak}
                completionRate={completionRate}
                yesterdayIntake={yesterdayIntake}
                weeklyTrend={weeklyTrend}
              />

              {/* --- LỜI KHUYÊN HÀNH ĐỘNG CỤ THỂ (NEXT BEST ACTION) --- */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex items-center justify-between shadow-sm mt-4 mx-6"
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div className={`w-10 h-10 rounded-full ${nextBestAction.bg} flex items-center justify-center shrink-0`}>
                    <nextBestAction.icon size={18} className={nextBestAction.color} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${nextBestAction.color}`}>{nextBestAction.title}</p>
                    <p className="text-xs font-medium text-slate-300 mt-0.5 leading-snug">{nextBestAction.action}</p>
                  </div>
                </div>
                {nextBestAction.ml > 0 && (
                  <button
                    onClick={() => actions?.handleAddWater?.(nextBestAction.ml, 1, 'Nước đề xuất')}
                    className="shrink-0 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl active:scale-95 transition-all border border-white/5"
                  >
                    +{nextBestAction.ml}ml
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeView === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 mt-2"
          >
            {/* --- LAYER 3: HEALTH INTELLIGENCE LAYER (PROACTIVE AI) --- */}
            <div className="px-6">
              <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-[1px] shadow-lg shadow-indigo-500/5">
                 <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-[calc(2rem-1px)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-inner">
                      <Cpu size={20} className={isAiLoading ? 'animate-spin text-indigo-400' : 'text-indigo-400'} />
                      {isAiLoading && <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 animate-ping" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                          DigiCoach <span className="text-indigo-400 text-[9px] font-black uppercase tracking-widest bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/20">AI</span>
                        </h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); isPremium ? fetchAIAdvice() : setShowPremiumModal(true); }}
                          className="text-slate-500 hover:text-indigo-400 transition-colors p-1.5 bg-white/5 rounded-lg active:scale-95"
                        >
                          <RefreshCw size={14} className={isAiLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                      
                      {isAiLoading ? (
                        <div className="space-y-2 mt-3">
                          <Skeleton className="h-3 w-full bg-slate-800" />
                          <Skeleton className="h-3 w-4/5 bg-slate-800" />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          {aiAdvice || 'Đang tổng hợp dữ liệu sinh học và thói quen của bạn...'}
                        </p>
                      )}
                      
                      <button 
                        onClick={() => isPremium ? setShowAiChat(true) : setShowPremiumModal(true)}
                        className="mt-3 text-[11px] font-bold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors w-fit"
                      >
                        Phân tích chuyên sâu <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 grid grid-cols-2 gap-3">
              <button 
                onClick={() => isPremium ? handleExportPDF() : setShowPremiumModal(true)}
                disabled={isExportingPDF}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-3 group cursor-pointer hover:bg-slate-800/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs">Xuất File PDF</h4>
                  <p className="text-slate-500 text-[10px] mt-1">Báo cáo Y khoa</p>
                </div>
              </button>

              <button 
                onClick={() => isPremium ? generateWeeklyReport?.() : setShowPremiumModal(true)}
                disabled={isWeeklyReportLoading}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-3 group cursor-pointer hover:bg-slate-800/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  {isWeeklyReportLoading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs">Báo cáo tuần</h4>
                  <p className="text-slate-500 text-[10px] mt-1">Tóm tắt thói quen</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* --- LAYER 4: THE JOURNEY (HÀNH TRÌNH & THÓI QUEN) --- */}
            <div className="mb-6 mt-2">
              <div className="px-6 flex justify-between items-center mb-4">
                <h3 className="text-base font-black text-white tracking-tight">Hành trình & Thói quen</h3>
                <div className="relative flex bg-slate-900/60 backdrop-blur-xl p-1 rounded-xl border border-white/10 shadow-lg">
                  {(['week', 'month'] as const).map((t) => {
                    const isActive = timeRange === t;
                    return (
                      <button 
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`relative px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${isActive ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="timeRangeIndicator"
                            className="absolute inset-0 bg-cyan-400 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.3)] -z-10"
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
                  <button onClick={handlePrevMonth} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button onClick={handleNextMonth} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 active:scale-95 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              )}

              <div className="px-6">
                <AnimatePresence mode="wait">
                  {timeRange === 'week' ? (
                    <motion.div
                      key="week-chart"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WeeklyChart 
                        weeklyChartData={weeklyChartData}
                        waterGoal={waterGoal}
                        selectedWeekDay={selectedWeekDay}
                        onSelectDay={setSelectedWeekDay}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="month-chart"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
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
            </div>

            <div className="px-6 mb-8 space-y-5">
              <AdvancedStatsGrid 
                weeklyTotal={weeklyTotal}
                monthlyTotal={monthlyTotal}
                stats={stats}
                weeklyChartData={weeklyChartData}
                profile={profile}
              />
              {/* THE NEW DEEP ANALYTICS HEATMAP */}
              <HourlyHeatmap userId={profile?.id} />
            </div>
          </motion.div>
        )}

        {activeView === 'system' && (
          <motion.div
            key="system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 mt-2"
          >
            <div className="px-6">
              <ScheduleManager profile={profile} alwaysExpanded={true} />
            </div>

            {/* --- LAYER 5: PRO ECOSYSTEM (HỆ SINH THÁI PRO) --- */}
            <div className="px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={16} className="text-indigo-400" /> DigiWell Intelligence
                </h3>
                {!isPremium && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_#f59e0b]">Upgrade</span>}
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Trạng thái đồng bộ</h4>
                  <p className="text-slate-400 text-xs mt-0.5">HealthKit, Thiết bị, Lịch trình</p>
                </div>
                <div className="flex -space-x-2">
                    {isWatchConnected && <div className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-slate-950 flex items-center justify-center"><Activity size={12} className="text-rose-400"/></div>}
                    {isWeatherSynced && <div className="w-8 h-8 rounded-full bg-sky-500/20 border-2 border-slate-950 flex items-center justify-center"><CloudSun size={12} className="text-sky-400"/></div>}
                    {isCalendarSynced && <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-slate-950 flex items-center justify-center"><Calendar size={12} className="text-purple-400"/></div>}
                    {(!isWatchConnected && !isWeatherSynced && !isCalendarSynced) && <span className="text-xs font-bold text-slate-500">Chưa có</span>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* MODAL LỊCH SỬ UỐNG NƯỚC THEO NGÀY (CALENDAR VIEW) */}
      <AnimatePresence>
        {selectedDateModal && (
          <div key="selected-date-modal" className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedDateModal(null)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md rounded-t-[2.5rem] p-6 pb-12 bg-slate-900 border-t border-white/10 shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0" />

              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Nhật ký ngày
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {new Date(selectedDateModal.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </h3>
                </div>
                <button onClick={() => setSelectedDateModal(null)} aria-label="Đóng nhật ký" title="Đóng" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {(() => {
                if (!selectedDateModal) return null;
                
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isSelectedToday = selectedDateModal.date === todayStr;
                
                const entriesInStore = waterEntries?.filter((e: any) => e.day === selectedDateModal.date) || [];
                const hasEntriesInStore = entriesInStore.length > 0;
                const hasStoreData = hasEntriesInStore || isSelectedToday;
                
                const displayLogs = hasEntriesInStore ? entriesInStore : dayLogs;
                const displayTotalMl = hasEntriesInStore ? entriesInStore.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) : (isSelectedToday ? waterIntake : selectedDateModal.ml);
                
                if (isDayLogsLoading) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 flex-1">
                      <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
                      <p className="text-slate-400 text-sm font-medium">Đang tải lịch sử...</p>
                    </div>
                  );
                }
                
                if (displayLogs.length === 0) {
                  return (
                    <div className="text-center py-16 flex-1">
                      <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Droplets size={30} className="text-slate-600" />
                      </div>
                  <p className="text-slate-300 font-bold mb-1">Chưa có dữ liệu</p>
                  <p className="text-slate-500 text-sm mb-6">Bạn chưa ghi nhận lần uống nước nào cho ngày này.</p>
                  <button onClick={() => setSelectedDateModal(null)} className="px-6 py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 font-bold text-sm active:scale-95 transition-all border border-cyan-500/20 hover:bg-cyan-500/20">
                    Đóng
                  </button>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide flex-1">
                      {displayLogs.map((entry: any, index: number) => {
                        const timeStr = new Date(entry.created_at || entry.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const amount = entry.amount || 0;

                        return (
                          <div key={entry.id || index} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                              <Droplets size={18} className="text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-white text-lg">
                                {amount}<span className="text-xs text-slate-500 ml-1">ml</span>
                              </p>
                              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                <Clock size={10} />
                                {timeStr} •
                                {entry.name === 'DigiBottle' ? (
                                  <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 border border-cyan-500/20">
                                    <Bluetooth size={10} /> Từ DigiBottle
                                  </span>
                                ) : (
                                  <span>{entry.name || 'Nước lọc'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end shrink-0">
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Tổng nạp</p>
                        <p className="text-3xl font-black text-white">
                          {displayTotalMl}
                          <span className="text-sm text-cyan-500 ml-1">ml</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{displayLogs.length} lần uống</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default InsightTab;
