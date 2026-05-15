import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { exportHealthReportPDF } from '@/lib/pdfExport';
import { exportToCSV, exportDetailedPDF } from '@/lib/exportUtils';
import { useUIStore } from '@/store/useUIStore';

import type { Profile } from '@/models';
import { AppStorage } from '@/lib/storage';

interface UseFastingAndReportsOptions {
  userId: string | undefined;
  isPremium: boolean;
  setShowPremiumModal: (value: boolean) => void;
}

interface ExportPdfOptions {
  profile: Record<string, unknown> | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  progress: number;
  isWatchConnected: boolean;
  watchData: Record<string, unknown> | null;
  weeklyChartData?: Record<string, unknown>[];
  waterEntries?: Record<string, unknown>[];
  avgWeekly?: number;
  completionRate?: number;
}

interface ExportCsvOptions {
  profile: Record<string, unknown> | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  weeklyChartData: { d: string; ml: number }[];
  waterEntries: Record<string, unknown>[];
}

const FASTING_PLAN_PREFIX = 'digiwell_fasting_plan_';
const FASTING_START_PREFIX = 'digiwell_fasting_start_';

function getFastingPlanStorageKey(userId: string) {
  return `${FASTING_PLAN_PREFIX}${userId}`;
}

function getFastingStartStorageKey(userId: string) {
  return `${FASTING_START_PREFIX}${userId}`;
}

