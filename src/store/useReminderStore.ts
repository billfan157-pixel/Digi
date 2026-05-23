import { create } from 'zustand';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { AppStorage } from '@/lib/storage';
import {
  DEFAULT_HYDRATION_REMINDER_SETTINGS,
  checkHydrationReminderPermission,
  getHydrationReminderPreview,
  requestHydrationReminderPermission,
  scheduleHydrationReminders,
  supportsNativeHydrationReminders,
  validateHydrationReminderSettings,
  type HydrationReminderSettings,
} from '../lib/hydrationReminders';

// Re-export the type so other modules can import it from this store
export type { HydrationReminderSettings };

interface ReminderState {
  reminderSettings: HydrationReminderSettings;
  isReminderPermissionGranted: boolean;
  isApplyingReminderSettings: boolean;
  
  setReminderSettings: (settings: HydrationReminderSettings) => void;
  setIsReminderPermissionGranted: (granted: boolean) => void;
  setIsApplyingReminderSettings: (applying: boolean) => void;
  
  updateReminderSetting: <K extends keyof HydrationReminderSettings>(
    key: K,
    value: HydrationReminderSettings[K],
  ) => void;
  handleApplyReminderSettings: (profileId: string | undefined, waterGoal: number, nickname: string | undefined) => Promise<void>;
  loadReminderSettings: (profileId: string | undefined) => void;
  saveReminderSettingsToLocal: (profileId: string | undefined, settings: HydrationReminderSettings) => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminderSettings: { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
  isReminderPermissionGranted: false,
  isApplyingReminderSettings: false,

  setReminderSettings: (settings) => set({ reminderSettings: settings }),
  setIsReminderPermissionGranted: (granted) => set({ isReminderPermissionGranted: granted }),
  setIsApplyingReminderSettings: (applying) => set({ isApplyingReminderSettings: applying }),

  updateReminderSetting: (key, value) => {
    set((state) => ({
      reminderSettings: { ...state.reminderSettings, [key]: value },
    }));
  },

  loadReminderSettings: (profileId) => {
    if (profileId) {
      let savedReminderSettings = null;
      try {
        savedReminderSettings = JSON.parse(AppStorage.getItem(`digiwell_reminders_${profileId}`) || 'null');
      } catch {
        savedReminderSettings = null;
      }
      set({
        reminderSettings: savedReminderSettings
          ? { ...DEFAULT_HYDRATION_REMINDER_SETTINGS, ...savedReminderSettings }
          : { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
      });
    } else {
      set({
        reminderSettings: { ...DEFAULT_HYDRATION_REMINDER_SETTINGS },
        isReminderPermissionGranted: false,
      });
    }
  },

  saveReminderSettingsToLocal: (profileId, settings) => {
    if (profileId) {
      AppStorage.setItem(`digiwell_reminders_${profileId}`, JSON.stringify(settings));
    }
  },

  handleApplyReminderSettings: async (profileId, waterGoal, nickname) => {
    const { reminderSettings } = get();
    const validationError = validateHydrationReminderSettings(reminderSettings);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    set({ isApplyingReminderSettings: true });

    try {
      if (!supportsNativeHydrationReminders()) {
        toast.success(i18n.t('schedule.saved_schedule'));
        return;
      }

      let granted = await checkHydrationReminderPermission();
      if (!granted && reminderSettings.enabled) granted = await requestHydrationReminderPermission();
      set({ isReminderPermissionGranted: granted });
      if (reminderSettings.enabled && !granted) throw new Error('Bạn cần cấp quyền thông báo để DigiWell nhắc uống nước.');

      const result = await scheduleHydrationReminders(reminderSettings, { dailyGoal: waterGoal, nickname: nickname });
      toast.success(result.scheduled ? i18n.t('schedule.schedule_updated', { count: result.count }) : i18n.t('schedule.schedule_disabled'));
      get().saveReminderSettingsToLocal(profileId, reminderSettings); // Save after successful application
    } catch (err: unknown) {
      toast.error((err as Error).message || i18n.t('schedule.schedule_update_failed'));
    } finally {
      set({ isApplyingReminderSettings: false });
    }
  },
}));

// Helper to get preview outside of component
export const getReminderPreview = (settings: HydrationReminderSettings) => getHydrationReminderPreview(settings);
