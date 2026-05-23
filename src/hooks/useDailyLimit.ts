import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export interface AIUsageToday {
  message_count: number;
  advice_count: number;
  scan_count: number;
}

export function useDailyLimit() {
  const profile = useAppStore(s => s.profile);
  const userId = profile?.id;

  return useQuery({
    queryKey: ['aiUsageToday', userId],
    queryFn: async (): Promise<AIUsageToday> => {
      if (!userId) return { message_count: 0, advice_count: 0, scan_count: 0 };
      
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ai_usage')
        .select('message_count, advice_count, scan_count')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today\'s AI usage:', error);
        return { message_count: 0, advice_count: 0, scan_count: 0 };
      }

      return data || { message_count: 0, advice_count: 0, scan_count: 0 };
    },
    enabled: !!userId,
    staleTime: 5000,
  });
}
