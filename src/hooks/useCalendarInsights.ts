import { useMemo } from 'react';
import type { CalendarEventItem } from './useCalendarSync';
import {
  getLocalDateKey,
  classifyEvents,
  summarizeProfile,
  countBusyHours,
} from './insight/insightHelpers';
import type { ContextInsight } from './useContextAwareInsights';
import { useAppStore } from '../store/useAppStore';

interface UseCalendarInsightsOptions {
  calendarEvents: CalendarEventItem[];
  isCalendarSynced: boolean;
}

export function useCalendarInsights({
  calendarEvents,
  isCalendarSynced,
}: UseCalendarInsightsOptions): { insights: ContextInsight[]; riskScore: number } {
  const profile = useAppStore(s => s.profile);
  const privacyLevel = profile?.calendar_privacy_level || 'standard';

  const insights = useMemo((): ContextInsight[] => {
    const result: ContextInsight[] = [];
    if (!isCalendarSynced || calendarEvents.length === 0) return result;

    const todayKey = getLocalDateKey(new Date());
    const todayClassified = classifyEvents(calendarEvents, todayKey, privacyLevel);

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
    const tomorrowClassified = classifyEvents(calendarEvents, tomorrowKey, privacyLevel);

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

    return result;
  }, [calendarEvents, isCalendarSynced, privacyLevel]);

  const riskScore = useMemo(() => {
    if (!isCalendarSynced || calendarEvents.length === 0) return 0;
    const todayKey = getLocalDateKey(new Date());
    const busyHrs = countBusyHours(calendarEvents, todayKey);
    return Math.min(1, busyHrs / 6);
  }, [calendarEvents, isCalendarSynced]);

  return { insights, riskScore };
}

