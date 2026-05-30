/**
 * useGarmin Hook
 * Garmin Connect IQ Widget integration
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface GarminHydrationData {
  date: string;
  total_ml: number;
  goal_ml: number;
  intake_count: number;
}

export function useGarmin(userId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [linkedUsers] = useState<string[]>([]);

  // Check Garmin connection status
  const { data: connectionStatus } = useQuery({
    queryKey: ['garmin-status', userId],
    queryFn: async () => {
      if (!userId) return { connected: false };
      const { data, error } = await supabase
        .from('user_integrations')
        .select('settings')
        .eq('user_id', userId)
        .eq('provider', 'garmin')
        .single();
      if (error || !data) return { connected: false };
      return { connected: true, settings: data.settings };
    },
    enabled: !!userId,
  });

  // Sync hydration data to Garmin
  const syncToGarmin = useCallback(async (data: GarminHydrationData[]) => {
    // Garmin Connect IQ uses Garmin Health API
    // This would integrate with Garmin's OAuth and Health API
    console.log('[Garmin] Syncing', data.length, 'days of hydration data');
    setIsConnected(true);
    return { success: true, synced: data.length };
  }, []);

  // Get hydration data from Garmin
  const getFromGarmin = useCallback(async (): Promise<GarminHydrationData[]> => {
    // In production, this would call Garmin Health API
    console.log('[Garmin] Fetching hydration data');
    return [];
  }, []);

  // Connect Garmin account (OAuth flow would go here)
  const connectGarmin = useCallback(async () => {
    // Initiate Garmin OAuth
    console.log('[Garmin] Initiating OAuth flow');

    // For demo, simulate connection
    setIsConnected(true);
    return { success: true };
  }, []);

  const disconnectGarmin = useCallback(() => {
    setIsConnected(false);
  }, []);

  return {
    isConnected: isConnected || connectionStatus?.connected || false,
    linkedUsers,
    syncToGarmin,
    getFromGarmin,
    connectGarmin,
    disconnectGarmin,
  };
}
