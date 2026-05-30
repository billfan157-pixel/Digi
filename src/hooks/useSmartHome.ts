/**
 * useSmartHome Hook
 * Smart home integration (Alexa, Google Home)
 */
import i18n from '@/i18n';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type SmartHomeProvider = 'alexa' | 'google_home' | 'homekit';

interface SmartHomeDevice {
  id: string;
  name: string;
  type: 'speaker' | 'display' | 'hub';
  provider: SmartHomeProvider;
  isLinked: boolean;
}

interface HomeIntent {
  action: 'log_water' | 'get_status' | 'get_reminder';
  amountMl?: number;
  response: string;
}

export function useSmartHome(userId: string | undefined) {
  const [, setDevices] = useState<SmartHomeDevice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get linked devices
  const { data: linkedDevices = [] } = useQuery({
    queryKey: ['smart-home-devices', userId],
    queryFn: async (): Promise<SmartHomeDevice[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_integrations')
        .select('id, provider, settings')
        .eq('user_id', userId)
        .in('provider', ['alexa', 'google_home', 'homekit']);
      if (error) return [];
      return (data || []).map(d => ({
        id: d.id,
        name: d.settings?.name || 'Smart Device',
        type: d.settings?.type || 'speaker',
        provider: d.provider as SmartHomeProvider,
        isLinked: true,
      }));
    },
    enabled: !!userId,
  });

  // Link Alexa account
  const linkAlexa = useCallback(async () => {
    console.log('[SmartHome] Initiating Alexa account linking');
    // Would redirect to Amazon OAuth
    return { success: true };
  }, []);

  // Link Google Home
  const linkGoogleHome = useCallback(async () => {
    console.log('[SmartHome] Initiating Google Home account linking');
    // Would redirect to Google OAuth
    return { success: true };
  }, []);

  // Process voice command from smart home
  const processIntent = useCallback(async (intent: HomeIntent): Promise<string> => {
    setIsProcessing(true);
    try {
      switch (intent.action) {
        case 'log_water':
          if (intent.amountMl) {
            await supabase.rpc('record_hydration_event', {
              p_user_id: userId,
              p_amount_ml: intent.amountMl,
            });
            return i18n.t('common.voice_water_logged', { amount: intent.amountMl });
          }
          return i18n.t('common.voice_dont_understand_amount');

        case 'get_status': {
          // Get today's total
          const today = new Date().toISOString().split('T')[0];
          const { data: todayData } = await supabase
            .from('water_logs')
            .select('amount')
            .eq('user_id', userId)
            .gte('created_at', today);

          const totalToday = (todayData || []).reduce((sum, log) => sum + log.amount, 0);
          return i18n.t('common.voice_status', { amount: totalToday });
        }

        case 'get_reminder':
          return i18n.t('common.voice_drink_reminder');

        default:
          return i18n.t('common.voice_dont_understand');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [userId]);

  // Unlink device
  const unlinkDevice = useCallback(async (deviceId: string) => {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', deviceId);

    if (!error) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    }
    return { success: !error };
  }, []);

  return {
    devices: linkedDevices,
    isProcessing,
    linkAlexa,
    linkGoogleHome,
    processIntent,
    unlinkDevice,
  };
}
