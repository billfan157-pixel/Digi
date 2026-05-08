import React, { useMemo, useState, useEffect, memo, useCallback } from 'react';
import { 
  BarChart2, Cpu, RefreshCw, ArrowUpRight, 
  Target, Flame, ChevronRight, Droplets,
  TrendingUp, Calendar, Zap, FileText, Crown,
  X, Clock, Bluetooth, Loader2, Check,
  Settings2, PlusCircle, Trash2, Save,
  ChevronUp, ChevronDown
  Cpu, RefreshCw, Droplets, FileText, Crown, 
  X, Clock, Bluetooth, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HealthReport } from '../lib/aiReports';
import { toast } from 'sonner';
import WaterBreakdown from '../components/WaterBreakdown';
import { LocalNotifications } from '@capacitor/local-notifications';
import WeeklyReportCard from '../components/ui/WeeklyReportCard';
import { Skeleton } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import AvatarFrame from '../components/AvatarFrame';
import type { Profile } from '../models';
import type { WaterLog } from '../models';
import type { WaterIntakeResult } from '../lib/HydrationEngine';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { useShallow } from 'zustand/react/shallow';

import { AppStorage } from '@/lib/storage';
import { AdvancedStatsGrid } from './AdvancedStatsGrid';
import ScheduleManager from '../components/ScheduleManager';
import CalendarView from '../components/CalendarView';
import BasicTodayRingUpgraded from '../components/BasicTodayRingUpgraded';
import WeeklyChart from '../components/WeeklyChart';

interface InsightTabProps {
  isExportingPDF: boolean;
  handleExportPDF: () => void;
  isAiLoading: boolean;
  aiAdvice: string;
  fetchAIAdvice: () => void;
  weeklyReport: HealthReport | null;
  isWeeklyReportLoading: boolean;
  generateWeeklyReport: () => void;
}

const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl";

