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

function countEventsOnDate(events: CalendarEventItem[], dateKey: string) {
  return events.filter(ev => {
    const startKey = ev.startRaw.length >= 10 ? ev.startRaw.slice(0, 10) : '';
    if (!ev.isAllDay) return startKey === dateKey;
    const endKey = ev.endRaw.length >= 10 ? ev.endRaw.slice(0, 10) : '';
    return startKey <= dateKey && (!endKey || endKey > dateKey);
  }).length;
}

function countMeetingHours(events: CalendarEventItem[], dateKey: string) {
  return events
    .filter(ev => {
      const startKey = ev.startRaw.length >= 10 ? ev.startRaw.slice(0, 10) : '';
      return !ev.isAllDay && startKey === dateKey && ev.transparency !== 'transparent';
    })
    .reduce((total, ev) => {
      const start = new Date(ev.startRaw).getTime();
      const end = new Date(ev.endRaw).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return total;
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);
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
    const avgIntake = weeklyData.reduce((s, d) => s + d.ml, 0) / weeklyData.length;
    const goalRatio = waterGoal > 0 ? avgIntake / waterGoal : 0;

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
      const todayCount = countEventsOnDate(calendarEvents, todayKey);
      const todayMeetingHrs = countMeetingHours(calendarEvents, todayKey);

      if (todayCount > 0) {
        const meetingLabel = todayMeetingHrs > 0
          ? ` (${Math.round(todayMeetingHrs * 60)} phút họp)`
          : '';
        const riskLevel = todayMeetingHrs >= 4 ? 'cao' : todayMeetingHrs >= 2 ? 'trung bình' : 'thấp';
        const suggestedExtra = todayMeetingHrs >= 4 ? 500 : todayMeetingHrs >= 2 ? 250 : 150;

        result.push({
          id: 'calendar_today',
          category: 'calendar',
          icon: 'calendar',
          title: `Lịch hôm nay: ${todayCount} sự kiện${meetingLabel}`,
          insight: todayMeetingHrs >= 2
            ? `Ngày nhiều họp → nguy cơ quên uống nước ${riskLevel}. Nghiên cứu cho thấy người dùng giảm ${Math.round(Math.min(35, todayMeetingHrs * 8))}% lượng nước khi có ${todayMeetingHrs}+ giờ họp. Bù thêm ${suggestedExtra}ml để duy trì mục tiêu.`
            : `Bạn có ${todayCount} sự kiện hôm nay. Nhớ giữ nhịp uống nước đều đặn giữa các cuộc họp.`,
          impact: { label: 'Rủi ro', delta: riskLevel === 'cao' ? '⚠ Cao' : riskLevel === 'trung bình' ? 'Trung bình' : 'Thấp' },
          confidence: todayMeetingHrs >= 2 ? 0.85 : 0.6,
        });
      }

      // Tomorrow preview
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = getLocalDateKey(tomorrow);
      const tomorrowCount = countEventsOnDate(calendarEvents, tomorrowKey);
      const tomorrowMeetingHrs = countMeetingHours(calendarEvents, tomorrowKey);

      if (tomorrowCount > 2 || tomorrowMeetingHrs >= 2) {
        const meetingLabel = tomorrowMeetingHrs > 0
          ? ` (${Math.round(tomorrowMeetingHrs * 60)} phút họp)`
          : '';
        result.push({
          id: 'calendar_tomorrow',
          category: 'calendar',
          icon: 'calendar',
          title: `Ngày mai bận: ${tomorrowCount} sự kiện${meetingLabel}`,
          insight: `Chuẩn bị trước: ngày mai lịch dày, hãy uống đủ ${Math.round(waterGoal)}ml từ sớm để không bị thiếu hụt khi bận họp.`,
          impact: { label: 'Chuẩn bị', delta: `${tomorrowCount} events` },
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
    const meetingHrs = countMeetingHours(calendarEvents, todayKey);
    return Math.min(1, meetingHrs / 6); // 6+ hours = max risk
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
