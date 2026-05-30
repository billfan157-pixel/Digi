import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { exportHealthReportPDF } from '@/lib/pdfExport';
import { supabase } from '@/lib/supabase';
import { exportToCSV, exportDetailedPDF, exportToJSON, exportFullDataAsJSON, fetchAllUserData } from '@/lib/exportUtils';
import { useUIStore } from '@/store/useUIStore';

import { AppStorage } from '@/lib/storage';
import type { WaterLog } from '@/models';
import type { AppProfile } from '@/services/profile.service';

interface UseFastingAndReportsOptions {
  userId: string | undefined;
  isPremium: boolean;
  setShowPremiumModal: (value: boolean) => void;
}

interface ExportPdfOptions {
  profile: AppProfile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  progress: number;
  isWatchConnected: boolean;
  watchData: { heartRate?: number; steps?: number } | null;
  weeklyChartData?: { d: string; ml: number }[];
  waterEntries?: WaterLog[];
  avgWeekly?: number;
  completionRate?: number;
  dateRange?: { start: string; end: string } | null;
}

interface ExportCsvOptions {
  profile: AppProfile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  weeklyChartData: { d: string; ml: number }[];
  waterEntries: WaterLog[];
  dateRange?: { start: string; end: string } | null;
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
     dateRange,
   }: ExportPdfOptions) => {
     if (!isPremium) {
       setShowPremiumModal(true);
       return;
     }

     setIsExportingPDF(true);
      const toastId = toast.loading(i18n.t('fasting.creating_pdf'));

      try {
        if (weeklyChartData && waterEntries) {
          await exportDetailedPDF({
            profile,
            waterIntake,
            waterGoal,
            streak,
            weeklyChartData,
            waterEntries,
            avgWeekly: avgWeekly || 0,
            completionRate: completionRate || 0,
            isWatchConnected,
            watchData,
            dateRange,
          });
        } else {
          await exportHealthReportPDF({
            profile,
           waterIntake,
           waterGoal,
           streak,
           progress,
           isWatchConnected,
           watchData,
         });
       }

       toast.success(i18n.t('fasting.pdf_print'), { id: toastId });
     } catch {
       toast.error(i18n.t('fasting.pdf_failed'), { id: toastId });
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
     dateRange,
   }: ExportCsvOptions) => {
     if (!isPremium) {
       setShowPremiumModal(true);
       return;
     }

    try {
        exportToCSV({
          profile,
          waterIntake,
          waterGoal,
          streak,
          weeklyChartData,
          waterEntries,
          watchData: null,
          dateRange,
        });
        toast.success(i18n.t('fasting.csv_exported'));
      } catch {
        toast.error(i18n.t('fasting.csv_export_failed'));
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
      toast.error(i18n.t('fasting.cannot_start'));
      return;
    }

    setFastingPlanHours(hours);
    AppStorage.setItem(getFastingPlanStorageKey(userId), hours.toString());
    setIsFastingMode(true);

    const startedAt = Date.now();
    setFastingStartTime(startedAt);
    AppStorage.setItem(getFastingStartStorageKey(userId), startedAt.toString());
    toast.success(i18n.t('fasting.started', { start: hours, end: 24 - hours }));
    setShowFastingModal(false);

    try {
      const ids = getFastingNotificationIds(userId);
      await cancelFastingNotifications(userId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: ids.coaching,
            title: i18n.t('common.fasting_keep_up_title'),
            body: i18n.t('common.fasting_keep_up_body'),
            schedule: { at: new Date(startedAt + 4 * 60 * 60 * 1000), allowWhileIdle: true },
            sound: 'water_drop.wav',
            actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
            extra: { amount: 250, name: i18n.t('common.default_black_tea_coffee'), userId },
          },
          {
            id: ids.hydration,
            title: i18n.t('common.fasting_replenish_title'),
            body: i18n.t('common.fasting_replenish_body'),
            schedule: { at: new Date(startedAt + 8 * 60 * 60 * 1000), allowWhileIdle: true },
            sound: 'water_drop.wav',
            actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
            extra: { amount: 250, name: i18n.t('common.default_mineral_water'), userId },
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
    toast.info(i18n.t('fasting.ended'));
    setShowFastingModal(false);
    await cancelFastingNotifications(userId);
  }, [cancelFastingNotifications, userId]);

  const fastingTotalMs = useMemo(() => fastingPlanHours * 60 * 60 * 1000, [fastingPlanHours]);

   const exportReportJson = useCallback(({
     profile,
     waterIntake,
     waterGoal,
     streak,
     weeklyChartData,
     waterEntries,
     dateRange,
   }: ExportCsvOptions) => {
     if (!isPremium) {
       setShowPremiumModal(true);
       return;
     }

     try {
       exportToJSON({
         profile,
         waterIntake,
         waterGoal,
         streak,
         weeklyChartData,
         waterEntries,
         watchData: null,
         dateRange,
       });
        toast.success(i18n.t('fasting.json_exported'));
      } catch {
        toast.error(i18n.t('fasting.json_export_failed'));
     }
   }, [isPremium, setShowPremiumModal]);

   const exportAllData = useCallback(async (profileId: string) => {
     try {
       const allData = await fetchAllUserData(profileId);
       await exportFullDataAsJSON(allData);
       try {
         await supabase.rpc('log_audit_event', {
           p_event_type: 'data_exported',
           p_event_data: { type: 'full-json', version: 2, timestamp: new Date().toISOString() },
         });
       } catch { /* log fail không block export */ }
        toast.success(i18n.t('fasting.data_exported'));
      } catch (err) {
        console.error(err);
        toast.error(i18n.t('fasting.data_export_failed'));
     }
   }, []);

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
    exportReportJson,
    exportAllData,
    toggleFastingMode,
    startFasting,
    stopFasting,
  };
}
