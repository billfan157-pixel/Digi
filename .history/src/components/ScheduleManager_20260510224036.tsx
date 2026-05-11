import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Save, ChevronUp, ChevronDown, Settings2, Sparkles, AlertTriangle } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { AppStorage } from '@/lib/storage';
import type { HydrationSchedule } from '@/lib/HydrationEngine';
import type { CalendarEventItem } from '../hooks/useCalendarSync';
import { useSmartSchedule } from '../hooks/useSmartSchedule';

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
  alwaysExpanded?: boolean;
  aiSchedule?: HydrationSchedule[] | null;
  waterGoal?: number;
  calendarEvents?: CalendarEventItem[];
}

export default function ScheduleManager({ 
  profile, 
  isOpen = false, 
  onOpenChange,
  alwaysExpanded = false,
  aiSchedule = null,
  waterGoal = 2000,
  calendarEvents = [],
}: ScheduleManagerProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(alwaysExpanded || isOpen);
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[]>([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    const saved = AppStorage.getItem(`digiwell_custom_schedule_${profile?.id}`);
    if (saved) {
      try { 
        setCustomSchedule(JSON.parse(saved)); 
      } catch(e) {}
    }
  }, [profile?.id]);

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

  const applyAiSchedule = () => {
    if (!aiSchedule || aiSchedule.length === 0) return;

    // Dùng smart schedule nếu có calendar events
    const source = calendarEvents.length > 0
      ? useSmartSchedule(aiSchedule, calendarEvents, waterGoal).schedule
      : aiSchedule.map(s => ({ time: s.time, amount: s.amount, note: s.note || '', isAdjusted: false }));

    const mapped: ScheduleItem[] = source.map(s => ({
      time: s.time,
      amount: s.amount,
      note: s.note || '',
    }));
    setCustomSchedule(mapped);
    setIsEditingSchedule(true);
    toast.success('Đã tải lịch đề xuất từ AI. Bạn có thể chỉnh sửa trước khi lưu.');
  };

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
    
    if (profile?.id) {
      AppStorage.setItem(`digiwell_custom_schedule_${profile.id}`, JSON.stringify(customSchedule));
    }

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        toast.warning('Bạn chưa cấp quyền thông báo nên DigiWell chưa thể nhắc theo lịch trình.');
        return;
      }

      const pending = await LocalNotifications.getPending();
      const oldNotifs = pending.notifications.filter(n => n.id >= 1000 && n.id <= 1050);
      if (oldNotifs.length > 0) {
        await LocalNotifications.cancel({ notifications: oldNotifs });
      }

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
      const warningMsg = goalDeviation.status !== 'ok'
        ? ` (${totalMl}/${waterGoal}ml — ${goalDeviation.status === 'low' ? 'thiếu' : 'vượt'} mục tiêu)`
        : '';
      toast.success(`Đã bật ${notificationsToSchedule.length} nhắc nhở${warningMsg}.`);
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

  const hasAiSchedule = aiSchedule && aiSchedule.length > 0 && customSchedule.length === 0;

  // Compute smart schedule once at component level
  const smartResult = useMemo(
    () => calendarEvents.length > 0 && aiSchedule
      ? require('../hooks/useSmartSchedule').useSmartSchedule(aiSchedule, calendarEvents, waterGoal)
      : null,
    [aiSchedule, calendarEvents, waterGoal]
  );

  const applyAiSchedule = useCallback(() => {
    if (!aiSchedule || aiSchedule.length === 0) return;

    // Dùng smart schedule nếu có calendar events
    const source = smartResult
      ? smartResult.schedule
      : aiSchedule.map(s => ({ time: s.time, amount: s.amount, note: s.note || '', isAdjusted: false }));

    const mapped: ScheduleItem[] = source.map(s => ({
      time: s.time,
      amount: s.amount,
      note: s.note || '',
    }));
    setCustomSchedule(mapped);
    setIsEditingSchedule(true);
    toast.success(smartResult
      ? `Đã tải lịch tối ưu — ${smartResult.totalAdjustedCount} mốc được điều chỉnh theo lịch họp.`
      : 'Đã tải lịch đề xuất từ AI. Bạn có thể chỉnh sửa trước khi lưu.');
  }, [aiSchedule, smartResult]);

  return (
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Save, ChevronUp, ChevronDown, Settings2, Sparkles, AlertTriangle } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { AppStorage } from '@/lib/storage';
import type { HydrationSchedule } from '@/lib/HydrationEngine';
import type { CalendarEventItem } from '../hooks/useCalendarSync';
import { useSmartSchedule } from '../hooks/useSmartSchedule';

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
  alwaysExpanded?: boolean;
  aiSchedule?: HydrationSchedule[] | null;
  waterGoal?: number;
  calendarEvents?: CalendarEventItem[];
}

export default function ScheduleManager({ 
  profile, 
  isOpen = false, 
  onOpenChange,
  alwaysExpanded = false,
  aiSchedule = null,
  waterGoal = 2000,
  calendarEvents = [],
}: ScheduleManagerProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(alwaysExpanded || isOpen);
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[]>([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    const saved = AppStorage.getItem(`digiwell_custom_schedule_${profile?.id}`);
    if (saved) {
      try { 
        setCustomSchedule(JSON.parse(saved)); 
      } catch(e) {}
    }
  }, [profile?.id]);

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

  const applyAiSchedule = () => {
    if (!aiSchedule || aiSchedule.length === 0) return;

    // Dùng smart schedule nếu có calendar events
    const source = calendarEvents.length > 0
      ? useSmartSchedule(aiSchedule, calendarEvents, waterGoal).schedule
      : aiSchedule.map(s => ({ time: s.time, amount: s.amount, note: s.note || '', isAdjusted: false }));

    const mapped: ScheduleItem[] = source.map(s => ({
      time: s.time,
      amount: s.amount,
      note: s.note || '',
    }));
    setCustomSchedule(mapped);
    setIsEditingSchedule(true);
    toast.success('Đã tải lịch đề xuất từ AI. Bạn có thể chỉnh sửa trước khi lưu.');
  };

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
    
    if (profile?.id) {
      AppStorage.setItem(`digiwell_custom_schedule_${profile.id}`, JSON.stringify(customSchedule));
    }

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        toast.warning('Bạn chưa cấp quyền thông báo nên DigiWell chưa thể nhắc theo lịch trình.');
        return;
      }

      const pending = await LocalNotifications.getPending();
      const oldNotifs = pending.notifications.filter(n => n.id >= 1000 && n.id <= 1050);
      if (oldNotifs.length > 0) {
        await LocalNotifications.cancel({ notifications: oldNotifs });
      }

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
      const warningMsg = goalDeviation.status !== 'ok'
        ? ` (${totalMl}/${waterGoal}ml — ${goalDeviation.status === 'low' ? 'thiếu' : 'vượt'} mục tiêu)`
        : '';
      toast.success(`Đã bật ${notificationsToSchedule.length} nhắc nhở${warningMsg}.`);
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

