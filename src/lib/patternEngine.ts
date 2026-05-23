/**
 * Sprint 13-14: AI Personalization Engine
 * Pattern Engine — phân tích thói quen uống nước của user
 * Offline-first, tính toán từ water_logs + weather data
 */
import type { WaterLog } from '../models';

// ─── Types ───────────────────────────────────────────────────────────

export interface BlindSpot {
  slot: string; // "6-9", "9-12", "12-15", "15-18", "18-21", "21-23"
  completionRate: number; // 0-1
}

export interface UserHydrationPattern {
  blindSpots: BlindSpot[];
  peakHours: number[]; // giờ trong ngày user uống nhiều nhất (0-23)
  weatherFactor: number; // tỷ lệ nóng/mát, <1 = nóng uống ít hơn
  consistencyScore: number; // 0-100
  trend: 'improving' | 'declining' | 'volatile' | 'stable';
  weeklyAvgCompletion: number; // 0-1
  bestDayOfWeek: number; // 0=CN, 6=T7
  worstDayOfWeek: number;
}

export interface WeatherSnapshot {
  date: string; // YYYY-MM-DD
  temp: number; // °C
  humidity: number;
}

export interface PatternInput {
  waterLogs: WaterLog[]; // 7-14 ngày gần nhất
  waterGoal: number;
  weatherHistory: WeatherSnapshot[]; // weather theo ngày
}

// ─── Constants ───────────────────────────────────────────────────────

const TIME_SLOTS: { label: string; start: number; end: number }[] = [
  { label: '6-9', start: 6, end: 9 },
  { label: '9-12', start: 9, end: 12 },
  { label: '12-15', start: 12, end: 15 },
  { label: '15-18', start: 15, end: 18 },
  { label: '18-21', start: 18, end: 21 },
  { label: '21-23', start: 21, end: 23 },
];

export const HOT_TEMP_THRESHOLD = 35; // °C
const COOL_TEMP_THRESHOLD = 25; // °C
const MIN_DAYS_FOR_PATTERN = 3;

// ─── Helpers ─────────────────────────────────────────────────────────

function getHourFromISODate(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? 12 : d.getHours();
  } catch {
    return 12;
  }
}

function getDateOnly(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr.slice(0, 10) : d.toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function getDayOfWeek(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
  } catch {
    return new Date().getDay();
  }
}

// ─── Core Analysis ──────────────────────────────────────────────────

/**
 * Phân tích blind spots — khung giờ user hay quên uống nước
 * Dựa trên water_logs 7 ngày, tính % completion mỗi khung giờ
 */
function analyzeBlindSpots(
  waterLogs: WaterLog[],
  waterGoal: number,
): BlindSpot[] {
  // Nhóm logs theo ngày
  const logsByDay = new Map<string, WaterLog[]>();
  for (const log of waterLogs) {
    const day = getDateOnly(log.day || log.created_at);
    if (!logsByDay.has(day)) logsByDay.set(day, []);
    logsByDay.get(day)!.push(log);
  }

  const dayCount = logsByDay.size;
  if (dayCount === 0) return [];

  // Với mỗi khung giờ, tính xem user có uống đủ không
  return TIME_SLOTS.map((slot) => {
    let completedDays = 0;

    for (const [, logs] of logsByDay) {
      // Tính expected amount cho khung giờ này
      const totalSlots = TIME_SLOTS.length;
      const expectedPerSlot = waterGoal / totalSlots;

      // Tổng lượng uống trong khung giờ
      const slotLogs = logs.filter((log) => {
        const hour = getHourFromISODate(log.created_at || log.day);
        return hour >= slot.start && hour < slot.end;
      });

      const slotAmount = slotLogs.reduce((sum, l) => sum + l.amount, 0);

      // Chỉ tính ngày có ít nhất 1 log
      if (slotAmount >= expectedPerSlot * 0.5) {
        completedDays++;
      }
    }

    const completionRate = dayCount > 0 ? completedDays / dayCount : 0;
    return { slot: slot.label, completionRate };
  });
}

/**
 * Phát hiện peak hours — giờ user uống nhiều nhất
 */
