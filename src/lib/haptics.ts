import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export function impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;
  const styleMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  Haptics.impact({ style: styleMap[style] }).catch(() => {});
}

export function selection() {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.selection().catch(() => {});
}

export function notify(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return;
  const typeMap = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
  Haptics.notification({ type: typeMap[type] }).catch(() => {});
}

export function vibrate(ms = 50) {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.vibrate({ duration: ms }).catch(() => {});
}