function readStoredNumber(key: string, fallback: number) {
  const raw = AppStorage.getItem(key);
  if (!raw) return fallback;

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hashUserId(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFastingNotificationIds(userId: string) {
  const base = 500000 + (hashUserId(userId) % 100000) * 10;
  return {
    coaching: base + 1,
    hydration: base + 2,
  };
}

export function useFastingAndReports({
  userId,
  isPremium,
  setShowPremiumModal,
}: UseFastingAndReportsOptions) {
  const [isFastingMode, setIsFastingMode] = useState(false);
  const [fastingPlanHours, setFastingPlanHours] = useState(16);
  const showFastingModal = useUIStore(s => s.showFastingModal);
  const setShowFastingModal = (val: boolean) => useUIStore.getState().setShowFastingModal(val);
  const [fastingStartTime, setFastingStartTime] = useState<number | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    if (!userId || userId === 'undefined') {
      setIsFastingMode(false);
      setFastingPlanHours(16);
      setFastingStartTime(null);
      return;
    }

    const planKey = getFastingPlanStorageKey(userId);
    const startKey = getFastingStartStorageKey(userId);
    const nextPlanHours = readStoredNumber(planKey, 16);
    const nextStartTime = readStoredNumber(startKey, 0);

    setFastingPlanHours(nextPlanHours);
    setFastingStartTime(nextStartTime > 0 ? nextStartTime : null);
    setIsFastingMode(nextStartTime > 0);
  }, [userId]);

  const cancelFastingNotifications = useCallback(async (targetUserId: string) => {
    const ids = getFastingNotificationIds(targetUserId);

    try {
      const pending = await LocalNotifications.getPending();
      const fastingNotifs = pending.notifications.filter(notification => (
        notification.id === ids.coaching || notification.id === ids.hydration
      ));

      if (fastingNotifs.length > 0) {
        await LocalNotifications.cancel({ notifications: fastingNotifs });
      }
    } catch (e) { console.error('Failed to cancel notifications:', e); }
  }, []);

const exportReportPdf = useCallback(async ({
     profile,
     waterIntake,
     waterGoal,
     streak,
     progress,
     isWatchConnected,
     watchData,
     weeklyChartData,
     waterEntries,
     avgWeekly,
     completionRate,
   }: ExportPdfOptions) => {
     if (!isPremium) {
       setShowPremiumModal(true);
       return;
     }

     setIsExportingPDF(true);
     const toastId = toast.loading('Đang tạo báo cáo Y khoa PDF...');

      try {
        if (weeklyChartData && waterEntries) {
          await exportDetailedPDF({
            profile: profile as unknown as Profile | null,
            waterIntake,
            waterGoal,
            streak,
            weeklyChartData: weeklyChartData as unknown as { d: string; ml: number }[],
            waterEntries: waterEntries as unknown as Record<string, unknown>[],
            avgWeekly: avgWeekly || 0,
            completionRate: completionRate || 0,
          });
        } else {
          await exportHealthReportPDF({
            profile: profile as unknown as Profile | null,
           waterIntake,
           waterGoal,
           streak,
           progress,
           isWatchConnected,
           watchData,
         });
       }

       toast.success('Da mo giao dien in. Chon Save as PDF de luu bao cao.', { id: toastId });
     } catch {
       toast.error('Khong the tao bao cao PDF luc nay.', { id: toastId });
     } finally {
       setIsExportingPDF(false);
     }
   }, [isPremium, setShowPremiumModal]);

   const exportReportCsv = useCallback(({
     profile,
     waterIntake,
     waterGoal,
     streak,
     weeklyChartData,
     waterEntries,
   }: ExportCsvOptions) => {
     if (!isPremium) {
       setShowPremiumModal(true);
       return;
     }

      try {
        exportToCSV({
          profile: profile as unknown as Profile | null,
         waterIntake,
         waterGoal,
         streak,
         weeklyChartData,
         waterEntries,
       });
       toast.success('Đã xuất file CSV thành công!');
     } catch {
       toast.error('Không thể xuất file CSV lúc này.');
     }
   }, [isPremium, setShowPremiumModal]);

  const toggleFastingMode = useCallback(() => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setShowFastingModal(true);
  }, [isPremium, setShowPremiumModal]);

  const startFasting = useCallback(async (hours: number) => {
    if (!userId || userId === 'undefined') {
      toast.error('Khong the bat fasting khi chua xac dinh duoc tai khoan.');
      return;
    }

    setFastingPlanHours(hours);
    AppStorage.setItem(getFastingPlanStorageKey(userId), hours.toString());
    setIsFastingMode(true);

    const startedAt = Date.now();
    setFastingStartTime(startedAt);
    AppStorage.setItem(getFastingStartStorageKey(userId), startedAt.toString());
    toast.success(`Bật Fasting ${hours}:${24 - hours}. Bắt đầu đếm giờ!`);
    setShowFastingModal(false);

    try {
      const ids = getFastingNotificationIds(userId);
      await cancelFastingNotifications(userId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: ids.coaching,
            title: '🔥 Giữ vững trạng thái Fasting!',
            body: 'Hãy uống một ly trà xanh hoặc cà phê đen (không đường) để tăng cường đốt mỡ nhé!',
            schedule: { at: new Date(startedAt + 4 * 60 * 60 * 1000), allowWhileIdle: true },
            sound: 'water_drop.wav',
            actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
            extra: { amount: 250, name: 'Trà/Cà phê đen', userId },
          },
          {
            id: ids.hydration,
            title: '💧 Bù nước khi Nhịn ăn',
            body: 'Nhịn ăn dễ gây mất điện giải, hãy nạp thêm 250ml nước khoáng nào!',
            schedule: { at: new Date(startedAt + 8 * 60 * 60 * 1000), allowWhileIdle: true },
            sound: 'water_drop.wav',
            actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
            extra: { amount: 250, name: 'Nước khoáng', userId },
          },
        ],
      });
    } catch (e) { console.error('Failed to schedule notifications:', e); }
  }, [cancelFastingNotifications, userId]);

  const stopFasting = useCallback(async () => {
    if (!userId || userId === 'undefined') {
      setIsFastingMode(false);
      setFastingStartTime(null);
      setShowFastingModal(false);
      return;
    }

    setIsFastingMode(false);
    setFastingStartTime(null);
    AppStorage.removeItem(getFastingStartStorageKey(userId));
    toast.info('Đã kết thúc chế độ Nhịn ăn gián đoạn.');
    setShowFastingModal(false);
    await cancelFastingNotifications(userId);
  }, [cancelFastingNotifications, userId]);

  const fastingTotalMs = useMemo(() => fastingPlanHours * 60 * 60 * 1000, [fastingPlanHours]);

  return {
    isFastingMode,
    fastingPlanHours,
    showFastingModal,
    fastingStartTime,
    isExportingPDF,
    fastingTotalMs,
    setShowFastingModal,
    exportReportPdf,
    exportReportCsv,
    toggleFastingMode,
    startFasting,
    stopFasting,
  };
}
