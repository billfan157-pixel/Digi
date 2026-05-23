/**
 * Sprint 13-14: AI Personalization Engine
 * Smart Reminder Engine — tạo lịch nhắc uống nước thông minh
 * Dựa trên: pattern cá nhân + calendar events + thời tiết
 */
import type { CalendarEventItem } from '../hooks/useCalendarSync';
import type { UserHydrationPattern } from './patternEngine';
import { HOT_TEMP_THRESHOLD } from './patternEngine';

// ─── Types ───────────────────────────────────────────────────────────

export type ReminderReason = 'blind_spot' | 'weather_alert' | 'post_event' | 'interval' | 'catch_up';
export type ReminderPriority = 'high' | 'medium' | 'low';

export interface SmartReminder {
  id: string;
  scheduledAt: string; // ISO time
  reason: ReminderReason;
  message: string;
  suggestedAmount: number;
  priority: ReminderPriority;
}

export interface ReminderInput {
  pattern: UserHydrationPattern | null;
  calendarEvents: CalendarEventItem[];
  weatherTemp: number | null;
  currentIntake: number;
  waterGoal: number;
  lastDrinkTime: string | null; // ISO
  now: Date;
}

// ─── Constants ───────────────────────────────────────────────────────

const BLIND_SPOT_LEAD_TIME = 15; // phút, nhắc trước khi vào khung giờ yếu
const NORMAL_INTERVAL = 60; // phút
const INCONSISTENT_INTERVAL = 90; // phút (cho user consistent)
const HOT_WEATHER_BONUS = 50; // ml thêm khi nóng
const POST_SPORT_BONUS = 150; // ml thêm sau thể thao
const MIN_REMINDER_GAP = 30; // phút, không nhắc quá dày
const CATCH_UP_THRESHOLD = 0.6; // % expected, dưới mức này → catch up

// ─── Helpers ─────────────────────────────────────────────────────────

const EVENT_CATEGORY_KEYWORDS: Record<string, { sport?: boolean; label: string }> = {
  sport: { sport: true, label: 'thể thao' },
  gym: { sport: true, label: 'tập gym' },
  workout: { sport: true, label: 'tập luyện' },
  run: { sport: true, label: 'chạy bộ' },
  yoga: { sport: true, label: 'yoga' },
  swim: { sport: true, label: 'bơi' },
  bóng_đá: { sport: true, label: 'bóng đá' },
  cầu_lông: { sport: true, label: 'cầu lông' },
  đá_banh: { sport: true, label: 'đá banh' },
  tập: { sport: true, label: 'tập' },
};

function detectSportEvent(title: string): string | null {
  const t = title.toLowerCase();
  for (const [keyword, info] of Object.entries(EVENT_CATEGORY_KEYWORDS)) {
    if (t.includes(keyword) && info.sport) return info.label;
  }
  return null;
}

function generateId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Messages ────────────────────────────────────────────────────────

function getBlindSpotMessage(slot: string): string {
  const slotLabels: Record<string, string> = {
    '6-9': 'sáng sớm',
    '9-12': 'buổi sáng',
    '12-15': 'đầu giờ chiều',
    '15-18': 'xế chiều',
    '18-21': 'tối',
    '21-23': 'khuya',
  };
  const label = slotLabels[slot] || `khung ${slot}`;
  return `Sắp đến khung giờ ${label} — bạn thường quên uống vào lúc này. Uống một ly ngay nhé!`;
}

function getWeatherAlertMessage(temp: number): string {
  if (temp >= 37) {
    return `Trời nóng ${temp}°C! Cơ thể cần thêm nước. Uống 50ml bù nhiệt ngay.`;
  }
  if (temp >= 35) {
    return `Trời nóng ${temp}°C. Nhắc bạn uống thêm nước để bù nhiệt.`;
  }
  return '';
}

function getPostEventMessage(eventTitle: string, bonus: number): string {
  return `Vừa xong "${eventTitle}". Uống ${bonus}ml bù nước ngay nhé!`;
}

function getCatchUpMessage(gap: number): string {
  if (gap > 1000) return `Hôm nay còn thiếu ${gap}ml. Chia đều các lần uống còn lại.`;
  return `Còn thiếu ${gap}ml để đạt mục tiêu hôm nay.`;
}

