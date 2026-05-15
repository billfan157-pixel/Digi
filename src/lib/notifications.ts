import { Capacitor } from '@capacitor/core';

export type NotificationSchedule = 'daily' | 'hourly' | 'weekly';

interface HydrationReminderOptions {
  hour?: number;
  minute?: number;
  title?: string;
  body?: string;
}

const DEFAULT_REMINDERS = [
  { hour: 9, minute: 0, title: 'DigiWell', body: 'Bắt đầu ngày mới với 250ml nước!' },
  { hour: 11, minute: 0, title: 'DigiWell', body: 'Đã uống đủ nước sáng nay chưa?' },
  { hour: 14, minute: 0, title: 'DigiWell', body: 'Nhắc nhở: Uống 200ml nước để duy trì năng lượng.' },
  { hour: 16, minute: 0, title: 'DigiWell', body: 'Cơ thể đang cần nước. Uống ngay 150ml!' },
  { hour: 19, minute: 0, title: 'DigiWell', body: 'Sắp hoàn thành mục tiêu hôm nay rồi!' },
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { granted } = await LocalNotifications.requestPermissions();
  return granted;
}

export async function scheduleHydrationReminders(options: HydrationReminderOptions[] = []) {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const reminders = options.length > 0 ? options : DEFAULT_REMINDERS;
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  await LocalNotifications.schedule({
    notifications: reminders.map((r, i) => ({
      title: r.title || 'DigiWell',
      body: r.body || 'Nhắc nhở uống nước!',
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