function analyzePeakHours(waterLogs: WaterLog[]): number[] {
  const byHour = new Map<number, number>();

  for (const log of waterLogs) {
    const hour = getHourFromISODate(log.created_at || log.day);
    byHour.set(hour, (byHour.get(hour) || 0) + log.amount);
  }

  if (byHour.size === 0) return [];

  const maxAmount = Math.max(...byHour.values());
  const threshold = maxAmount * 0.7;

  return Array.from(byHour.entries())
    .filter(([, amount]) => amount >= threshold)
    .map(([hour]) => hour)
    .sort((a, b) => a - b);
}

/**
 * Tính weather correlation factor
 * So sánh lượng uống khi nóng vs mát
 */
function calculateWeatherFactor(
  waterLogs: WaterLog[],
  weatherHistory: WeatherSnapshot[],
): number {
  if (weatherHistory.length < 2 || waterLogs.length < 3) return 1.0;

  // Map weather theo ngày
  const weatherByDate = new Map<string, WeatherSnapshot>();
  for (const weather of weatherHistory) {
    weatherByDate.set(weather.date, weather);
  }

  let hotTotal = 0;
  let hotCount = 0;
  let coolTotal = 0;
  let coolCount = 0;

  for (const log of waterLogs) {
    const day = getDateOnly(log.day || log.created_at);
    const weather = weatherByDate.get(day);
    if (!weather) continue;

    if (weather.temp >= HOT_TEMP_THRESHOLD) {
      hotTotal += log.amount;
      hotCount++;
    } else if (weather.temp <= COOL_TEMP_THRESHOLD) {
      coolTotal += log.amount;
      coolCount++;
    }
  }

  const hotAvg = hotCount > 0 ? hotTotal / hotCount : 0;
  const coolAvg = coolCount > 0 ? coolTotal / coolCount : 0;

  if (coolAvg === 0) return 1.0;
  const factor = hotAvg / coolAvg;

  // Clamp: không cho vượt quá 0.5-2.0
  return Math.max(0.5, Math.min(2.0, Number(factor.toFixed(2))));
}

/**
 * Tính consistency score (0-100)
 * Dựa trên độ lệch chuẩn giữa các ngày
 */
function calculateConsistency(waterLogs: WaterLog[]): number {
  // Nhóm theo ngày
  const byDay = new Map<string, number>();
  for (const log of waterLogs) {
    const day = getDateOnly(log.day || log.created_at);
    byDay.set(day, (byDay.get(day) || 0) + log.amount);
  }

  const dailyAmounts = Array.from(byDay.values());
  if (dailyAmounts.length < 2) return 50; // neutral

  const mean = dailyAmounts.reduce((s, v) => s + v, 0) / dailyAmounts.length;
  const variance = dailyAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyAmounts.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = mean > 0 ? stdDev / mean : 1;
  // cv ≈ 0 → rất đều → score cao
  // cv ≈ 1 → rất thất thường → score thấp
  const score = Math.max(0, 100 - Math.round(cv * 100));
  return Math.min(100, score);
}

/**
 * Phát hiện trend: improving, declining, volatile, stable
 */
function detectTrend(waterLogs: WaterLog[]): UserHydrationPattern['trend'] {
  const byDay = new Map<string, number>();
  const sortedLogs = [...waterLogs].sort(
    (a, b) => new Date(a.created_at || a.day).getTime() - new Date(b.created_at || b.day).getTime(),
  );

  for (const log of sortedLogs) {
    const day = getDateOnly(log.day || log.created_at);
    byDay.set(day, (byDay.get(day) || 0) + log.amount);
  }

  const days = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (days.length < 4) return 'stable';

  // Chia 2 nửa: first half vs second half
  const mid = Math.floor(days.length / 2);
  const firstHalf = days.slice(0, mid).reduce((s, [, v]) => s + v, 0) / mid;
  const secondHalf = days.slice(mid).reduce((s, [, v]) => s + v, 0) / (days.length - mid);

  const diff = secondHalf - firstHalf;
  const threshold = firstHalf * 0.1; // 10% change

  if (diff > threshold) return 'improving';
  if (diff < -threshold) return 'declining';

  // Check volatility: tính coefficient of variation trên daily amounts
  const amounts = days.map(([, v]) => v);
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

  if (cv > 0.5) return 'volatile';
  return 'stable';
}

/**
 * Tìm ngày tốt nhất / tệ nhất trong tuần
 */
