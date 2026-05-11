import { useMemo } from 'react';
import type { HydrationSchedule } from '../lib/HydrationEngine';
import type { CalendarEventItem } from './useCalendarSync';

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format minutes since midnight back to "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if a given time (in minutes) falls within any calendar event.
 * Returns the event if it does, null otherwise.
 */
function findOverlappingEvent(
  timeMinutes: number,
  events: CalendarEventItem[],
): CalendarEventItem | null {
  for (const event of events) {
    const startMin = timeToMinutes(event.start);
    const endMin = timeToMinutes(event.end);
    // Add 15min buffer after event
    if (timeMinutes >= startMin && timeMinutes < endMin + 15) {
      return event;
    }
  }
  return null;
}

/**
 * Find the nearest available slot before an event,
 * or after an event if before doesn't work.
 */
function findAvailableSlot(
  desiredMinutes: number,
  events: CalendarEventItem[],
  minSpacing: number = 30,
): number {
  // Try shifting earlier first (up to 45 minutes)
  for (let offset = 0; offset <= 45; offset += 15) {
    const candidate = desiredMinutes - offset;
    if (candidate < 6 * 60) break; // Not before 6am
    if (!findOverlappingEvent(candidate, events)) {
      return candidate;
    }
  }

  // Try shifting later (up to 60 minutes)
  for (let offset = 15; offset <= 60; offset += 15) {
    const candidate = desiredMinutes + offset;
    if (candidate > 23 * 60) break; // Not after 11pm
    if (!findOverlappingEvent(candidate, events)) {
      return candidate;
    }
  }

  // Keep original time but mark as busy
  return desiredMinutes;
}

export interface SmartScheduleItem {
  time: string;
  amount: number;
  note: string;
  isAdjusted: boolean;
  conflictingEvent?: string;
}

export function useSmartSchedule(
  baseSchedule: HydrationSchedule[] | null,
  calendarEvents: CalendarEventItem[],
  waterGoal: number,
): {
  schedule: SmartScheduleItem[];
  busyEventCount: number;
  totalAdjustedCount: number;
  hasEventsToday: boolean;
} {
  return useMemo(() => {
    if (!baseSchedule || baseSchedule.length === 0) {
      return {
        schedule: [],
        busyEventCount: 0,
        totalAdjustedCount: 0,
        hasEventsToday: calendarEvents.length > 0,
      };
    }

    let adjustedCount = 0;

    const smartSchedule: SmartScheduleItem[] = baseSchedule.map((item) => {
      const originalMinutes = timeToMinutes(item.time);
      const overlapping = findOverlappingEvent(originalMinutes, calendarEvents);

      if (!overlapping) {
        return {
          time: item.time,
          amount: item.amount,
          note: item.note || 'Uống nước',
          isAdjusted: false,
        };
      }

      // Find best alternative slot
      const newMinutes = findAvailableSlot(originalMinutes, calendarEvents);
      const isActuallyMoved = newMinutes !== originalMinutes;

      if (isActuallyMoved) adjustedCount++;

      return {
        time: minutesToTime(newMinutes),
        amount: item.amount,
        note: isActuallyMoved
          ? `(Đã điều chỉnh do "${overlapping.title}") ${item.note || ''}`
          : `⚠️ Trùng với "${overlapping.title}" — uống nhanh ${item.amount}ml`,
        isAdjusted: true,
        conflictingEvent: overlapping.title,
      };
    });

    return {
      schedule: smartSchedule,
      busyEventCount: calendarEvents.length,
      totalAdjustedCount: adjustedCount,
      hasEventsToday: calendarEvents.length > 0,
    };
  }, [baseSchedule, calendarEvents, waterGoal]);
}