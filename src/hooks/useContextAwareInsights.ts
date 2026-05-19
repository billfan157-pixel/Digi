import { useMemo } from 'react';
import type { CalendarEventItem } from './useCalendarSync';

export interface ContextInsight {
  id: string;
  category: 'calendar' | 'weather' | 'day_pattern' | 'sleep';
  icon: 'calendar' | 'thermometer' | 'clock' | 'moon';
  title: string;
  insight: string;
  impact: { label: string; delta: string };
  confidence: number; // 0-1
}

interface UseContextAwareInsightsOptions {
  weeklyData: { d: string; ml: number; isToday?: boolean }[];
  waterGoal: number;
  waterIntake: number;
  calendarEvents: CalendarEventItem[];
  isCalendarSynced: boolean;
  weatherData: { temp?: number; humidity?: number; feelsLike?: number; status?: string } | null;
  isWeatherSynced: boolean;
  sleepHours: number;
  sleepQuality: number;
}

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function getLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getBusyEvents(events: CalendarEventItem[], dateKey: string) {
  return events.filter(ev => {
    const startKey = ev.startRaw.length >= 10 ? ev.startRaw.slice(0, 10) : '';
    return !ev.isAllDay && startKey === dateKey && ev.transparency !== 'transparent';
  });
}

function countBusyHours(events: CalendarEventItem[], dateKey: string) {
  return getBusyEvents(events, dateKey)
    .reduce((total, ev) => {
      const start = new Date(ev.startRaw).getTime();
      const end = new Date(ev.endRaw).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return total;
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);
}

const RISK_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

type EventCategory =
  | 'sleep' | 'meal' | 'exercise' | 'meeting'
  | 'school' | 'social' | 'medical' | 'travel'
  | 'entertainment' | 'work' | 'other';

const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, 'other'>, { vi: string; en: string }> = {
  sleep:        { vi: 'ngủ|nghỉ trưa|nap',                  en: 'sleep|nap|rest|break' },
  meal:         { vi: 'ăn|ăn trưa|ăn sáng|ăn tối|cơm|bữa',  en: 'lunch|dinner|breakfast|meal|eat|food|coffee|tea' },
  exercise:     { vi: 'tập|gym|chạy|yoga|bơi|đạp|thể dục',  en: 'gym|workout|run|yoga|swim|bike|exercise|sport' },
  meeting:      { vi: 'họp|meeting|cocall|call|pitch',       en: 'meeting|call|sync|standup|review|interview' },
  school:       { vi: 'học|lớp|bài|thi|ôn',                  en: 'class|lecture|study|lesson|course|exam|test' },
  social:       { vi: 'đi chơi|hẹn|date|party|nhậu|gặp',     en: 'date|party|hangout|dinner|drinks|friend' },
  medical:      { vi: 'khám|bác sĩ|bệnh|tái khám|chích',     en: 'doctor|hospital|clinic|appointment|checkup|medical|dentist' },
  travel:       { vi: 'đi|bay|máy bay|tàu|xe khách|lái',     en: 'travel|flight|drive|commute|trip|journey' },
  entertainment:{ vi: 'phim|cinema|rạp|concert|game|show',    en: 'movie|cinema|concert|game|theater|show' },
  work:         { vi: 'làm việc|work|project|sprint|task',    en: 'work|task|project|sprint|deadline|office' },
};

function classifyEvent(title: string): EventCategory {
  const t = title.toLowerCase().trim();
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    const pattern = `${kw.vi}|${kw.en}`;
    if (new RegExp(pattern, 'i').test(t)) return cat as EventCategory;
  }
  return 'meeting';
}

const CATEGORY_PROFILES: Record<EventCategory, {
  label: string;
  risk: 'low' | 'medium' | 'high';
  advice: string;
  extraMl: number;
}> = {
  sleep:   { label: 'giấc ngủ',   risk: 'low',    extraMl: 0,    advice: 'Uống 150ml nước ấm trước khi ngủ, tránh uống sát giờ để khỏi tiểu đêm.' },
  meal:    { label: 'bữa ăn',     risk: 'low',    extraMl: 0,    advice: 'Nhân tiện ăn, uống 200ml nước để hỗ trợ tiêu hóa.' },
  exercise:{ label: 'tập luyện',  risk: 'high',   extraMl: 400,  advice: 'Vận động ra nhiều mồ hôi, cần bù 400ml trước/sau buổi tập.' },
  meeting: { label: 'họp hành',   risk: 'high',   extraMl: 250,  advice: 'Mang chai nước vào phòng họp, uống từng ngụm giữa các phiên.' },
  school:  { label: 'học tập',    risk: 'medium', extraMl: 150,  advice: 'Để chai nước trên bàn học, uống đều đặn mỗi 30 phút.' },
  social:  { label: 'đi chơi',    risk: 'high',   extraMl: 300,  advice: 'Dễ uống bia/rượu thay vì nước. Xen kẽ 1 ly nước giữa các ly khác.' },
  medical: { label: 'y tế',       risk: 'medium', extraMl: 0,    advice: 'Nếu không có chỉ định nhịn ăn/uống, hãy uống 200ml trước khi đi.' },
  travel:  { label: 'di chuyển',  risk: 'high',   extraMl: 350,  advice: 'Mang theo bình nước khi di chuyển, uống thêm 350ml để bù.' },
  entertainment: { label: 'giải trí', risk: 'medium', extraMl: 200, advice: 'Phim/game dễ cuốn theo, đặt nhắc nhở uống nước mỗi 45 phút.' },
  work:    { label: 'làm việc',   risk: 'medium', extraMl: 200,  advice: 'Để nước trên bàn làm việc, tập thói quen uống mỗi khi chuyển task.' },
  other:   { label: 'lịch trình', risk: 'medium', extraMl: 150,  advice: 'Giữ chai nước bên cạnh, uống từng ngụm nhỏ đều đặn.' },
};

