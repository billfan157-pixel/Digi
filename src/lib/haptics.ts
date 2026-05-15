import { Capacitor } from '@capacitor/core';

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) return null;
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
  return { Haptics, ImpactStyle, NotificationType };
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(h => h?.Haptics.impact({ style: h.ImpactStyle[style] })).catch(() => {});
}

export function selection() {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(h => h?.Haptics.selection()).catch(() => {});
}

export function notify(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(h => h?.Haptics.notification({ type: h.NotificationType[type] })).catch(() => {});
}

export function vibrate(ms = 50) {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(h => h?.Haptics.vibrate({ duration: ms })).catch(() => {});
}
