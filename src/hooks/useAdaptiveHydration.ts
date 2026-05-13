import { useMemo } from 'react';
import type { WaterLog } from '../models';

interface ScheduleItem {
  time: string;
  amount: number;
}

interface AdaptiveSuggestion {
  type: 'SHIFT' | 'ADD' | 'REMOVE';
  originalTime: string;
  suggestedTime?: string;
  reason: string;
}

export function useAdaptiveHydration(
  waterEntries: WaterLog[],
  currentSchedule: ScheduleItem[]
) {
  const suggestions = useMemo(() => {
    if (waterEntries.length < 5 || currentSchedule.length === 0) return [];

    const newSuggestions: AdaptiveSuggestion[] = [];

    // Phân tích độ trễ (Delay Analysis)
    // Lấy 10 entries gần nhất
    const recentEntries = waterEntries.slice(-10);

    currentSchedule.forEach(slot => {
      const [slotH, slotM] = slot.time.split(':').map(Number);
      const slotMinutes = slotH * 60 + slotM;

      // Tìm các entries rơi vào khoảng +/- 60 phút của slot này
      const matchingEntries = recentEntries.filter(entry => {
        const d = new Date(entry.created_at || entry.timestamp);
        const entryMinutes = d.getHours() * 60 + d.getMinutes();
        return Math.abs(entryMinutes - slotMinutes) <= 60;
      });

      if (matchingEntries.length >= 3) {
        // Tính độ lệch trung bình
        const avgEntryMinutes = matchingEntries.reduce((sum, e) => {
          const d = new Date(e.created_at || e.timestamp);
          return sum + (d.getHours() * 60 + d.getMinutes());
        }, 0) / matchingEntries.length;

        const diff = avgEntryMinutes - slotMinutes;

        // Nếu lệch > 20 phút và diễn ra thường xuyên
        if (Math.abs(diff) > 20) {
          const h = Math.floor(avgEntryMinutes / 60);
          const m = Math.floor(avgEntryMinutes % 60);
          const suggestedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

          newSuggestions.push({
            type: 'SHIFT',
            originalTime: slot.time,
            suggestedTime,
            reason: `Bạn thường uống nước vào lúc ${suggestedTime} thay vì ${slot.time}. AI đề xuất dịch chuyển mốc này để khớp với thói quen của bạn.`
          });
        }
      }
    });

    return newSuggestions;
  }, [waterEntries, currentSchedule]);

  return { suggestions };
}
