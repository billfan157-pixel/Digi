import { useMemo } from 'react';
import type { HydrationSchedule } from '../lib/HydrationEngine';
import type { CalendarEventItem } from './useCalendarSync';

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
