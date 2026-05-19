import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function getPreviousWeekDates(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return dates;
}

export function usePreviousWeekData(userId: string | undefined, enabled: boolean = true) {
  const query = useQuery({
    queryKey: ['previousWeek', userId] as const,
    queryFn: async () => {
      const dates = getPreviousWeekDates();
      const { data, error } = await supabase
        .from('water_logs')
        .select('amount, day')
        .eq('user_id', userId)
        .in('day', dates);
      if (error) throw error;

      const dayMap: Record<string, number> = {};
      (data || []).forEach((log: { day: string; amount: number }) => {
        if (log.day) dayMap[log.day] = (dayMap[log.day] || 0) + (log.amount || 0);
      });

      return dates.map(d => ({
        d: d.split('-')[2],
        ml: dayMap[d] || 0,
        isToday: false,
      }));
    },
    enabled: !!userId && enabled,
    staleTime: 60_000,
  });

  return { data: query.data ?? [], isLoading: query.isLoading };
}
