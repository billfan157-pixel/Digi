/**
 * useSeasonalEvents Hook
 * Limited-time seasonal challenges
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  type: 'challenge' | 'quest' | 'milestone';
  rewards: {
    exp_bonus: number;
    coins: number;
    badge_id?: string;
  };
  progress_required: number;
  current_progress: number;
  is_completed: boolean;
}

export function useSeasonalEvents(userId: string | undefined) {
  const [activeEvent] = useState<SeasonalEvent | null>(null);

  // Get current season
  const currentSeason = useMemo(() => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }, []);

  // Fetch active events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['seasonal-events', userId, currentSeason],
    queryFn: async (): Promise<SeasonalEvent[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('start_date');
      if (error) return [];
      return data || [];
    },
    enabled: !!userId,
  });

  // Get user's progress in events
  const { data: progress = {} } = useQuery({
    queryKey: ['event-progress', userId],
    queryFn: async () => {
      if (!userId) return {};
      const { data, error } = await supabase
        .from('user_event_progress')
        .select('event_id, progress, completed')
        .eq('user_id', userId);
      if (error) return {};
      const map: Record<string, { progress: number; completed: boolean }> = {};
      (data || []).forEach(p => {
        map[p.event_id] = { progress: p.progress, completed: p.completed };
      });
      return map;
    },
    enabled: !!userId,
  });

  // Merge progress into events
  const eventsWithProgress = useMemo(() => {
    return events.map(event => ({
      ...event,
      current_progress: progress[event.id]?.progress || 0,
      is_completed: progress[event.id]?.completed || false,
    }));
  }, [events, progress]);

  const joinEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('user_event_progress')
      .upsert({
        user_id: userId,
        event_id: eventId,
        progress: 0,
        completed: false,
      });
    return !error;
  };

  return {
    currentSeason,
    events: eventsWithProgress,
    activeEvent,
    isLoading,
    joinEvent,
  };
}
