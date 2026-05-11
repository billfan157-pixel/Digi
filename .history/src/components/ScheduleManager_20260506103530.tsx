import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Save, ChevronUp, ChevronDown, Settings2 } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { AppStorage } from '@/lib/storage';

interface ScheduleItem {
  time: string;
  amount: number;
  label?: string;
  note?: string;
}

interface ScheduleManagerProps {
  profile: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  alwaysExpanded?: boolean; // For use in modal/drawer
}

export default function ScheduleManager({ 
  profile, 
  isOpen = false, 
  onOpenChange,
  alwaysExpanded = false 
}: ScheduleManagerProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(alwaysExpanded || isOpen);
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[]>([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    // Khôi phục lại lịch trình đã lưu từ bộ nhớ đệm
    const saved = AppStorage.getItem(`digiwell_custom_schedule_${profile?.id}`);
    if (saved) {
      try { 
        setCustomSchedule(JSON.parse(saved)); 
      } catch(e) {}
    }
  }, [profile?.id]);

  const handleUpdateScheduleItem = (index: number, field: string, value: any) => {
    const newSchedule = [...customSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setCustomSchedule(newSchedule);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setCustomSchedule(customSchedule.filter((_, i) => i !== index));
  };

  const handleAddScheduleItem = () => {
    const newSchedule = [...customSchedule].sort((a, b) => a.time.localeCompare(b.time));
    const lastTime = newSchedule.length > 0 ? newSchedule[newSchedule.length - 1].time : "08:00";
    let [h, m] = lastTime.split(':').map(Number);
    h = (h + 1) % 24;
    const nextTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setCustomSchedule([...customSchedule, { time: nextTime, amount: 200, label: 'Mốc mới' }]);
  };

  const handleSaveSchedule = async () => {
    setIsEditingSchedule(false);
    
    // 1. Lưu cục bộ để không mất data khi tắt app
    if (profile?.id) {
      AppStorage.setItem(`digiwell_custom_schedule_${profile.id}`, JSON.stringify(customSchedule));
    }

    try {
      // 2. Yêu cầu hệ điều hành cấp quyền Push Notification
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        toast.warning('Bạn chưa cấp quyền thông báo nên DigiWell chưa thể nhắc theo lịch trình.');
        return;
      }

      // 3. Xóa sạch các mốc nhắc nhở lịch trình cũ (Dùng ID từ 1000 -> 1050 để phân biệt)
      const pending = await LocalNotifications.getPending();
      const oldNotifs = pending.notifications.filter(n => n.id >= 1000 && n.id <= 1050);
      if (oldNotifs.length > 0) {
        await LocalNotifications.cancel({ notifications: oldNotifs });
      }

      // Đăng ký các nút bấm (Actions) cho thông báo với hệ điều hành
      await LocalNotifications.registerActionTypes({
        types: [{
          id: 'SCHEDULE_REMINDER_ACTIONS',
          actions: [
            { id: 'add_100', title: 'Uống 100ml' },
            { id: 'add_250', title: 'Uống 250ml' },
            { id: 'snooze_10', title: 'Nhắc sau 10 phút' }
          ]
        }]
      });

      const equippedSound = profile?.equipped_notification_sound || 'water_drop.wav';

      // 4. Lên lịch thông báo lặp lại hàng ngày theo mốc giờ
      const notificationsToSchedule = customSchedule.map((item, index) => {
        const [hour, minute] = item.time.split(':').map(Number);
        return {
          id: 1000 + index,
          title: 'DigiWell - Đến giờ uống nước',
          body: item.note || `Đã đến mốc ${item.time}. Hãy uống ${item.amount}ml nước.`,
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          sound: equippedSound,
          actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
          extra: { amount: item.amount, name: item.note || item.label || 'Nước lọc' }
        };
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }
      toast.success('Đã bật nhắc nhở theo lịch trình.');
    } catch (err) {
      console.error("Lỗi Push Notification:", err);
      toast.error("Đã lưu nhưng tính năng thông báo không được hỗ trợ trên thiết bị này.");
    }
  };

  const toggleOpen = () => {
    if (!alwaysExpanded) {
      const newOpen = !isScheduleOpen;
      setIsScheduleOpen(newOpen);
      onOpenChange?.(newOpen);
    }
  };

  return (
    <div className="mt-8 px-2">
      {!alwaysExpanded && (
        <div 
          onClick={toggleOpen}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/60 active:scale-[0.98] transition-all"
        >
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Settings2 size={16} className="text-cyan-400" /> Quản lý lịch trình
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
            <div className="flex justify-end mb-4 mt-4">
              {!isEditingSchedule ? (
                <button onClick={() => setIsEditingSchedule(true)} className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 active:scale-95 transition-all">
                  Chỉnh sửa
                </button>
              ) : (
                <button onClick={handleSaveSchedule} 
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center gap-1">
                  <Save size={14} /> Lưu lại
                </button>
              )}
            </div>

            <div className="space-y-3 pb-4">
              {customSchedule.length > 0 ? (
                customSchedule.map((item, index) => (
                  <div key={index} className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex items-start sm:items-center justify-between ${isEditingSchedule ? 'bg-slate-800/80 border-cyan-500/40 shadow-lg' : 'bg-slate-800/40 border-white/5'}`}>
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600 text-cyan-400 shrink-0 mt-1 sm:mt-0">
                        <Clock size={18} />
                      </div>
                      
                      {isEditingSchedule ? (
                        <div className="flex-1 flex flex-col gap-2 min-w-0 pr-2">
                          <div className="flex gap-2">
                            <input type="time" value={item.time} onChange={(e) => handleUpdateScheduleItem(index, 'time', e.target.value)} className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-sm font-bold outline-none focus:border-cyan-500" />
                            <div className="relative flex-1">
                              <input type="number" value={item.amount} onChange={(e) => handleUpdateScheduleItem(index, 'amount', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-2.5 pr-8 py-2 text-white text-sm font-bold outline-none focus:border-cyan-500 text-right" />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold pointer-events-none">ml</span>
                            </div>
                          </div>
                          <input type="text" value={item.note ?? item.label ?? ''} onChange={(e) => handleUpdateScheduleItem(index, 'note', e.target.value)} placeholder="Ghi chú (VD: Uống sau khi dậy)..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-xs outline-none focus:border-cyan-500" />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-white">{item.time}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{item.note ?? item.label}</p>
                        </div>
                      )}
                    </div>

                    {!isEditingSchedule && (
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xl font-black text-cyan-400">{item.amount}</span>
                        <span className="text-[10px] font-bold ml-1 uppercase tracking-wider text-slate-500">ml</span>
                      </div>
                    )}

                    {isEditingSchedule && (
                      <button onClick={() => handleRemoveScheduleItem(index)} className="ml-1 shrink-0 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 active:scale-95 transition-colors mt-1 sm:mt-0">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-900/50 rounded-2xl border border-white/5 border-dashed">
                  <Clock size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm font-bold">Chưa có mốc thời gian nào.</p>
                </div>
              )}

              {isEditingSchedule && (
                <button onClick={handleAddScheduleItem} className="w-full py-3.5 mt-2 rounded-xl border border-dashed border-cyan-500/40 text-cyan-400 bg-cyan-500/10 text-sm font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Thêm mốc giờ mới
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
