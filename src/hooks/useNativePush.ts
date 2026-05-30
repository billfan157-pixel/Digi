import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

export function useNativePush(userId: string | undefined) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        PushNotifications.addListener('registration', (token) => {
          if (cancelled) return;
          setFcmToken(token.value);
          saveNativeToken(userId, token.value);
          setIsRegistered(true);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.warn('[nativePush] Registration error:', err.error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[nativePush] Received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const data = action.notification.data;
          if (data?.url && typeof data.url === 'string') {
            window.location.href = data.url;
          }
        });

        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (err) {
        console.warn('[nativePush] Setup failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const saveNativeToken = useCallback(async (uid: string, token: string) => {
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: token,
        user_id: uid,
        platform: 'native',
        device_name: 'Capacitor',
      },
      { onConflict: 'endpoint' },
    );
    if (error) console.warn('[nativePush] Failed to save token:', error.message);
  }, []);

  const unregister = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !fcmToken) return;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.unregister();
      await supabase.from('push_subscriptions').delete().eq('endpoint', fcmToken);
      setFcmToken(null);
      setIsRegistered(false);
    } catch (err) {
      console.warn('[nativePush] Unregister failed:', err);
    }
  }, [fcmToken]);

  return { fcmToken, isRegistered, unregister };
}
