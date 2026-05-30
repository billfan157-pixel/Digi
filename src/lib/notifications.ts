import { Capacitor } from '@capacitor/core';
import i18n from '@/i18n';

export type NotificationSchedule = 'daily' | 'hourly' | 'weekly';

interface HydrationReminderOptions {
  hour?: number;
  minute?: number;
  title?: string;
  body?: string;
}

function getDefaultReminders() {
  return [
    { hour: 9, minute: 0, title: 'DigiWell', body: i18n.t('notification.reminder_morning') },
    { hour: 11, minute: 0, title: 'DigiWell', body: i18n.t('notification.reminder_midday') },
    { hour: 14, minute: 0, title: 'DigiWell', body: i18n.t('notification.reminder_afternoon') },
    { hour: 16, minute: 0, title: 'DigiWell', body: i18n.t('notification.reminder_evening') },
    { hour: 19, minute: 0, title: 'DigiWell', body: i18n.t('notification.reminder_night') },
  ];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
}

export async function scheduleHydrationReminders(options: HydrationReminderOptions[] = []) {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const reminders = options.length > 0 ? options : getDefaultReminders();
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  await LocalNotifications.schedule({
    notifications: reminders.map((r, i) => ({
      title: r.title || 'DigiWell',
      body: r.body || i18n.t('notification.default_body'),
      id: i + 1,
      schedule: {
        every: 'day',
        hour: r.hour ?? 9,
        minute: r.minute ?? 0,
      },
      sound: 'default',
      smallIcon: 'ic_launcher',
      iconColor: '#0ea5e9',
    })),
  });
}

export async function cancelAllReminders() {
  if (!Capacitor.isNativePlatform()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0) {
    await LocalNotifications.cancel({ notifications });
  }
}

export async function getPendingReminders() {
  if (!Capacitor.isNativePlatform()) return [];
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { notifications } = await LocalNotifications.getPending();
  return notifications;
}