function getIntervalMessage(): string {
  const messages = [
    'Nhắc bạn uống nước! Cơ thể luôn cần được cấp ẩm.',
    'Đã đến giờ uống nước. Một ngụm nhỏ thôi cũng tốt!',
    'Đừng quên uống nước! Duy trì thói quen nhé.',
    'Uống nước ngay! Cơ thể bạn đang cần đấy.',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Core Engine ────────────────────────────────────────────────────

/**
 * Tính expected intake dựa trên giờ hiện tại
 * Giả định: user uống đều từ 6h-23h (17 tiếng)
 */
function getExpectedIntakeByHour(now: Date, waterGoal: number): number {
  const hour = now.getHours();
  const activeHours = 17; // 6-23
  if (hour < 6) return waterGoal * 0.1;
  if (hour >= 23) return waterGoal;
  const progress = (hour - 6 + now.getMinutes() / 60) / activeHours;
  return waterGoal * Math.min(1, Math.max(0, progress));
}

/**
 * Tìm blind spot sắp tới
 */
function findUpcomingBlindSpot(pattern: UserHydrationPattern | null, now: Date): { slot: string; time: Date } | null {
  if (!pattern || pattern.blindSpots.length === 0) return null;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Các khung giờ mù: completion < 50%
  const weakSlots = pattern.blindSpots.filter((b) => b.completionRate < 0.5);
  if (weakSlots.length === 0) return null;

  // Ánh xạ slot label → start hour
  const slotToStart: Record<string, number> = {
    '6-9': 6,
    '9-12': 9,
    '12-15': 12,
    '15-18': 15,
    '18-21': 18,
    '21-23': 21,
  };

  // Tìm slot tiếp theo (trong vòng 2 tiếng tới, không vượt quá hôm nay)
  const endOfDay = 24 * 60; // 24:00

  for (const slot of weakSlots) {
    const startHour = slotToStart[slot.slot];
    if (startHour === undefined) continue;

    const slotStartMinutes = startHour * 60 - BLIND_SPOT_LEAD_TIME; // 15 phút trước
    const slotEndMinutes = Math.min((startHour + 3) * 60, endOfDay);

    // Bỏ qua nếu blind spot đã kết thúc hôm nay
    if (slotEndMinutes <= currentTotalMinutes) continue;

    // Bỏ qua nếu blind spot quá xa (hơn 2 tiếng)
    if (currentTotalMinutes < slotStartMinutes - 120) continue;

    // Sắp vào slot
    if (currentTotalMinutes < slotStartMinutes) {
      const reminderTime = new Date(now);
      reminderTime.setHours(startHour - 1, 45, 0, 0); // 15 phút trước slot
      if (reminderTime > now) {
        return { slot: slot.slot, time: reminderTime };
      }
    } else if (currentTotalMinutes < slotStartMinutes + 180) {
      // Đang trong slot
      return { slot: slot.slot, time: now }; // nhắc ngay
    }
  }

  return null;
}

/**
 * Tìm event sắp kết thúc (trong vòng 30 phút tới)
 */
function findUpcomingEventEnd(events: CalendarEventItem[], now: Date): { title: string; endTime: Date } | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const in30Min = nowMinutes + 30;

  for (const event of events) {
    if (event.isAllDay) continue;
    const [h, m] = event.end.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
    const endMinutes = h * 60 + m;

    if (endMinutes > nowMinutes && endMinutes <= in30Min) {
      const endTime = new Date(now);
      endTime.setHours(h, m, 0, 0);
      return { title: event.title, endTime };
    }
  }
  return null;
}

// ─── Main Function ───────────────────────────────────────────────────

/**
 * Tạo danh sách reminder thông minh cho hôm nay
 * Trả về mảng các SmartReminder đã sắp xếp theo thời gian
 */
export function generateSmartReminders(input: ReminderInput): SmartReminder[] {
  const { pattern, calendarEvents, weatherTemp, currentIntake, waterGoal, lastDrinkTime, now } = input;
  const reminders: SmartReminder[] = [];

  // ── 1. BLIND SPOT REMINDER ──
  const upcomingBlindSpot = findUpcomingBlindSpot(pattern, now);
  if (upcomingBlindSpot) {
    reminders.push({
      id: generateId(),
      scheduledAt: upcomingBlindSpot.time.toISOString(),
      reason: 'blind_spot',
      message: getBlindSpotMessage(upcomingBlindSpot.slot),
      suggestedAmount: 200,
      priority: 'high',
    });
  }

  // ── 2. WEATHER TRIGGER ──
  if (weatherTemp !== null && weatherTemp >= HOT_TEMP_THRESHOLD) {
    // Nếu trời nóng, thêm reminder ngay
    const weatherMsg = getWeatherAlertMessage(weatherTemp);
    if (weatherMsg) {
      // Kiểm tra xem đã có reminder nào gần đây không
      const hasRecent = reminders.some(
        (r) => Math.abs(new Date(r.scheduledAt).getTime() - now.getTime()) < MIN_REMINDER_GAP * 60 * 1000,
      );
      if (!hasRecent) {
        reminders.push({
          id: generateId(),
          scheduledAt: now.toISOString(),
          reason: 'weather_alert',
          message: weatherMsg,
          suggestedAmount: 250 + HOT_WEATHER_BONUS,
          priority: 'high',
        });
      }
    }
  }

  // ── 3. POST-EVENT REMINDER ──
  const upcomingEvent = findUpcomingEventEnd(calendarEvents, now);
  if (upcomingEvent) {
    const sportType = detectSportEvent(upcomingEvent.title);
    const bonus = sportType ? POST_SPORT_BONUS : 0;
    reminders.push({
      id: generateId(),
      scheduledAt: upcomingEvent.endTime.toISOString(),
      reason: 'post_event',
      message: getPostEventMessage(upcomingEvent.title, bonus > 0 ? bonus : 200),
      suggestedAmount: 200 + bonus,
      priority: bonus > 0 ? 'high' : 'medium',
    });
  }

  // ── 4. CATCH-UP REMINDER ──
  const expected = getExpectedIntakeByHour(now, waterGoal);
  const progress = expected > 0 ? currentIntake / expected : 1;
  if (progress < CATCH_UP_THRESHOLD && currentIntake < waterGoal) {
    const gap = waterGoal - currentIntake;
    reminders.push({
      id: generateId(),
      scheduledAt: now.toISOString(),
      reason: 'catch_up',
      message: getCatchUpMessage(gap),
      suggestedAmount: Math.min(250, Math.max(100, gap)),
      priority: 'high',
    });
  }

  // ── 5. INTERVAL FALLBACK ──
  // Nếu không có reminder nào khác, thêm interval reminder
  const hasMeaningfulReminder = reminders.some((r) => r.reason !== 'interval');
  if (!hasMeaningfulReminder) {
    // Tính interval dựa trên consistency
    const consistency = pattern?.consistencyScore ?? 50;
    const intervalMinutes = consistency > 70 ? INCONSISTENT_INTERVAL : NORMAL_INTERVAL;

    // Tìm lần uống cuối
    let lastDrinkMinutes = 0;
    if (lastDrinkTime) {
      const last = new Date(lastDrinkTime);
      lastDrinkMinutes = Math.round((now.getTime() - last.getTime()) / 60000);
    }

    // Nếu đã quá interval, nhắc ngay
    if (lastDrinkMinutes >= intervalMinutes) {
      reminders.push({
        id: generateId(),
        scheduledAt: now.toISOString(),
        reason: 'interval',
        message: getIntervalMessage(),
        suggestedAmount: 200,
        priority: 'low',
      });
    } else {
      // Nhắc sau (interval - lastDrinkMinutes) phút nữa
      const nextTime = new Date(now.getTime() + (intervalMinutes - lastDrinkMinutes) * 60000);
      if (nextTime.getHours() < 23) {
        reminders.push({
          id: generateId(),
          scheduledAt: nextTime.toISOString(),
          reason: 'interval',
          message: getIntervalMessage(),
          suggestedAmount: 200,
          priority: 'low',
        });
      }
    }
  }

  // Sắp xếp theo thời gian, loại reminder quá khứ
  const nowTs = now.getTime();
  return reminders
    .filter((r) => new Date(r.scheduledAt).getTime() >= nowTs - 60000) // cho phép 1 phút sai số
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 10); // tối đa 10 reminder/lần generate
}

/**
 * Cache reminders vào localStorage
 */
export function cacheReminders(userId: string, reminders: SmartReminder[]): void {
  try {
    localStorage.setItem(
      `digiwell_reminders_${userId}`,
      JSON.stringify({ reminders, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

/**
 * Lấy cached reminders
 */
export function getCachedReminders(userId: string): SmartReminder[] {
  try {
    const raw = localStorage.getItem(`digiwell_reminders_${userId}`);
    if (!raw) return [];
    const { reminders } = JSON.parse(raw);
    return (reminders as SmartReminder[]).filter(
      (r) => new Date(r.scheduledAt).getTime() > Date.now(),
    );
  } catch {
    return [];
  }
}