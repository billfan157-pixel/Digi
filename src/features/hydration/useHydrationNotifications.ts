import { useCallback, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import {
  LocalNotifications,
  type ActionPerformed,
} from '@capacitor/local-notifications';
import { toast } from 'sonner';
import {
  clearHydrationReminders,
  parseHydrationNotificationAction,
  registerHydrationReminderActions,
  scheduleHydrationReminders,
  scheduleHydrationSnooze,
  supportsNativeHydrationReminders,
} from '@/lib/hydrationReminders';
import { claimChallengeReward, claimQuestReward } from '@/lib/questEngine';

import { AppStorage } from '@/lib/storage';

type PendingHydrationAction = {
  userId: string;
  amount: number;
  name: string;
  timestamp: number;
};

const PENDING_HYDRATION_ACTIONS_KEY = 'digiwell_pending_hydration_actions';
const LAST_ACTIVE_HYDRATION_USER_ID_KEY = 'digiwell_last_active_hydration_user_id';

function readPendingHydrationActions(): PendingHydrationAction[] {
  try {
    const parsed = JSON.parse(AppStorage.getItem(PENDING_HYDRATION_ACTIONS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((action): action is PendingHydrationAction => (
      action &&
      typeof action === 'object' &&
      typeof action.userId === 'string' &&
      action.userId.trim().length > 0 &&
      typeof action.amount === 'number' &&
      Number.isFinite(action.amount) &&
      typeof action.name === 'string' &&
      typeof action.timestamp === 'number'
    ));
  } catch {
    return [];
  }
}

function readLastActiveHydrationUserId() {
  const raw = AppStorage.getItem(LAST_ACTIVE_HYDRATION_USER_ID_KEY)?.trim();
  return raw ? raw : null;
}

function writeLastActiveHydrationUserId(userId: string | undefined) {
  if (!userId || userId === 'undefined') return;
  AppStorage.setItem(LAST_ACTIVE_HYDRATION_USER_ID_KEY, userId);
}

function queuePendingHydrationAction(action: Omit<PendingHydrationAction, 'userId'>, userId: string | null) {
  if (!userId) {
    console.warn('Bo qua pending hydration action vi khong xac dinh duoc userId.');
    return;
  }

  const pending = readPendingHydrationActions();
  pending.push({ ...action, userId });
  AppStorage.setItem(PENDING_HYDRATION_ACTIONS_KEY, JSON.stringify(pending.slice(-10)));
}

function writePendingHydrationActions(actions: PendingHydrationAction[]) {
  if (actions.length === 0) {
    AppStorage.removeItem(PENDING_HYDRATION_ACTIONS_KEY);
    return;
  }

  AppStorage.setItem(PENDING_HYDRATION_ACTIONS_KEY, JSON.stringify(actions));
}

interface UseHydrationNotificationsOptions {
  profile: any;
  view: string;
  waterGoal: number;
  handleAddWater: (amount: number, factor: number, name: string) => Promise<any>;
  refetchProfile: () => Promise<void>;
}

export function useHydrationNotifications({
  profile,
  view,
  waterGoal,
  handleAddWater,
  refetchProfile,
}: UseHydrationNotificationsOptions) {
  const resolvedUserId = profile?.id && profile.id !== 'undefined'
    ? profile.id
    : readLastActiveHydrationUserId();

  // ── App foreground/background management ──
  // Cancel pending native reminders when app is active (in-app UI already handles them)
  // Re-schedule when app goes to background so user still gets notification natively
  const reminderSettingsRef = useRef<{ enabled: boolean; intervalMinutes: number; startTime: string; endTime: string }>({
    enabled: false, intervalMinutes: 120, startTime: '08:00', endTime: '22:00',
  });
  const waterGoalRef = useRef(waterGoal);
  waterGoalRef.current = waterGoal;
  const nicknameRef = useRef(profile?.nickname);
  nicknameRef.current = profile?.nickname;

  // Load current reminder settings from store (non-reactive ref)
  useEffect(() => {
    import('@/store/useReminderStore').then(({ useReminderStore }) => {
      const settings = useReminderStore.getState().reminderSettings;
      if (settings) reminderSettingsRef.current = settings;
    });
  }, []);

  useEffect(() => {
    if (!supportsNativeHydrationReminders()) return;

    let appStateListener: { remove: () => Promise<void> } | null = null;

    const setup = async () => {
      appStateListener = await App.addListener('appStateChange', async ({ isActive }) => {
        const settings = reminderSettingsRef.current;
        const goal = waterGoalRef.current;
        const nickname = nicknameRef.current;

        if (isActive) {
          // App in foreground → cancel all pending native reminders
          // In-app UI (HomeTab, notification toast, etc.) handles reminders
          await clearHydrationReminders();
        } else {
          // App went to background → re-schedule reminders from next slot
          if (settings.enabled) {
            try {
              await scheduleHydrationReminders(settings, { dailyGoal: goal, nickname });
            } catch (e) {
              console.warn('Failed to reschedule reminders on background:', e);
            }
          }
        }
      });
    };

    setup();

    return () => {
      if (appStateListener) {
        void appStateListener.remove();
      }
    };
  }, []);
  // ── End app foreground/background management ──

  const handleHydrationNotificationAction = useCallback(async (notificationAction: ActionPerformed) => {
    const extra = notificationAction.notification.extra;
    const actionId = notificationAction.actionId;
    const queuedUserId = typeof extra?.userId === 'string' && extra.userId.trim()
      ? extra.userId
      : resolvedUserId;

    if (actionId === 'claim_quest' && extra?.type === 'quest' && extra?.id) {
      if (!profile?.id || profile.id === 'undefined') return;
      await claimQuestReward(profile.id, extra.id);
      await refetchProfile();
      toast.success('🎁 Đã nhận thưởng nhiệm vụ thành công!');
      return;
    }

    if (actionId === 'claim_challenge' && extra?.type === 'challenge' && extra?.id) {
      if (!profile?.id || profile.id === 'undefined') return;
      await claimChallengeReward(profile.id, extra.id);
      await refetchProfile();
      toast.success('🎁 Đã nhận thưởng thử thách thành công!');
      return;
    }

    if (['add_100', 'add_250', 'snooze_10'].includes(actionId)) {
      if (actionId === 'snooze_10') {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now() % 100000,
            title: '💧 DigiWell - Nhắc nhở lại!',
            body: notificationAction.notification.body || 'Bạn vẫn chưa uống nước đấy nhé!',
            schedule: { at: new Date(Date.now() + 10 * 60 * 1000), allowWhileIdle: true },
            sound: notificationAction.notification.sound,
            actionTypeId: 'SCHEDULE_REMINDER_ACTIONS',
            extra,
          }],
        });
        toast.info('Đã lùi lịch nhắc nước lại 10 phút.');
        return;
      }

      const amountToAdd = actionId === 'add_100' ? 100 : 250;
      if (!profile?.id || profile.id === 'undefined') {
        queuePendingHydrationAction(
          { amount: amountToAdd, name: extra?.name || 'Nước lọc', timestamp: Date.now() },
          queuedUserId,
        );
        return;
      }

      await handleAddWater(amountToAdd, 1, extra?.name || 'Nước lọc');
      return;
    }

    if (actionId === 'tap' && extra && extra.amount) {
      if (!profile?.id || profile.id === 'undefined') {
        queuePendingHydrationAction(
          { amount: extra.amount, name: extra.name || 'Nước lọc', timestamp: Date.now() },
          queuedUserId,
        );
        return;
      }

      await handleAddWater(extra.amount, 1, extra.name || 'Nước lọc');
      return;
    }

    const intent = parseHydrationNotificationAction(notificationAction);
    if (!intent) return;

    if (intent.kind === 'snooze') {
      await scheduleHydrationSnooze({
        minutes: intent.minutes,
        dailyGoal: waterGoal,
        nickname: profile?.nickname,
      });
      toast.info(`Đã nhắc lại sau ${intent.minutes} phút.`);
      return;
    }

    if (!profile?.id || profile.id === 'undefined') {
      queuePendingHydrationAction({
        amount: intent.amount,
        name: intent.name,
        timestamp: Date.now(),
      }, queuedUserId);
      return;
    }

    await handleAddWater(intent.amount, 1, intent.name);
  }, [handleAddWater, profile, refetchProfile, resolvedUserId, waterGoal]);

  useEffect(() => {
    if (!supportsNativeHydrationReminders()) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const setupNotificationActions = async () => {
      await registerHydrationReminderActions().catch(error => {
        console.warn('Không thể đăng ký action cho hydration notifications:', error);
      });

      listenerHandle = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        notificationAction => {
          void handleHydrationNotificationAction(notificationAction);
        },
      );
    };

    void setupNotificationActions();

    return () => {
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, [handleHydrationNotificationAction]);

  useEffect(() => {
    writeLastActiveHydrationUserId(profile?.id);
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || view !== 'app') return;

    const pendingActions = readPendingHydrationActions();
    if (pendingActions.length === 0) return;
    const matchingActions = pendingActions.filter(action => action.userId === profile.id);
    const remainingActions = pendingActions.filter(action => action.userId !== profile.id);
    writePendingHydrationActions(remainingActions);
    if (matchingActions.length === 0) return;

    void (async () => {
      for (const action of matchingActions) {
        await handleAddWater(action.amount, 1, action.name);
      }
      toast.success(`Đã ghi nhận ${matchingActions.length} lần uống nước từ notification.`);
    })();
  }, [handleAddWater, profile, view]);
}
