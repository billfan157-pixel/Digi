import { useMemo } from 'react';
import type { HydrationSchedule } from '../lib/HydrationEngine';
import type { CalendarEventItem } from './useCalendarSync';

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * Format minutes since midnight back to "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(normalized / 60) % 24;
  const m = Math.round(normalized % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type EventCategory = 'SPORT' | 'DEEP_WORK' | 'SOCIAL' | 'NORMAL';

type BusyWindow = {
  start: number;
  end: number;
  event: CalendarEventItem;
  category: EventCategory;
};

const PRE_EVENT_BUFFER_MINUTES = 10;
const POST_EVENT_BUFFER_MINUTES = 20;
const MIN_DRINK_SPACING_MINUTES = 25;
const EARLIEST_DRINK_MINUTES = 6 * 60;
const LATEST_DRINK_MINUTES = 23 * 60;
const SEARCH_WINDOW_MINUTES = 120;

function detectCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  const sportKeywords = ['gym', 'tập', 'bóng đá', 'cầu lông', 'chạy', 'yoga', 'bơi', 'workout', 'sport', 'dance', 'tennis', 'đá banh'];
  const deepWorkKeywords = ['học', 'họp', 'thi', 'biên dịch', 'nghiên cứu', 'meeting', 'class', 'lecture', 'study', 'tiết'];
  const socialKeywords = ['cafe', 'tiệc', 'party', 'hẹn', 'đi chơi', 'shopping', 'date'];

  if (sportKeywords.some(kw => t.includes(kw))) return 'SPORT';
  if (deepWorkKeywords.some(kw => t.includes(kw))) return 'DEEP_WORK';
  if (socialKeywords.some(kw => t.includes(kw))) return 'SOCIAL';
  return 'NORMAL';
}

function buildBusyWindows(events: CalendarEventItem[]): BusyWindow[] {
  return events
    .filter(event => !event.isAllDay)
    .map((event) => {
      const startMinutes = timeToMinutes(event.start);
      const rawEndMinutes = timeToMinutes(event.end);

      if (startMinutes === null || rawEndMinutes === null) return null;

      const endMinutes = rawEndMinutes <= startMinutes ? 24 * 60 : rawEndMinutes;
      const category = detectCategory(event.title);

      return {
        start: Math.max(0, startMinutes - PRE_EVENT_BUFFER_MINUTES),
        end: Math.min(24 * 60, endMinutes + POST_EVENT_BUFFER_MINUTES),
        event,
        category,
      };
    })
    .filter((window): window is BusyWindow => !!window)
    .sort((a, b) => a.start - b.start);
}

function findOverlappingWindow(
  timeMinutes: number,
  busyWindows: BusyWindow[],
): BusyWindow | null {
  for (const window of busyWindows) {
    if (timeMinutes >= window.start && timeMinutes < window.end) {
      return window;
    }
  }
  return null;
}

function isTooCloseToUsedSlot(timeMinutes: number, usedSlots: number[]) {
  return usedSlots.some(slot => Math.abs(slot - timeMinutes) < MIN_DRINK_SPACING_MINUTES);
}

/**
 * Find the nearest available slot before an event,
 * or after an event if before doesn't work.
 */
function findAvailableSlot(
  desiredMinutes: number,
  busyWindows: BusyWindow[],
  usedSlots: number[],
): number {
  for (let offset = 0; offset <= SEARCH_WINDOW_MINUTES; offset += 15) {
    const candidates = offset === 0
      ? [desiredMinutes]
      : [desiredMinutes - offset, desiredMinutes + offset];

    for (const candidate of candidates) {
      if (candidate < EARLIEST_DRINK_MINUTES || candidate > LATEST_DRINK_MINUTES) continue;
      if (findOverlappingWindow(candidate, busyWindows)) continue;
      if (isTooCloseToUsedSlot(candidate, usedSlots)) continue;
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
  void waterGoal;
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
    const busyWindows = buildBusyWindows(calendarEvents);
    const usedSlots: number[] = [];

    const smartSchedule: SmartScheduleItem[] = baseSchedule.map((item) => {
      const originalMinutes = timeToMinutes(item.time);
      if (originalMinutes === null) {
        return {
          time: item.time,
          amount: item.amount,
          note: item.note || 'Uống nước',
          isAdjusted: false,
        };
      }

      const overlapping = findOverlappingWindow(originalMinutes, busyWindows);

      if (!overlapping) {
        usedSlots.push(originalMinutes);
        return {
          time: item.time,
          amount: item.amount,
          note: item.note || 'Uống nước',
          isAdjusted: false,
        };
      }

      // Find best alternative slot
      const newMinutes = findAvailableSlot(originalMinutes, busyWindows, usedSlots);
      const isActuallyMoved = newMinutes !== originalMinutes;
      if (isActuallyMoved) adjustedCount++;
      usedSlots.push(newMinutes);

      // Adjust amount based on category
      let finalAmount = item.amount;
      let categoryNote = '';
      if (overlapping.category === 'SPORT') {
        finalAmount += 150;
        categoryNote = ' (+150ml bù thể thao)';
      } else if (overlapping.category === 'DEEP_WORK') {
        categoryNote = ' (ưu tiên tỉnh táo)';
      }

      return {
        time: minutesToTime(newMinutes),
        amount: finalAmount,
        note: isActuallyMoved
          ? `Né "${overlapping.event.title}"${categoryNote} - ${item.note || 'uống nước'}`
          : `Trùng "${overlapping.event.title}"${categoryNote} - uống nhanh ${finalAmount}ml`,
        isAdjusted: true,
        conflictingEvent: overlapping.event.title,
      };
    });

    return {
      schedule: smartSchedule.sort((a, b) => a.time.localeCompare(b.time)),
      busyEventCount: busyWindows.length,
      totalAdjustedCount: adjustedCount,
      hasEventsToday: calendarEvents.length > 0,
    };
  }, [baseSchedule, calendarEvents]);
}
