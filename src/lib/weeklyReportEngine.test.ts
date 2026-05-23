import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateWeeklyReport,
  cacheReport,
  getCachedReport,
  formatReportForSharing,
  type WeeklyReportInput,
} from './weeklyReportEngine';
import type { WaterLog } from '../models';

describe('weeklyReportEngine', () => {
  let mockCurrentWeekLogs: WaterLog[];
  let mockPreviousWeekLogs: WaterLog[];

  beforeEach(() => {
    localStorage.clear();

    // Mock logs for current week (last 7 days)
    mockCurrentWeekLogs = [
      { id: '1', user_id: 'user-1', amount: 2000, name: 'Water', day: '2026-05-23', created_at: '2026-05-23T10:00:00Z', exp: 0 },
      { id: '2', user_id: 'user-1', amount: 2500, name: 'Water', day: '2026-05-22', created_at: '2026-05-22T10:00:00Z', exp: 0 },
      { id: '3', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-21', created_at: '2026-05-21T10:00:00Z', exp: 0 },
      { id: '4', user_id: 'user-1', amount: 2200, name: 'Water', day: '2026-05-20', created_at: '2026-05-20T10:00:00Z', exp: 0 },
      { id: '5', user_id: 'user-1', amount: 1500, name: 'Water', day: '2026-05-19', created_at: '2026-05-19T10:00:00Z', exp: 0 },
      { id: '6', user_id: 'user-1', amount: 2000, name: 'Water', day: '2026-05-18', created_at: '2026-05-18T10:00:00Z', exp: 0 },
      { id: '7', user_id: 'user-1', amount: 1000, name: 'Water', day: '2026-05-17', created_at: '2026-05-17T10:00:00Z', exp: 0 },
    ];

    // Mock logs for previous week
    mockPreviousWeekLogs = [
      { id: 'p1', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-16', created_at: '2026-05-16T10:00:00Z', exp: 0 },
      { id: 'p2', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-15', created_at: '2026-05-15T10:00:00Z', exp: 0 },
      { id: 'p3', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-14', created_at: '2026-05-14T10:00:00Z', exp: 0 },
      { id: 'p4', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-13', created_at: '2026-05-13T10:00:00Z', exp: 0 },
      { id: 'p5', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-12', created_at: '2026-05-12T10:00:00Z', exp: 0 },
      { id: 'p6', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-11', created_at: '2026-05-11T10:00:00Z', exp: 0 },
      { id: 'p7', user_id: 'user-1', amount: 1800, name: 'Water', day: '2026-05-10', created_at: '2026-05-10T10:00:00Z', exp: 0 },
    ];
  });

  describe('generateWeeklyReport', () => {
    it('aggregates total weekly volume and averages correctly', () => {
      const input: WeeklyReportInput = {
        currentWeekLogs: mockCurrentWeekLogs,
        previousWeekLogs: mockPreviousWeekLogs,
        waterGoal: 2000,
      };

      const report = generateWeeklyReport(input);

      // Total Current = 2000 + 2500 + 1800 + 2200 + 1500 + 2000 + 1000 = 13000ml
      // Average daily = 13000 / 7 = 1857.1ml
      expect(report.totalIntake).toBe(13000);
      expect(report.avgDaily).toBeCloseTo(1857.1, 1);
    });

    it('identifies best and worst day correctly', () => {
      const input: WeeklyReportInput = {
        currentWeekLogs: mockCurrentWeekLogs,
        previousWeekLogs: mockPreviousWeekLogs,
        waterGoal: 2000,
      };

      const report = generateWeeklyReport(input);

      expect(report.bestDay.date).toBe('2026-05-22');
      expect(report.bestDay.ml).toBe(2500);

      expect(report.worstDay.date).toBe('2026-05-17');
      expect(report.worstDay.ml).toBe(1000);
    });

    it('calculates goalHitDays based on the target waterGoal', () => {
      const input: WeeklyReportInput = {
        currentWeekLogs: mockCurrentWeekLogs,
        previousWeekLogs: mockPreviousWeekLogs,
        waterGoal: 2000, // days >= 2000: 23, 22, 20, 18 => 4 days
      };

      const report = generateWeeklyReport(input);
      expect(report.goalHitDays).toBe(4);
    });

    it('compares volume change to previous week', () => {
      const input: WeeklyReportInput = {
        currentWeekLogs: mockCurrentWeekLogs,
        previousWeekLogs: mockPreviousWeekLogs,
        waterGoal: 2000,
      };

      // Total Previous = 7 * 1800 = 12600ml
      // Total Current = 13000ml
      // Change = (13000 - 12600) / 12600 = +3.17% => rounded to 3%
      const report = generateWeeklyReport(input);
      expect(report.comparisonToPreviousWeek).toBe(3);
    });
  });

  describe('caching weekly report', () => {
    it('caches and retrieves report using weekStart', () => {
      const mockReport = {
        weekStart: '2026-05-18',
        weekEnd: '2026-05-24',
        totalIntake: 14000,
        avgDaily: 2000,
        goalHitDays: 5,
        totalDays: 7,
        bestDay: { date: '2026-05-20', ml: 2500 },
        worstDay: { date: '2026-05-18', ml: 1200 },
        trend: 'stable' as const,
        insight: 'Phong độ ổn định',
        tip: 'Uống thêm nước buổi chiều',
        comparisonToPreviousWeek: 5.0,
        consistencyScore: 80,
      };

      cacheReport(mockReport);
      const retrieved = getCachedReport('2026-05-18');

      expect(retrieved).toEqual(mockReport);
    });
  });

  describe('formatReportForSharing', () => {
    it('returns a formatted markdown summary for copying', () => {
      const mockReport = {
        weekStart: '2026-05-18',
        weekEnd: '2026-05-24',
        totalIntake: 14000,
        avgDaily: 2000,
        goalHitDays: 5,
        totalDays: 7,
        bestDay: { date: '2026-05-20', ml: 2500 },
        worstDay: { date: '2026-05-18', ml: 1200 },
        trend: 'stable' as const,
        insight: 'Phong độ ổn định',
        tip: 'Gợi ý tuần sau',
        comparisonToPreviousWeek: 5.0,
        consistencyScore: 80,
      };

      const shareText = formatReportForSharing(mockReport);
      expect(shareText).toContain('Báo cáo uống nước tuần này');
      expect(shareText).toContain('14000ml');
      expect(shareText).toContain('5/7 ngày');
      expect(shareText).toContain('Phong độ ổn định');
    });
  });
});