const InsightTab = memo(function InsightTab({
  isExportingPDF, handleExportPDF,
  isAiLoading, aiAdvice, fetchAIAdvice,
  weeklyReport, isWeeklyReportLoading, generateWeeklyReport
}: InsightTabProps) {
  
  const { profile, isPremium, waterGoal, weeklyHistory: weeklyChartData, streak, hydrationResult, waterIntake, waterEntries } = useAppStore(useShallow((state) => ({
    profile: state.profile,
    isPremium: state.isPremium,
    waterGoal: state.waterGoal,
    weeklyHistory: state.weeklyHistory,
    streak: state.streak,
    hydrationResult: state.hydrationResult,
    waterIntake: state.waterIntake,
    waterEntries: state.waterEntries,
  })));
  const { setShowPremiumModal, setShowAiChat } = useUIStore(useShallow((state) => ({
    setShowPremiumModal: state.setShowPremiumModal,
    setShowAiChat: state.setShowAiChat,
  })));
  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // --- STATES CHO MODAL LỊCH SỬ NGÀY ---
  const [selectedDateModal, setSelectedDateModal] = useState<{date: string, ml: number} | null>(null);
  const [dayLogs, setDayLogs] = useState<WaterLog[]>([]);
  const [isDayLogsLoading, setIsDayLogsLoading] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, number>>({});
  const [isMonthDataLoading, setIsMonthDataLoading] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<{ d: string; ml: number } | null>(null);
  const [selectedCalendarCell, setSelectedCalendarCell] = useState<{ dayNum: number; ml: number; fullDate: string } | null>(null);

  const monthKey = useMemo(() => {
    return `${calendarDate.getFullYear()}-${calendarDate.getMonth()}`;
  }, [calendarDate]);

  const waterEntriesSig = useMemo(() => waterEntries?.map(e => e.id).join(','), [waterEntries]);

  useEffect(() => {
    let mounted = true;
    const fetchMonthData = async () => {
      if (!profile?.id) return;
      setIsMonthDataLoading(true);
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
      } finally {
        if (mounted) setIsMonthDataLoading(false);
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
      
      const entriesForDay = waterEntries?.filter(e => e.day === fullDateStr) || [];
      let ml = Number(monthlyDataMap[fullDateStr] || 0);
      if (entriesForDay.length > 0) {
        ml = entriesForDay.reduce((sum, e) => sum + (e.amount || 0), 0);
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

    const entriesInStore = waterEntries?.filter(e => e.day === dateStr) || [];
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
    const total = weeklyChartData.reduce((acc, curr) => acc + curr.ml, 0);
    const avg = total / weeklyChartData.length;
    const completed = weeklyChartData.filter(day => day.ml >= waterGoal).length;
    return { avg: Math.round(avg), completed };
  }, [weeklyChartData, waterGoal]);

  const completionRate = weeklyChartData.length === 0 ? 0 : Math.round((stats.completed / weeklyChartData.length) * 100);
  
  const weeklyTotal = useMemo(() => weeklyChartData.reduce((sum, d) => sum + d.ml, 0), [weeklyChartData]);
  const monthlyTotal = useMemo(() => Object.values(monthlyDataMap).reduce((sum, ml) => sum + ml, 0), [monthlyDataMap]);

  const breakdownData = hydrationResult?.breakdown ?? null;

  const yesterdayIntake = useMemo(() => {
    if (weeklyChartData.length >= 2) {
      return weeklyChartData[weeklyChartData.length - 2].ml;
    }
    return 0;
  }, [weeklyChartData]);

  const weeklyTrend = useMemo(() => {
    return weeklyChartData.map(d => {
      const pct = (d.ml / (waterGoal || 1)) * 100;
      return Math.min(Math.max(pct, 0), 100);
    });
  }, [weeklyChartData, waterGoal]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* --- PHẦN TIÊU ĐỀ --- */}
      <div className="flex justify-between items-start pt-6 pb-4 px-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">PHÂN TÍCH CHUYÊN SÂU</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Insight</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={isPremium ? handleExportPDF : () => setShowPremiumModal(true)}
            className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800 border border-white/10 text-white active:scale-95 transition-all duration-200 ease-out hover:bg-cyan-500/20"
          >
            {isExportingPDF ? <RefreshCw size={22} className="text-cyan-400 animate-spin" /> : <FileText size={22} className="text-cyan-400" />}
            {!isPremium && <Crown size={14} className="absolute -top-1.5 -right-1.5 text-amber-400 drop-shadow-md" />}
          </button>
          <div className="flex items-center justify-center">
            <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
          </div>
        </div>
      </div>

      {/* --- TODAY RING --- */}
      <div className="mt-2 mb-6">
        <BasicTodayRingUpgraded 
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          streak={streak}
          completionRate={completionRate}
          yesterdayIntake={yesterdayIntake}
          weeklyTrend={weeklyTrend}
        />
      </div>

      {/* --- TIME RANGE TOGGLE & CONTROLS --- */}
      <div className="px-6 flex justify-between items-center mb-2 mt-4">
        {timeRange === 'month' ? (
          <button 
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        ) : <div className="w-10" />}

        <div className="relative flex bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg w-full max-w-[200px]">
          {(['week', 'month'] as const).map((t) => {
            const isActive = timeRange === t;
            return (
              <button 
                key={t}
                onClick={() => setTimeRange(t)}
                className={`relative flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${isActive ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="insightTabIndicator"
                    className="absolute inset-0 bg-cyan-400 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                {t === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            );
          })}
        </div>

        {timeRange === 'month' ? (
          <button 
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        ) : <div className="w-10" />}
      </div>

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

      {/* Water Breakdown */}
      {breakdownData && (
        <div className="mt-8 px-6">
          <WaterBreakdown breakdown={breakdownData} />
        </div>
      )}

      <div className="px-4">
        <ScheduleManager profile={profile} alwaysExpanded={false} />
      </div>

      {/* --- CÁC THÀNH PHẦN BÊN DƯỚI GIỮ NGUYÊN (STATS, WORKOUT, AI COACH) --- */}
      <AdvancedStatsGrid 
        weeklyTotal={weeklyTotal}
        monthlyTotal={monthlyTotal}
        stats={stats}
        weeklyChartData={weeklyChartData}
      />

      <WeeklyReportCard
        isPremium={isPremium}
        report={weeklyReport}
        isLoading={isWeeklyReportLoading}
        onGenerate={generateWeeklyReport}
        onUpgrade={() => setShowPremiumModal(true)}
      />

      <div 
        onClick={() => isPremium ? setShowAiChat(true) : setShowPremiumModal(true)}
        className="mx-6 relative group cursor-pointer active:scale-[0.98] transition-all duration-200 ease-out"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-blue-500/30 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-1000"></div>
        <div className={`${glassCard} p-8 bg-slate-900/80 border-white/10 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20 animate-[scan_3s_linear_infinite]" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Cpu size={22} className={`text-indigo-400 ${isAiLoading ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Neural Insight</span>
                <p className="text-[8px] text-indigo-400 font-bold uppercase mt-0.5">Core Active</p>
              </div>
            </div>
            {!isPremium ? (
              <span className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_#f59e0b]">PRO</span>
            ) : (
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-30" />
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 rounded-xl p-5 border border-white/5 backdrop-blur-sm mt-4">
            {isAiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                "{aiAdvice || 'Chạm để nhận phân tích chi tiết về trạng thái hydrat hóa của bạn.'}"
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Last Sync: Today, 12:04 AM</p>
             <button 
                onClick={(e: React.MouseEvent) => { 
                  e.stopPropagation(); 
                  isPremium ? fetchAIAdvice() : setShowPremiumModal(true); 
                }}
               className="p-2 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition-all duration-200 ease-out z-10"
             >
               <RefreshCw size={14} className={`text-slate-500 hover:text-cyan-400 ${isAiLoading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      </div>

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
                <button onClick={() => setSelectedDateModal(null)} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {(() => {
                if (!selectedDateModal) return null;
                
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isSelectedToday = selectedDateModal.date === todayStr;
                
                const entriesInStore = waterEntries?.filter(e => e.day === selectedDateModal.date) || [];
                const hasStoreData = entriesInStore.length > 0 || isSelectedToday;
                
                const displayLogs = hasStoreData ? entriesInStore : dayLogs;
                const displayTotalMl = hasStoreData ? entriesInStore.reduce((sum, e) => sum + (e.amount || 0), 0) : selectedDateModal.ml;
                
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
                      <p className="text-slate-400 font-medium">
                        Ngày này đệ chưa uống giọt nào...
                      </p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide flex-1">
                      {displayLogs.map((entry, index) => {
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
