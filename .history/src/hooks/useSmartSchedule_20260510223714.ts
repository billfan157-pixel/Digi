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
