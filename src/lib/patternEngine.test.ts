import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzePattern,
  cachePattern,
  getCachedPattern,
  getRawDataSnapshot,
  type PatternInput,
  type WeatherSnapshot,
} from './patternEngine';
import type { WaterLog } from '../models';

describe('patternEngine', () => {
  let mockWaterLogs: WaterLog[];
  let mockWeatherHistory: WeatherSnapshot[];

  beforeEach(() => {
    localStorage.clear();

    // Create 7 days of water logs
    mockWaterLogs = [];
    const baseDate = new Date('2026-05-15T10:00:00Z');

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(baseDate);
      currentDay.setDate(baseDate.getDate() - dayOffset);
      const dateStr = currentDay.toISOString().slice(0, 10);

      // Add a morning log at 8:00
      const log1: WaterLog = {
        id: `log-${dayOffset}-1`,
        user_id: 'user-1',
        amount: 250,
        name: 'Nước lọc',
        day: dateStr,
        created_at: `${dateStr}T08:00:00Z`,
        exp: 10,
      };

      // Add an afternoon log at 14:00 (except on dayOffset 3 to create a blind spot around 12-15)
      const logs = [log1];
      if (dayOffset !== 3) {
        logs.push({
          id: `log-${dayOffset}-2`,
          user_id: 'user-1',
          amount: 500,
          name: 'Trà đá',
          day: dateStr,
          created_at: `${dateStr}T14:00:00Z`,
          exp: 10,
        });
      }

      // Add an evening log at 19:00
      logs.push({
        id: `log-${dayOffset}-3`,
        user_id: 'user-1',
        amount: 300,
        name: 'Nước lọc',
        day: dateStr,
        created_at: `${dateStr}T19:00:00Z`,
        exp: 10,
      });

      mockWaterLogs.push(...logs);
    }

    mockWeatherHistory = [
      { date: '2026-05-15', temp: 36, humidity: 60 },
      { date: '2026-05-14', temp: 37, humidity: 65 },
      { date: '2026-05-13', temp: 24, humidity: 50 },
      { date: '2026-05-12', temp: 23, humidity: 55 },
    ];
  });

  describe('analyzePattern', () => {
    it('returns null if there are less than 3 days of data', () => {
      const input: PatternInput = {
        waterLogs: mockWaterLogs.slice(0, 2),
        waterGoal: 2000,
        weatherHistory: mockWeatherHistory,
      };
      const result = analyzePattern(input);
      expect(result).toBeNull();
    });

    it('successfully analyzes pattern for valid logs', () => {
      const input: PatternInput = {
        waterLogs: mockWaterLogs,
        waterGoal: 2000,
        weatherHistory: mockWeatherHistory,
      };
      const result = analyzePattern(input);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.blindSpots).toBeInstanceOf(Array);
        expect(result.blindSpots.length).toBe(6); // 6 slots
        expect(result.peakHours).toBeInstanceOf(Array);
        expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
        expect(result.consistencyScore).toBeLessThanOrEqual(100);
        expect(['improving', 'declining', 'volatile', 'stable']).toContain(result.trend);
        expect(result.weeklyAvgCompletion).toBeGreaterThanOrEqual(0);
      }
    });

    it('correctly calculates weatherFactor based on temperature', () => {
      // Create hot weather logs vs cool weather logs
      const logs: WaterLog[] = [
        { id: '1', user_id: 'user-1', amount: 500, name: 'Water', day: '2026-05-15', created_at: '2026-05-15T08:00:00Z', exp: 0 }, // hot temp 36
        { id: '2', user_id: 'user-1', amount: 500, name: 'Water', day: '2026-05-14', created_at: '2026-05-14T08:00:00Z', exp: 0 }, // hot temp 37
        { id: '3', user_id: 'user-1', amount: 200, name: 'Water', day: '2026-05-13', created_at: '2026-05-13T08:00:00Z', exp: 0 }, // cool temp 24
        { id: '4', user_id: 'user-1', amount: 200, name: 'Water', day: '2026-05-12', created_at: '2026-05-12T08:00:00Z', exp: 0 }, // cool temp 23
      ];

      const input: PatternInput = {
        waterLogs: logs,
        waterGoal: 2000,
        weatherHistory: mockWeatherHistory,
      };

      const result = analyzePattern(input);
      expect(result).not.toBeNull();
      if (result) {
        // hotAvg = 500, coolAvg = 200 => factor = 2.5, clamped to 2.0
        expect(result.weatherFactor).toBe(2.0);
      }
    });
  });

  describe('cache and retrieve pattern', () => {
    it('caches and retrieves the pattern from localStorage', () => {
      const mockPattern = {
        blindSpots: [{ slot: '12-15', completionRate: 0.2 }],
        peakHours: [8, 14],
        weatherFactor: 1.2,
        consistencyScore: 85,
        trend: 'stable' as const,
        weeklyAvgCompletion: 0.8,
        bestDayOfWeek: 1,
        worstDayOfWeek: 4,
      };

      cachePattern('test-user', mockPattern);
      const retrieved = getCachedPattern('test-user');

      expect(retrieved).toEqual(mockPattern);
    });

    it('returns null if cached pattern is expired', () => {
      const mockPattern = {
        blindSpots: [],
        peakHours: [],
        weatherFactor: 1.0,
        consistencyScore: 50,
        trend: 'stable' as const,
        weeklyAvgCompletion: 0.5,
        bestDayOfWeek: 0,
        worstDayOfWeek: 0,
      };

      // Set item with old timestamp
      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      localStorage.setItem(
        'digiwell_pattern_test-user',
        JSON.stringify({ pattern: mockPattern, timestamp: oldTime })
      );

      const retrieved = getCachedPattern('test-user');
      expect(retrieved).toBeNull();
    });
  });

  describe('getRawDataSnapshot', () => {
    it('creates a proper slice of recent logs', () => {
      const snapshot = getRawDataSnapshot(mockWaterLogs);
      expect(snapshot).toBeInstanceOf(Array);
      expect(snapshot.length).toBeLessThanOrEqual(14);
    });
  });
});