function classifyEvents(events: CalendarEventItem[], dateKey: string) {
  const busy = getBusyEvents(events, dateKey);
  return busy.map(ev => ({
    ...ev,
    category: classifyEvent(ev.title),
    profile: CATEGORY_PROFILES[classifyEvent(ev.title)],
  }));
}

function summarizeProfile(categorized: ReturnType<typeof classifyEvents>): {
  worstRisk: EventCategory;
  dominantLabel: string;
  totalExtraMl: number;
  adviceLines: string[];
  sampleName: string;
} {
  if (categorized.length === 0) {
    return { worstRisk: 'other', dominantLabel: 'khác', totalExtraMl: 0, adviceLines: [], sampleName: '' };
  }
  const byCat = new Map<EventCategory, { count: number; hours: number; names: string[] }>();
  for (const ev of categorized) {
    const cat = ev.category;
    const cur = byCat.get(cat) ?? { count: 0, hours: 0, names: [] };
    cur.count++;
    cur.names.push(ev.title);
    const start = new Date(ev.startRaw).getTime();
    const end = new Date(ev.endRaw).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      cur.hours += (end - start) / (1000 * 60 * 60);
    }
    byCat.set(cat, cur);
  }
  const entries = Array.from(byCat.entries()).sort((a, b) => b[1].hours - a[1].hours);
  const dominant = entries[0][0];
  const totalExtraMl = entries.reduce((s, [cat, info]) => {
    return s + CATEGORY_PROFILES[cat].extraMl * Math.max(1, Math.ceil(info.hours / 2));
  }, 0);
  const worstRisk = entries.reduce((worst, [cat]) => {
    return RISK_ORDER[CATEGORY_PROFILES[cat].risk] > RISK_ORDER[CATEGORY_PROFILES[worst].risk] ? cat : worst;
  }, dominant);
  const adviceLines = [...new Set(entries.map(([cat]) => CATEGORY_PROFILES[cat].advice))].slice(0, 2);
  const sampleName = categorized.find(e => e.title?.trim())?.title || '';
  return { worstRisk, dominantLabel: CATEGORY_PROFILES[dominant].label, totalExtraMl, adviceLines, sampleName };
}

