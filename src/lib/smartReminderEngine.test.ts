import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSmartReminders,
  cacheReminders,
  getCachedReminders,
  type ReminderInput,
} from './smartReminderEngine';
import type { UserHydrationPattern } from './patternEngine';

describe('smartReminderEngine', () => {
  let mockPattern: UserHydrationPattern;
  let mockNow: Date;

  beforeEach(() => {
    localStorage.clear();
    mockNow = new Date(2026, 4, 23, 10, 0, 0); // 10:00 AM local time

    mockPattern = {
      blindSpots: [
        { slot: '6-9', completionRate: 0.8 },
        { slot: '9-12', completionRate: 0.7 },
        { slot: '12-15', completionRate: 0.3 }, // weak slot (blind spot)
        { slot: '15-18', completionRate: 0.9 },
        { slot: '18-21', completionRate: 0.8 },
        { slot: '21-23', completionRate: 0.7 },
      ],
      peakHours: [8, 19],
      weatherFactor: 1.0,
      consistencyScore: 80,
      trend: 'stable',
      weeklyAvgCompletion: 0.85,
      bestDayOfWeek: 1,
      worstDayOfWeek: 4,
    };
  });

  describe('generateSmartReminders', () => {
    it('generates a blind spot reminder when approaching a weak slot', () => {
      // Current time is 11:50, weak slot starts at 12:00
      // We expect a reminder scheduled for 11:45 (15 mins before 12:00)
      const nowAt1150 = new Date(2026, 4, 23, 11, 50, 0);
      
      const input: ReminderInput = {
        pattern: mockPattern,
        calendarEvents: [],
        weatherTemp: 28,
        currentIntake: 800,
        waterGoal: 2000,
        lastDrinkTime: new Date(2026, 4, 23, 11, 0, 0).toISOString(),
        now: nowAt1150,
      };

      const reminders = generateSmartReminders(input);
      const blindSpotRem = reminders.find(r => r.reason === 'blind_spot');

      expect(blindSpotRem).toBeDefined();
      expect(blindSpotRem?.message).toContain('đầu giờ chiều');
      expect(blindSpotRem?.suggestedAmount).toBe(200);
      expect(blindSpotRem?.priority).toBe('high');
    });

    it('generates a weather warning reminder in hot weather', () => {
      const input: ReminderInput = {
        pattern: mockPattern,
        calendarEvents: [],
        weatherTemp: 38, // temperature above threshold
        currentIntake: 800,
        waterGoal: 2000,
        lastDrinkTime: new Date(2026, 4, 23, 9, 0, 0).toISOString(),
        now: mockNow,
      };

      const reminders = generateSmartReminders(input);
      const weatherRem = reminders.find(r => r.reason === 'weather_alert');

      expect(weatherRem).toBeDefined();
      expect(weatherRem?.message).toContain('38°C');
      expect(weatherRem?.suggestedAmount).toBe(300); // 250 + 50 bonus
    });

    it('generates a post-event reminder after a sports activity ends', () => {
      // Mock event ending in 15 minutes (at 10:15)
      const mockCalendarEvents = [
        {
          id: 'event-1',
          title: 'Tập Gym sáng',
          start: '09:00',
          end: '10:15',
          isAllDay: false,
        },
      ];

      const input: ReminderInput = {
        pattern: mockPattern,
        calendarEvents: mockCalendarEvents,
        weatherTemp: 28,
        currentIntake: 800,
        waterGoal: 2000,
        lastDrinkTime: new Date(2026, 4, 23, 9, 0, 0).toISOString(),
        now: mockNow,
      };

      const reminders = generateSmartReminders(input);
      const postEventRem = reminders.find(r => r.reason === 'post_event');

      expect(postEventRem).toBeDefined();
      expect(postEventRem?.message).toContain('Tập Gym sáng');
      expect(postEventRem?.suggestedAmount).toBe(350); // 200 + 150 sport bonus
    });

    it('generates a catch-up reminder when current intake is behind schedule', () => {
      // At 10:00 AM, expected intake is roughly 25% of waterGoal = 500ml
      // If current intake is only 100ml (< 60% of expected)
      const input: ReminderInput = {
        pattern: mockPattern,
        calendarEvents: [],
        weatherTemp: 28,
        currentIntake: 100, // very low progress
        waterGoal: 2000,
        lastDrinkTime: new Date(2026, 4, 23, 7, 0, 0).toISOString(),
        now: mockNow,
      };

      const reminders = generateSmartReminders(input);
      const catchUpRem = reminders.find(r => r.reason === 'catch_up');

      expect(catchUpRem).toBeDefined();
      expect(catchUpRem?.message).toContain('thiếu');
    });

    it('generates interval fallback reminders if no other reasons apply', () => {
      const cleanPattern = {
        ...mockPattern,
        blindSpots: mockPattern.blindSpots.map((b) => ({ ...b, completionRate: 0.8 })),
      };

      const input: ReminderInput = {
        pattern: cleanPattern,
        calendarEvents: [],
        weatherTemp: 28,
        currentIntake: 1000, // on track
        waterGoal: 2000,
        lastDrinkTime: new Date(2026, 4, 23, 8, 0, 0).toISOString(), // 2 hours ago
        now: mockNow,
      };

      const reminders = generateSmartReminders(input);
      const intervalRem = reminders.find(r => r.reason === 'interval');

      expect(intervalRem).toBeDefined();
      expect(intervalRem?.priority).toBe('low');
    });
  });

  describe('localStorage caching', () => {
    it('caches and retrieves reminders successfully', () => {
      const mockReminders = [
        {
          id: 'rem-1',
          scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins from now
          reason: 'interval' as const,
          message: 'Uống nước đi!',
          suggestedAmount: 200,
          priority: 'low' as const,
        },
      ];

      cacheReminders('test-user', mockReminders);
      const retrieved = getCachedReminders('test-user');

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('rem-1');
    });

    it('filters out past reminders when retrieving', () => {
      const mockReminders = [
        {
          id: 'rem-past',
          scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
          reason: 'interval' as const,
          message: 'Quá khứ',
          suggestedAmount: 200,
          priority: 'low' as const,
        },
        {
          id: 'rem-future',
          scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins future
          reason: 'interval' as const,
          message: 'Tương lai',
          suggestedAmount: 200,
          priority: 'low' as const,
        },
      ];

      cacheReminders('test-user', mockReminders);
      const retrieved = getCachedReminders('test-user');

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('rem-future');
    });
  });
});
