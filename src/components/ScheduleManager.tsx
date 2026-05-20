import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Save, ChevronUp, ChevronDown, Settings2, Sparkles, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { AppStorage } from '@/lib/storage';
import type { HydrationSchedule } from '@/lib/HydrationEngine';
import type { CalendarEventItem } from '../hooks/useCalendarSync';
import { useSmartSchedule } from '../hooks/useSmartSchedule';
import { useAdaptiveHydration } from '../hooks/useAdaptiveHydration';
import type { WaterLog } from '../models';

interface ScheduleItem {
  time: string;
  amount: number;
  label?: string;
  note?: string;
}

interface ScheduleManagerProps {
  profile: Record<string, unknown> | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysExpanded?: boolean;
  aiSchedule?: HydrationSchedule[] | null;
  waterGoal?: number;
  calendarEvents?: CalendarEventItem[];
  dateKey?: string; // e.g. "today" | "tomorrow"
  waterEntries?: WaterLog[];
}

export default function ScheduleManager({ 
  profile, 
  isOpen = false, 
  alwaysExpanded = false,
  aiSchedule = null,
  waterGoal = 2000,
  calendarEvents = [],
  dateKey = 'today',
  waterEntries = [],
}: ScheduleManagerProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(isOpen || alwaysExpanded);
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[]>([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    const key = profile?.id ? `${dateKey}_${profile.id}` : '';
    if (!key) return;
    
    const saved = AppStorage.getItem(`digiwell_custom_schedule_${key}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => setCustomSchedule(parsed), 0);
      } catch {
        setTimeout(() => setCustomSchedule([]), 0);
      }
    } else {
      setTimeout(() => setCustomSchedule([]), 0);
    }
  }, [profile?.id, dateKey]);

  const totalMl = useMemo(() =>
    customSchedule.reduce((sum, item) => sum + item.amount, 0),
    [customSchedule]
  );

  const goalDeviation = useMemo(() => {
    if (waterGoal === 0) return { pct: 0, status: 'ok' as const };
    const pct = (totalMl / waterGoal) * 100;
    if (pct < 85) return { pct, status: 'low' as const };
    if (pct > 115) return { pct, status: 'high' as const };
    return { pct, status: 'ok' as const };
  }, [totalMl, waterGoal]);

  // Adaptive suggestions based on behavior
  const { suggestions } = useAdaptiveHydration(waterEntries, customSchedule);

  // Smart schedule khi có calendar events
  const calculatedSmartSchedule = useSmartSchedule(aiSchedule, calendarEvents, waterGoal);
  const smartScheduleResult = calendarEvents.length > 0 && aiSchedule && aiSchedule.length > 0
    ? calculatedSmartSchedule
    : null;

  const applyAiSchedule = () => {
    if (!aiSchedule || aiSchedule.length === 0) return;

    const source: Array<{ time: string; amount: number; note: string; isAdjusted?: boolean }> =
      smartScheduleResult
        ? smartScheduleResult.schedule
        : aiSchedule.map((s: { time: string; amount: number; note?: string }) => ({
            time: s.time,
            amount: s.amount,
            note: s.note || '',
            isAdjusted: false,
          }));

    const mapped: ScheduleItem[] = source.map((s: { time: string; amount: number; note: string; isAdjusted?: boolean }) => ({
    time: s.time,
    amount: s.amount,
    note: s.note || '',
  }));
    setCustomSchedule(mapped);
    setIsEditingSchedule(true);
    
    const dayLabel = dateKey === 'tomorrow' ? 'ngày mai' : 'hôm nay';
    if (smartScheduleResult && smartScheduleResult.totalAdjustedCount > 0) {
      toast.success(`Đã tải lịch tối ưu cho ${dayLabel} — ${smartScheduleResult.totalAdjustedCount} mốc được điều chỉnh.`);
    } else {
      toast.success(`Đã tải lịch đề xuất từ AI cho ${dayLabel}.`);
    }
  };

  const handleUpdateScheduleItem = (index: number, field: string, value: unknown) => {
    const newSchedule = [...customSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setCustomSchedule(newSchedule);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setCustomSchedule(customSchedule.filter((_, i) => i !== index));
  };

  const handleAddScheduleItem = () => {
    const newSchedule = [...customSchedule];
    const lastItem = newSchedule.length > 0 ? newSchedule[newSchedule.length - 1] : { time: "08:00" };
    const parts = lastItem.time.split(':').map(Number);
    const h = (parts[0] + 1) % 24;
    const m = parts[1];
    const nextTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setCustomSchedule([...customSchedule, { time: nextTime, amount: 200, label: 'Mốc mới' }]);
  };

  const handleSaveSchedule = async () => {
    setIsEditingSchedule(false);
    
    const key = profile?.id ? `${dateKey}_${profile.id}` : '';
    if (key) {
      AppStorage.setItem(`digiwell_custom_schedule_${key}`, JSON.stringify(customSchedule));
    }

    if (Capacitor.getPlatform() === 'web') {
      const dayLabel = dateKey === 'tomorrow' ? 'ngày mai' : 'hôm nay';
      toast.success(`Đã lưu lịch ${dayLabel}. Thông báo chỉ hoạt động trên app di động.`);
      return;
    }

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;

      const pending = await LocalNotifications.getPending();
      // ID range cho today: 1000-1050, tomorrow: 1100-1150
      const startId = dateKey === 'tomorrow' ? 1100 : 1000;
      const endId = startId + 50;
      
      const oldNotifs = pending.notifications.filter(n => n.id >= startId && n.id <= endId);
      if (oldNotifs.length > 0) {
        await LocalNotifications.cancel({ notifications: oldNotifs });
      }

      const equippedSound = profile?.equipped_notification_sound || 'water_drop.wav';
      const dayLabel = dateKey === 'tomorrow' ? 'Ngày mai' : 'Hôm nay';

      const notificationsToSchedule = customSchedule.map((item, index) => {
        const [hour, minute] = item.time.split(':').map(Number);
        
        // Tính toán schedule date
        const scheduleDate = new Date();
        if (dateKey === 'tomorrow') scheduleDate.setDate(scheduleDate.getDate() + 1);
        scheduleDate.setHours(hour, minute, 0, 0);

        return {
          id: startId + index,
          title: `DigiWell - Lịch ${dayLabel}`,
          body: item.note || `Đã đến mốc ${item.time}. Hãy uống ${item.amount}ml nước.`,
          schedule: { at: scheduleDate, allowWhileIdle: true },
          sound: String(equippedSound),
          extra: { amount: item.amount, name: item.note || item.label || 'Nước lọc' }
        };
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }
      toast.success(`Đã bật ${notificationsToSchedule.length} nhắc nhở cho ${dayLabel.toLowerCase()}.`);
    } catch {
      toast.error("Lỗi cài đặt thông báo.");
    }
  };

  const hasAiSchedule = aiSchedule && aiSchedule.length > 0 && customSchedule.length === 0;
  const hasCalendarOptimizedSchedule = !!smartScheduleResult && smartScheduleResult.busyEventCount > 0;
  const canRefreshFromAiSchedule = aiSchedule && aiSchedule.length > 0 && customSchedule.length > 0 && !isEditingSchedule;

  return (
    <div className="w-full">
      {!alwaysExpanded && (
        <div 
          onClick={() => !alwaysExpanded && setIsScheduleOpen(!isScheduleOpen)}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/60 transition-all"
        >
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Settings2 size={16} className="text-cyan-400" /> Quản lý lịch {dateKey === 'tomorrow' ? 'ngày mai' : 'hôm nay'}
          </h3>
          {isScheduleOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      )}

      <AnimatePresence>
        {isScheduleOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Tổng ml */}
            {customSchedule.length > 0 && (
              <div className={`mt-4 mb-3 p-3 rounded-xl border flex items-center justify-between ${
                goalDeviation.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Dự kiến: <span className={goalDeviation.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}>{totalMl}ml</span>
                  </span>
                  <span className="text-xs text-slate-400">/ {waterGoal}ml</span>
                </div>
                {goalDeviation.status === 'ok' ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Đủ chỉ tiêu</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                    <AlertTriangle size={12} /> {goalDeviation.status === 'low' ? 'Hơi ít' : 'Hơi nhiều'}
                  </span>
                )}
              </div>
            )}

            {/* AI Adaptive Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-violet-400" />
                  <span className="text-[11px] font-black text-violet-300 uppercase tracking-widest">DigiWell Adaptive AI</span>
                </div>
                {suggestions.map((s, i) => (
                  <div key={i} className="text-[11px] text-slate-300 leading-relaxed mb-2 last:mb-0">
                    {s.reason}
                  </div>
                ))}
                <p className="text-[9px] text-slate-500 italic mt-2">* Nhấn "Sửa lịch" để điều chỉnh theo gợi ý của AI.</p>
              </div>
            )}

            {/* Nút nạp lịch AI */}
            {hasAiSchedule && (
              <button
                onClick={applyAiSchedule}
                className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-white flex items-center justify-between active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Sparkles size={20} className="text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-cyan-100">Dùng đề xuất AI {dateKey === 'tomorrow' ? 'ngày mai' : 'hôm nay'}</p>
                    <p className="text-[10px] text-slate-400">
                      {hasCalendarOptimizedSchedule
                        ? `Đã tính toán né ${smartScheduleResult.busyEventCount} lịch họp`
                        : "Dựa trên hồ sơ sức khỏe và thời tiết"}
                    </p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-cyan-400 rotate-[-90deg]" />
              </button>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 mb-4">
              {canRefreshFromAiSchedule && (
                <button onClick={applyAiSchedule} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 text-[11px] font-bold border border-cyan-500/20 flex items-center gap-1">
                  <Sparkles size={12} /> Tối ưu {dateKey === 'tomorrow' ? 'mai' : 'nay'}
                </button>
              )}
              {!isEditingSchedule ? (
                <button disabled={customSchedule.length === 0} onClick={() => setIsEditingSchedule(true)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold border border-white/5 disabled:opacity-30">
                  Sửa lịch
                </button>
              ) : (
                <button onClick={handleSaveSchedule} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                  <Save size={12} /> Lưu {dateKey === 'tomorrow' ? 'mai' : 'nay'}
                </button>
              )}
            </div>

            <div className="space-y-2.5 pb-4">
              {customSchedule.length > 0 ? (
                customSchedule.map((item, index) => (
                  <div key={index} className={`p-3.5 rounded-2xl border flex items-center justify-between ${isEditingSchedule ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900/40 border-white/5'}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 border border-white/5">
                        <Clock size={14} />
                      </div>
                      {isEditingSchedule ? (
                        <div className="flex-1 flex gap-2">
                          <input type="time" value={item.time} onChange={(e) => handleUpdateScheduleItem(index, 'time', e.target.value)} className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold outline-none" />
                          <input type="number" value={item.amount} onChange={(e) => handleUpdateScheduleItem(index, 'amount', Number(e.target.value))} className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold outline-none text-right" />
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.time}</h4>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.note || item.label || 'Uống nước'}</p>
                        </div>
                      )}
                    </div>
                    
                    {!isEditingSchedule ? (
                      <div className="text-right">
                        <span className="text-sm font-black text-cyan-400">{item.amount}</span>
                        <span className="text-[9px] font-bold ml-0.5 text-slate-600">ML</span>
                      </div>
                    ) : (
                      <button onClick={() => handleRemoveScheduleItem(index)} className="text-rose-500 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl">
                  <p className="text-xs text-slate-500">Chưa có lịch cho {dateKey === 'tomorrow' ? 'ngày mai' : 'hôm nay'}</p>
                </div>
              )}
              
              {isEditingSchedule && (
                <button onClick={handleAddScheduleItem} className="w-full py-2.5 border border-dashed border-cyan-500/30 rounded-xl text-cyan-400 text-[11px] font-bold bg-cyan-500/5 mt-1">
                  + Thêm mốc giờ
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
