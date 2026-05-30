import { useEffect, useState, useCallback, useRef } from 'react';
import i18n from '@/i18n';
import {
  registerServiceWorker,
  getExistingSubscription,
  subscribeToPush,
  subscriptionToRow,
  saveSubscriptionToServer,
  removeSubscriptionFromServer,
  requestNotificationPermission,
  sendPushNotification,
  isWebPushSupported,
} from '@/lib/pushNotification';

export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = isWebPushSupported();
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!userId || !isSupported) return;

    let cancelled = false;
    (async () => {
      const reg = await registerServiceWorker();
      if (!reg || cancelled) return;
      swRegRef.current = reg;

      const existing = await getExistingSubscription(reg);
      if (!cancelled) {
        setIsSubscribed(!!existing);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, isSupported]);

  const subscribe = useCallback(async () => {
    if (!userId || !isSupported) return false;
    setIsRegistering(true);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = swRegRef.current ?? await registerServiceWorker();
      if (!reg) return false;
      swRegRef.current = reg;

      const sub = await subscribeToPush(reg);
      if (!sub) return false;

      const row = subscriptionToRow(userId, sub);
      const saved = await saveSubscriptionToServer(row);
      if (saved) setIsSubscribed(true);
      return saved;
    } finally {
      setIsRegistering(false);
    }
  }, [userId, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    const reg = swRegRef.current;
    if (!reg) return;

    const existing = await getExistingSubscription(reg);
    if (existing) {
      await existing.unsubscribe();
      await removeSubscriptionFromServer(existing.endpoint);
    }
    setIsSubscribed(false);
  }, [isSupported]);

  const sendTestNotification = useCallback(async () => {
    if (!userId || !isSupported) return { ok: false, message: i18n.t('notification.push_not_supported') };
    setIsSendingTest(true);

    try {
      const ready = isSubscribed || await subscribe();
      if (!ready) return { ok: false, message: i18n.t('notification.push_not_enabled') };

      const result = await sendPushNotification({
        title: 'DigiWell',
        body: i18n.t('notification.push_test_body'),
        data: { url: '/', type: 'hydration_test', sentAt: new Date().toISOString() },
      });

      if (result.sent > 0) return { ok: true, message: i18n.t('notification.push_test_sent') };
      return { ok: false, message: result.message ?? i18n.t('notification.push_no_device') };
    } finally {
      setIsSendingTest(false);
    }
  }, [isSubscribed, isSupported, subscribe, userId]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isRegistering,
    isSendingTest,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
