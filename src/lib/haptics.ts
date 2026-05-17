import { Capacitor } from '@capacitor/core';

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) return null;
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
  return { Haptics, ImpactStyle, NotificationType };
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then((h) => {
    if (!h) return;
    const styles = {
      light: h.ImpactStyle.Light,
      medium: h.ImpactStyle.Medium,
      heavy: h.ImpactStyle.Heavy,
    };
    return h.Haptics.impact({ style: styles[style] });
  }).catch(() => {});
}

export function selection() {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(async (h) => {
    if (!h) return;
    await h.Haptics.selectionStart();
    await h.Haptics.selectionChanged();
    await h.Haptics.selectionEnd();
  }).catch(() => {});
}

export function notify(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then((h) => {
    if (!h) return;
    const types = {
      success: h.NotificationType.Success,
      warning: h.NotificationType.Warning,
      error: h.NotificationType.Error,
    };
    return h.Haptics.notification({ type: types[type] });
  }).catch(() => {});
}

export function vibrate(ms = 50) {
  if (!Capacitor.isNativePlatform()) return;
  getHaptics().then(h => h?.Haptics.vibrate({ duration: ms })).catch(() => {});
}
