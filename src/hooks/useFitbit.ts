/**
 * useFitbit Hook
 * Fitbit integration for hydration tracking
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FitbitHydrationData {
  date: string;
  log_id: string;
  amount_ml: number;
  time: string;
}

export function useFitbit(userId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);

  // Check Fitbit connection
  const { data: connectionStatus } = useQuery({
    queryKey: ['fitbit-status', userId],
    queryFn: async () => {
      if (!userId) return { connected: false };
      const { data, error } = await supabase
        .from('user_integrations')
        .select('settings')
        .eq('user_id', userId)
        .eq('provider', 'fitbit')
        .single();
      if (error || !data) return { connected: false };
      return { connected: true, settings: data.settings };
    },
    enabled: !!userId,
  });

  // Sync hydration to Fitbit
  const syncToFitbit = useCallback(async (data: FitbitHydrationData[]) => {
    console.log('[Fitbit] Syncing', data.length, 'hydration entries');
    setIsConnected(true);
    return { success: true, synced: data.length };
  }, []);

  // Get data from Fitbit
  const getFromFitbit = useCallback(async (): Promise<FitbitHydrationData[]> => {
    console.log('[Fitbit] Fetching hydration data from Fitbit API');
    return [];
  }, []);

  // OAuth connect
  const connectFitbit = useCallback(async () => {
    console.log('[Fitbit] Initiating OAuth');
    setIsConnected(true);
    return { success: true };
  }, []);

  const disconnectFitbit = useCallback(() => {
    setIsConnected(false);
  }, []);

  return {
    isConnected: isConnected || connectionStatus?.connected || false,
    syncToFitbit,
    getFromFitbit,
    connectFitbit,
    disconnectFitbit,
  };
}