function analyzeDayOfWeek(
  waterLogs: WaterLog[],
): { bestDayOfWeek: number; worstDayOfWeek: number; weeklyAvgCompletion: number } {
  const byDow = new Map<number, { total: number; count: number }>();
  const goalHitsByDay = new Map<number, number>();

  for (const log of waterLogs) {
    const dow = getDayOfWeek(log.created_at || log.day);
    const cur = byDow.get(dow) || { total: 0, count: 0 };
    cur.total += log.amount;
    cur.count++;
    byDow.set(dow, cur);
  }

  // Tính completion: cần waterGoal
  // Tạm thời tính average completion dựa trên tổng daily
  const byDate = new Map<string, number>();
  for (const log of waterLogs) {
    const day = getDateOnly(log.day || log.created_at);
    byDate.set(day, (byDate.get(day) || 0) + log.amount);
  }

  let completedDays = 0;
  for (const [dayStr, total] of byDate) {
    const dow = getDayOfWeek(dayStr);
    if (total >= 100) { // threshold thấp để có data
      goalHitsByDay.set(dow, (goalHitsByDay.get(dow) || 0) + 1);
    }
    const day = getDateOnly(dayStr);
    const logCount = waterLogs.filter(l => getDateOnly(l.day || l.created_at) === day).length;
    if (logCount > 0) completedDays++;
  }

  // Weekly avg completion: % ngày có ít nhất 1 log / total days in range
  let bestDay = 0;
  let worstDay = 0;
  let bestAvg = 0;
  let worstAvg = Infinity;

  for (const [dow, data] of byDow) {
    const avg = data.total / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = dow;
    }
    if (avg < worstAvg) {
      worstAvg = avg;
      worstDay = dow;
    }
  }

  const uniqueDays = byDate.size;
  return {
    bestDayOfWeek: bestDay,
    worstDayOfWeek: uniqueDays > 1 ? worstDay : bestDay,
    weeklyAvgCompletion: uniqueDays > 0 ? completedDays / Math.max(uniqueDays, 7) : 0,
  };
}

// ─── Main Function ───────────────────────────────────────────────────

/**
 * Phân tích pattern uống nước của user từ water_logs + weather
 * Trả về UserHydrationPattern hoặc null nếu chưa đủ data
 */
export function analyzePattern(input: PatternInput): UserHydrationPattern | null {
  const { waterLogs, waterGoal, weatherHistory } = input;

  if (waterLogs.length < MIN_DAYS_FOR_PATTERN) return null;

  const blindSpots = analyzeBlindSpots(waterLogs, waterGoal);
  const peakHours = analyzePeakHours(waterLogs);
  const weatherFactor = calculateWeatherFactor(waterLogs, weatherHistory);
  const consistencyScore = calculateConsistency(waterLogs);
  const trend = detectTrend(waterLogs);
  const { bestDayOfWeek, worstDayOfWeek, weeklyAvgCompletion } = analyzeDayOfWeek(waterLogs);

  return {
    blindSpots,
    peakHours,
    weatherFactor,
    consistencyScore,
    trend,
    weeklyAvgCompletion,
    bestDayOfWeek,
    worstDayOfWeek,
  };
}

/**
 * Cache pattern vào localStorage để offline access
 */
export function cachePattern(userId: string, pattern: UserHydrationPattern): void {
  try {
    localStorage.setItem(
      `digiwell_pattern_${userId}`,
      JSON.stringify({ pattern, timestamp: Date.now() }),
    );
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Lấy cached pattern từ localStorage
 */
export function getCachedPattern(userId: string): UserHydrationPattern | null {
  try {
    const raw = localStorage.getItem(`digiwell_pattern_${userId}`);
    if (!raw) return null;
    const { pattern, timestamp } = JSON.parse(raw);
    // Cache tối đa 24h
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`digiwell_pattern_${userId}`);
      return null;
    }
    return pattern as UserHydrationPattern;
  } catch {
    return null;
  }
}

/**
 * Lấy raw data snapshot cho việc lưu vào DB (debug)
 */
export function getRawDataSnapshot(waterLogs: WaterLog[]): object {
  return waterLogs.slice(-14).map((log) => ({
    day: getDateOnly(log.day || log.created_at),
    amount: log.amount,
    hour: getHourFromISODate(log.created_at || log.day),
  }));
}