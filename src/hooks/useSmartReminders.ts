/**
 * Sprint 13-14: AI Personalization Engine
 * Hook quản lý smart reminders
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  generateSmartReminders,
  cacheReminders,
  type SmartReminder,
  type ReminderInput,
} from '../lib/smartReminderEngine';
import type { UserHydrationPattern } from '../lib/patternEngine';
import type { CalendarEventItem } from './useCalendarSync';
import { supabase } from '../lib/supabase';

interface UseSmartRemindersProps {
  pattern: UserHydrationPattern | null;
  calendarEvents: CalendarEventItem[];
  weatherTemp: number | null;
  currentIntake: number;
  waterGoal: number;
  lastDrinkTime: string | null;
  userId: string | null;
  onQuickDrink?: (amount: number) => void;
}

interface UseSmartRemindersResult {
  activeReminders: SmartReminder[];
  currentReminder: SmartReminder | null;
  dismissReminder: () => void;
  snoozeReminder: (minutes?: number) => void;
  respondToReminder: (amount: number) => void;
  refreshReminders: () => void;
  canUseSmartReminders: boolean;
}

export function useSmartReminders({
  pattern,
  calendarEvents,
  weatherTemp,
  currentIntake,
  waterGoal,
  lastDrinkTime,
  userId,
  onQuickDrink,
}: UseSmartRemindersProps): UseSmartRemindersResult {
  const [allReminders, setAllReminders] = useState<SmartReminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<SmartReminder | null>(null);
  const snoozedUntilRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIntakeRef = useRef(currentIntake);
  const currentReminderIdRef = useRef<string | null>(null);

  useEffect(() => {
    lastIntakeRef.current = currentIntake;
  }, [currentIntake]);

  const generateReminders = useCallback(() => {
    if (!userId) return [];

    const now = new Date();
    const input: ReminderInput = {
      pattern,
      calendarEvents,
      weatherTemp,
      currentIntake: lastIntakeRef.current,
      waterGoal,
      lastDrinkTime,
      now,
    };

    const reminders = generateSmartReminders(input);
    setAllReminders(reminders);
    cacheReminders(userId, reminders);

    return reminders;
  }, [pattern, calendarEvents, weatherTemp, waterGoal, lastDrinkTime, userId]);

  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(generateReminders, 1000);
    return () => clearTimeout(timer);
  }, [generateReminders, userId]);

  const checkActiveReminder = useCallback(() => {
    const now = Date.now();

    if (now < snoozedUntilRef.current) {
      if (currentReminderIdRef.current !== null) {
        currentReminderIdRef.current = null;
        setActiveReminder(null);
      }
      return;
    }

    const upcoming = allReminders.find((r) => {
      const t = new Date(r.scheduledAt).getTime();
      return t <= now + 2 * 60 * 1000 && t >= now - 60 * 1000;
    });

    const upcomingId = upcoming?.id || null;

    if (upcomingId !== currentReminderIdRef.current) {
      currentReminderIdRef.current = upcomingId;
      setActiveReminder(upcoming || null);
    }
  }, [allReminders]);

  const refreshReminders = useCallback(() => {
    if (!userId) return;
    generateReminders();
    checkActiveReminder();
  }, [generateReminders, userId, checkActiveReminder]);

  useEffect(() => {
    intervalRef.current = setInterval(checkActiveReminder, 30 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkActiveReminder]);

  useEffect(() => {
    checkActiveReminder();
  }, [allReminders, checkActiveReminder]);

  // Dismiss: fire-and-forget update, no catch needed
  const dismissReminder = useCallback(() => {
    if (activeReminder) {
      setActiveReminder(null);
      if (userId) {
        void supabase
          .from('smart_reminders')
          .update({ status: 'cancelled' })
          .eq('id', activeReminder.id);
      }
    }
  }, [activeReminder, userId]);

  const snoozeReminder = useCallback(
    (minutes = 15) => {
      snoozedUntilRef.current = Date.now() + minutes * 60 * 1000;
      setActiveReminder(null);
      toast.info(`Nhắc lại sau ${minutes} phút`, { duration: 2000 });
    },
    [],
  );

  // Respond: fire-and-forget update, no catch needed
  const respondToReminder = useCallback(
    (amount: number) => {
      if (!activeReminder) return;

      onQuickDrink?.(amount);

      if (userId) {
        void supabase
          .from('smart_reminders')
          .update({
            status: 'completed',
            responded_at: new Date().toISOString(),
            response_amount: amount,
          })
          .eq('id', activeReminder.id);
      }

      setActiveReminder(null);
    },
    [activeReminder, userId, onQuickDrink],
  );

  const canUseSmartReminders = pattern !== null || calendarEvents.length > 0 || weatherTemp !== null;

  // Filter active reminders on render
  const activeReminders = allReminders.filter(
    // eslint-disable-next-line react-hooks/purity
    (r) => new Date(r.scheduledAt).getTime() > Date.now() - 5 * 60 * 1000,
  );

  return {
    activeReminders,
    currentReminder: activeReminder,
    dismissReminder,
    snoozeReminder,
    respondToReminder,
    refreshReminders,
    canUseSmartReminders,
  };
}