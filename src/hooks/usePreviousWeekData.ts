import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePreviousWeekData(userId: string | undefined, enabled: boolean = true) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !enabled) return;
    
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const dates = [];
        for (let i = 7; i >= 1; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }

        const { data: result, error } = await supabase
          .from('water_logs')
          .select('amount, day')
          .eq('user_id', userId)
          .in('day', dates);

        if (error) throw error;
        
        if (!mounted) return;
        
        // Aggregate by day
        const dayMap: Record<string, number> = {};
        (result || []).forEach((log: any) => {
          if (log.day) {
            dayMap[log.day] = (dayMap[log.day] || 0) + (log.amount || 0);
          }
        });
        
        const formatted = dates.map(d => ({
          d: d.split('-')[2], // Just the day number
          ml: dayMap[d] || 0,
          isToday: false
        }));
        
        setData(formatted);
      } catch (err) {
        console.error('Error fetching previous week data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [userId, enabled]);

  return { data, isLoading };
}