export function useContextAwareInsights({
  weeklyData,
  waterGoal,
  waterIntake,
  calendarEvents,
  isCalendarSynced,
  weatherData,
  isWeatherSynced,
  sleepHours,
  sleepQuality,
}: UseContextAwareInsightsOptions) {
  const insights = useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (weeklyData.length < 3) return result;

    const todayKey = getLocalDateKey(new Date());

    // ── 1. DAY-OF-WEEK PATTERN ──
    const dayOfWeekMap = new Map<number, { total: number; count: number }>();
    weeklyData.forEach(entry => {
      const d = new Date(entry.d);
      if (!Number.isNaN(d.getTime())) {
        const dow = d.getDay();
        const existing = dayOfWeekMap.get(dow) || { total: 0, count: 0 };
        existing.total += entry.ml;
        existing.count += 1;
        dayOfWeekMap.set(dow, existing);
      }
    });

    if (dayOfWeekMap.size >= 3) {
      const dayAvgs = Array.from(dayOfWeekMap.entries()).map(
        ([dow, { total, count }]) => ({ dow, avg: total / count, count, name: DAY_NAMES[dow] })
      );
      dayAvgs.sort((a, b) => a.avg - b.avg);

      const worst = dayAvgs[0];
      const best = dayAvgs[dayAvgs.length - 1];
      const spread = best.avg - worst.avg;

      if (spread > waterGoal * 0.15 && worst.count >= 1) {
        const pctDrop = Math.round((1 - worst.avg / best.avg) * 100);
        const isTodayWorst = new Date(todayKey).getDay() === worst.dow;
        result.push({
          id: 'day_pattern',
          category: 'day_pattern',
          icon: 'clock',
          title: isTodayWorst ? `Hôm nay là ngày yếu của bạn` : `${worst.name} — ngày dễ quên uống nước`,
          insight: isTodayWorst
            ? `Trung bình ${worst.name} bạn chỉ uống ${Math.round(worst.avg)}ml, thấp hơn ${pctDrop}% so với ngày tốt nhất (${best.name}: ${Math.round(best.avg)}ml). Hãy đặt nhắc nhở hôm nay!`
            : `Dữ liệu cho thấy ${worst.name} bạn uống ít nhất (${Math.round(worst.avg)}ml), thấp hơn ${pctDrop}% so với ${best.name} (${Math.round(best.avg)}ml).`,
          impact: { label: 'Chênh lệch ngày', delta: `-${pctDrop}%` },
          confidence: Math.min(0.95, 0.5 + worst.count * 0.15),
        });
      }
    }

    // ── 2. CALENDAR IMPACT (today + tomorrow) ──
    if (isCalendarSynced && calendarEvents.length > 0) {
      const todayClassified = classifyEvents(calendarEvents, todayKey);

      if (todayClassified.length > 0) {
        const { worstRisk, dominantLabel, adviceLines, sampleName } = summarizeProfile(todayClassified);
        const totalHours = todayClassified.reduce((s, ev) => {
          const start = new Date(ev.startRaw).getTime();
          const end = new Date(ev.endRaw).getTime();
          return s + (Number.isNaN(start) || Number.isNaN(end) ? 0 : (end - start) / (1000 * 60 * 60));
        }, 0);

        const riskLevel = worstRisk === 'exercise' || worstRisk === 'social' || worstRisk === 'travel' ? 'cao'
          : worstRisk === 'meeting' && totalHours >= 4 ? 'cao'
          : totalHours >= 3 ? 'trung bình' : 'thấp';
        const riskBadge = riskLevel === 'cao' ? '⚠ Cao' : riskLevel === 'trung bình' ? 'Trung bình' : 'Thấp';

        result.push({
          id: 'calendar_today',
          category: 'calendar',
          icon: 'calendar',
          title: `Hôm nay: ${dominantLabel}${sampleName ? ` (${sampleName})` : ''}`,
          insight: totalHours >= 2
            ? `${todayClassified.length} lịch trình với ${Math.round(totalHours * 10) / 10}h ${dominantLabel}. ${adviceLines[0] || ''}`
            : `Hôm nay có ${todayClassified.length} sự kiện: ${dominantLabel}. Giữ chai nước bên cạnh.`,
          impact: { label: 'Rủi ro', delta: riskBadge },
          confidence: totalHours >= 2 ? 0.85 : 0.6,
        });
      }

      // Tomorrow preview
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = getLocalDateKey(tomorrow);
      const tomorrowClassified = classifyEvents(calendarEvents, tomorrowKey);

      if (tomorrowClassified.length > 2) {
        const { dominantLabel, totalExtraMl, sampleName } = summarizeProfile(tomorrowClassified);
        result.push({
          id: 'calendar_tomorrow',
          category: 'calendar',
          icon: 'calendar',
          title: `Ngày mai: ${dominantLabel}${sampleName ? ` (${sampleName})` : ''}`,
          insight: `Ngày mai có ${tomorrowClassified.length} lịch trình ${dominantLabel}. Chuẩn bị nước từ tối nay${totalExtraMl > 0 ? `, cần thêm ${totalExtraMl}ml nước` : ''}.`,
          impact: { label: 'Chuẩn bị', delta: `${tomorrowClassified.length} events` },
          confidence: 0.7,
        });
      }
    }

    // ── 3. WEATHER IMPACT ──
    if (isWeatherSynced && weatherData && weatherData.temp !== undefined) {
      const { temp, humidity } = weatherData;
      const isHot = temp >= 32;
      const isHumid = humidity !== undefined && humidity >= 75;
      const isHotAndHumid = isHot && isHumid;

      if (isHotAndHumid) {
        const extraNeed = 500;
        const adjustedGoal = waterGoal + extraNeed;
        const deficit = Math.max(0, adjustedGoal - waterIntake);
        result.push({
          id: 'weather_hot_humid',
          category: 'weather',
          icon: 'thermometer',
          title: `Nắng nóng + ẩm cao (${Math.round(temp)}°C, ${humidity}% ẩm)`,
          insight: `Thời tiết nắng nóng kết hợp độ ẩm cao làm cơ thể mất nước nhanh hơn bình thường. Mục tiêu thực tế hôm nay nên là ${adjustedGoal}ml (+${extraNeed}ml). Hiện tại còn thiếu ${deficit}ml.`,
          impact: { label: 'Nhu cầu thêm', delta: `+${extraNeed}ml` },
          confidence: 0.9,
        });
      } else if (isHot) {
        const extraNeed = 250;
        const adjustedGoal = waterGoal + extraNeed;
        const deficit = Math.max(0, adjustedGoal - waterIntake);
        result.push({
          id: 'weather_hot',
          category: 'weather',
          icon: 'thermometer',
          title: `Trời nóng (${Math.round(temp)}°C)`,
          insight: `Nhiệt độ cao làm tăng mất nước qua mồ hôi. Nên tăng mục tiêu lên ${adjustedGoal}ml (+${extraNeed}ml). Còn thiếu ${deficit}ml.`,
          impact: { label: 'Nhu cầu thêm', delta: `+${extraNeed}ml` },
          confidence: 0.85,
        });
      }
    }

    // ── 4. SLEEP IMPACT ──
    if (sleepHours > 0 && sleepQuality > 0) {
      const sleepDeficit = sleepHours < 7;
      const poorQuality = sleepQuality < 5;

      if (sleepDeficit || poorQuality) {
        const extraWater = sleepDeficit ? 300 : 150;
        const reason = sleepDeficit && poorQuality
          ? `Ngủ ít (${sleepHours}h) và chất lượng thấp (${sleepQuality}/10)`
          : sleepDeficit
            ? `Ngủ ít (${sleepHours}h, mục tiêu 7-8h)`
            : `Chất lượng giấc ngủ thấp (${sleepQuality}/10)`;
        result.push({
          id: 'sleep_impact',
          category: 'sleep',
          icon: 'moon',
          title: `Giấc ngủ ảnh hưởng đến hydrat hóa`,
          insight: `${reason} làm cơ thể mất cân bằng điện giải. Uống thêm ${extraWater}ml sáng nay để bù đắp. Thiếu ngủ + thiếu nước = giảm tập trung nghiêm trọng.`,
          impact: { label: 'Bù đắp', delta: `+${extraWater}ml` },
          confidence: sleepDeficit && poorQuality ? 0.8 : 0.65,
        });
      }
    }

    // ── 5. CONSISTENCY TREND ──
    if (weeklyData.length >= 5) {
      const firstHalf = weeklyData.slice(0, Math.floor(weeklyData.length / 2));
      const secondHalf = weeklyData.slice(Math.floor(weeklyData.length / 2));
      const firstAvg = firstHalf.reduce((s, d) => s + d.ml, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, d) => s + d.ml, 0) / secondHalf.length;
      const trendPct = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

      if (Math.abs(trendPct) >= 10) {
        const direction = trendPct > 0 ? 'tăng' : 'giảm';
        const emoji = trendPct > 0 ? '📈' : '📉';
        result.push({
          id: 'consistency_trend',
          category: 'day_pattern',
          icon: 'clock',
          title: `Xu hướng tuần này: ${direction} ${Math.abs(trendPct)}%`,
          insight: trendPct > 0
            ? `${emoji} Phong độ đang lên! Nửa sau tuần uống trung bình ${Math.round(secondAvg)}ml so với ${Math.round(firstAvg)}ml nửa đầu. Duy trì nhịp này là sẽ đạt streak mới.`
            : `${emoji} Cảnh báo: nửa sau tuần uống giảm còn ${Math.round(secondAvg)}ml so với ${Math.round(firstAvg)}ml nửa đầu. Cần lấy lại nhịp trước khi cuối tuần.`,
          impact: { label: 'Xu hướng', delta: `${trendPct > 0 ? '+' : ''}${trendPct}%` },
          confidence: 0.75,
        });
      }
    }

    // Sort by confidence descending
    result.sort((a, b) => b.confidence - a.confidence);

    return result;
  }, [weeklyData, waterGoal, waterIntake, calendarEvents, isCalendarSynced, weatherData, isWeatherSynced, sleepHours, sleepQuality]);

  const calendarRiskScore = useMemo(() => {
    if (!isCalendarSynced || calendarEvents.length === 0) return 0;
    const todayKey = getLocalDateKey(new Date());
    const busyHrs = countBusyHours(calendarEvents, todayKey);
    return Math.min(1, busyHrs / 6);
  }, [calendarEvents, isCalendarSynced]);

  const weatherAdjustment = useMemo(() => {
    if (!isWeatherSynced || !weatherData || weatherData.temp === undefined) return 0;
    const { temp, humidity } = weatherData;
    if (temp >= 35 || (temp >= 32 && (humidity ?? 0) >= 75) || (humidity ?? 0) >= 85) return 500;
    if (temp >= 30 || (temp >= 28 && (humidity ?? 0) >= 75)) return 250;
    return 0;
  }, [weatherData, isWeatherSynced]);

  return { insights, calendarRiskScore, weatherAdjustment };
}
