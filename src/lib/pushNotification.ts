import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export type PushPlatform = 'web' | 'native';

export interface PushSubscriptionRow {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  device_name?: string;
  platform?: PushPlatform;
  created_at?: string;
}

const SW_PATH = '/push-sw.js';

function getVapidKey(): string {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY not set — push subscriptions will fail');
    return '';
  }
  return key;
}

interface SendPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
  } catch {
    console.warn('[push] Service worker registration failed');
    return null;
  }
}

export async function getExistingSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const existing = await getExistingSubscription(reg);
    if (existing) return existing;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidKey()),
    });
    return sub;
  } catch {
    console.warn('[push] Subscribe failed — permission denied or missing VAPID');
    return null;
  }
}

export function subscriptionToRow(userId: string, sub: PushSubscription, deviceName?: string): PushSubscriptionRow {
  const key = sub.toJSON();
  if (!key.keys?.p256dh || !key.keys?.auth) {
    throw new Error('Push subscription missing encryption keys');
  }

  return {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: key.keys.p256dh,
    auth: key.keys.auth,
    platform: 'web',
    device_name: deviceName ?? navigator.userAgent.slice(0, 100),
  };
}

export function nativeTokenToRow(userId: string, token: string): PushSubscriptionRow {
  return {
    user_id: userId,
    endpoint: token,
    platform: 'native',
    device_name: Capacitor.isNativePlatform() ? 'Capacitor' : navigator.userAgent.slice(0, 100),
  };
}

export async function saveSubscriptionToServer(row: PushSubscriptionRow): Promise<boolean> {
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: row.endpoint, user_id: row.user_id, p256dh: row.p256dh, auth: row.auth, device_name: row.device_name },
    { onConflict: 'endpoint' },
  );
  if (error) {
    console.warn('[push] Failed to save subscription:', error.message);
    return false;
  }
  return true;
}

export async function removeSubscriptionFromServer(endpoint: string): Promise<boolean> {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) {
    console.warn('[push] Failed to remove subscription:', error.message);
    return false;
  }
  return true;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

export async function sendPushNotification(payload: SendPushPayload): Promise<{ sent: number; total: number; message?: string }> {
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? '/pwa-192x192.png',
      badge: payload.badge ?? '/pwa-192x192.png',
      data: payload.data ?? {},
    },
  });

  if (error) throw new Error(error.message);
  return {
    sent: Number(data?.sent ?? 0),
    total: Number(data?.total ?? 0),
    message: typeof data?.message === 'string' ? data.message : undefined,
  };
}

export function isWebPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
