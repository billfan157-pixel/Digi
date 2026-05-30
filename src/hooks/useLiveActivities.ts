/**
 * useLiveActivities Hook
 * Real-time hydration tracking & presence
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface LiveUser {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  current_ml: number;
  goal_ml: number;
  last_active: string;
}

interface LiveActivity {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  action: 'drank' | 'refilled' | 'achieved';
  amount_ml: number | null;
  timestamp: string;
}

export function useLiveActivities() {
  const [liveUsers] = useState<LiveUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<LiveActivity[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Subscribe to friends' hydration (realtime)
  useEffect(() => {
    if (!isActive) return;

    const channel = supabase
      .channel('live-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_logs' },
        async (payload) => {
          const newLog = payload.new as { user_id: string; amount: number; created_at: string };

          // Fetch user info
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', newLog.user_id)
            .single();

          if (profile) {
            const activity: LiveActivity = {
              id: newLog.user_id + newLog.created_at,
              user_id: newLog.user_id,
              nickname: profile.nickname || 'User',
              avatar_url: profile.avatar_url,
              action: 'drank',
              amount_ml: newLog.amount,
              timestamp: newLog.created_at,
            };

            setRecentActivity(prev => [activity, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isActive]);

  const startLiveActivities = useCallback(() => setIsActive(true), []);
  const stopLiveActivities = useCallback(() => setIsActive(false), []);

  return {
    liveUsers,
    recentActivity,
    isActive,
    startLiveActivities,
    stopLiveActivities,
  };
}