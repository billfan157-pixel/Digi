import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { normalizeActivity, normalizeClimate } from '../lib/profileNormalization';
import { updateProfileFields } from '@/services/profile.service';
import { getBiometricEnabled } from '@/lib/sessionSecurity';

export interface AppSettings {
  displayName: string;
  avatarUrl: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activity: string;
  climate: string;
  waterGoal: number;
  autoWaterGoal: boolean;
  syncHealth: boolean;
  smartReminders: boolean;
  reminderFrequency: '30 phút' | '1 giờ' | '2 giờ';
  quietHoursStart: string;
  quietHoursEnd: string;
  hapticsEnabled: boolean;
  unit: 'ml' | 'oz';
  themeColor: string;
  biometricEnabled: boolean;
  // Wellness fields
  sleepHours: number;           // Target sleep hours
  sleepQuality: number;         // Average quality (1-10)
  moodTracking: boolean;        // Enable mood check-ins
  syncWellnessData: boolean;    // Sync with Apple Health/Google Fit
  energyTracking: boolean;      // Track daily energy levels
}

const DEFAULT_SETTINGS: AppSettings = {
  displayName: '',
  avatarUrl: '',
  weight: 60,
  height: 170,
  age: 20,
  gender: 'Nam',
  activity: 'moderate',
  climate: 'temperate',
  waterGoal: 2000,
  autoWaterGoal: true,
  syncHealth: false,
  smartReminders: true,
  reminderFrequency: '1 giờ',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  hapticsEnabled: true,
  unit: 'ml',
  themeColor: '#06b6d4', // Cyan
  biometricEnabled: false,
  // Wellness defaults
  sleepHours: 8,
  sleepQuality: 7,
  moodTracking: true,
  syncWellnessData: false,
  energyTracking: true,
};

export function useSettings(profile: any) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load initial data
  useEffect(() => {
    if (!profile?.id) return;

    let isCancelled = false;

    const loadSettings = async () => {
      const localKey = `digiwell_settings_${profile.id}`;
      const cached = localStorage.getItem(localKey);
      const biometricEnabled = await getBiometricEnabled(profile.id);

      if (isCancelled) return;

      if (cached) {
        const parsedCache = JSON.parse(cached);
        const normalizedActivity = normalizeActivity(profile.activity || parsedCache.activity || DEFAULT_SETTINGS.activity);
        const normalizedClimate = normalizeClimate(profile.climate || parsedCache.climate || DEFAULT_SETTINGS.climate);
        const normalizedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsedCache,
          displayName: profile.nickname || profile.name || '',
          avatarUrl: profile.avatar_url || parsedCache.avatarUrl || '',
          weight: profile.weight || 60,
          height: profile.height || 170,
          age: profile.age || 20,
          gender: profile.gender || 'Nam',
          activity: normalizedActivity,
          climate: normalizedClimate,
          waterGoal: profile.water_goal || parsedCache.waterGoal || 2000,
          biometricEnabled,
        };

        if (parsedCache.activity !== normalizedActivity || parsedCache.climate !== normalizedClimate) {
          localStorage.setItem(localKey, JSON.stringify(normalizedSettings));
        }

        setSettings({ ...normalizedSettings });
        return;
      }

       setSettings(prev => ({
         ...prev,
         displayName: profile.nickname || profile.name || '',
         avatarUrl: profile.avatar_url || '',
         weight: profile.weight || 60,
         height: profile.height || 170,
         age: profile.age || 20,
         gender: profile.gender || 'Nam',
         activity: normalizeActivity(profile.activity || DEFAULT_SETTINGS.activity),
         climate: normalizeClimate(profile.climate || DEFAULT_SETTINGS.climate),
         biometricEnabled,
         waterGoal: profile.water_goal || 2000,
         // Wellness fields (with defaults if missing)
         sleepHours: (profile as any)?.sleep_hours || DEFAULT_SETTINGS.sleepHours,
         sleepQuality: (profile as any)?.sleep_quality || DEFAULT_SETTINGS.sleepQuality,
         moodTracking: (profile as any)?.mood_tracking ?? DEFAULT_SETTINGS.moodTracking,
         syncWellnessData: (profile as any)?.sync_wellness_data || DEFAULT_SETTINGS.syncWellnessData,
         energyTracking: (profile as any)?.energy_tracking ?? DEFAULT_SETTINGS.energyTracking,
       }));
    };

    void loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [profile]);

  // Provide haptic feedback utility (Chỉ dùng cho UI gọi)
  const triggerHaptic = useCallback(() => {
    if (settings.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [settings.hapticsEnabled]);

  // Save to LocalStorage & Supabase
  const updateSettings = useCallback(async (
    newValues: Partial<AppSettings>,
    options?: { syncProfile?: boolean },
  ) => {
    if (!profile?.id || profile.id === 'undefined') return;
    
    setIsSaving(true);
    
    const updatedSettings = {
      ...settings,
      ...newValues,
      activity: normalizeActivity(newValues.activity ?? settings.activity),
      climate: normalizeClimate(newValues.climate ?? settings.climate),
    };
    setSettings(updatedSettings);
    
    // 1. Save to LocalStorage (Instant UI feedback)
    localStorage.setItem(`digiwell_settings_${profile.id}`, JSON.stringify(updatedSettings));

    // Apply Theme Color instantly
    if (newValues.themeColor) {
      document.documentElement.style.setProperty('--color-primary', newValues.themeColor);
    }

       // 2. Sync to Supabase in background
       try {
         // Đẩy đầy đủ các field quan trọng lên database
         if (options?.syncProfile !== false) {
           await updateProfileFields(profile.id, {
             avatar_url: updatedSettings.avatarUrl,
             nickname: updatedSettings.displayName,
             weight: updatedSettings.weight,
             height: updatedSettings.height,
             age: updatedSettings.age,
             gender: updatedSettings.gender,
             activity: updatedSettings.activity,
             climate: updatedSettings.climate,
             water_goal: updatedSettings.waterGoal,
             // Wellness fields
             sleep_hours: updatedSettings.sleepHours,
             sleep_quality: updatedSettings.sleepQuality,
             mood_tracking: updatedSettings.moodTracking,
             sync_wellness_data: updatedSettings.syncWellnessData,
             energy_tracking: updatedSettings.energyTracking,
             updated_at: new Date().toISOString()
           });
         }
      setLastSync(new Date());
    } catch (error) {
      console.error('Lỗi đồng bộ Settings:', error);
      toast.message('Đã lưu cục bộ — sẽ đồng bộ khi có mạng', {
        description: 'Dữ liệu của bạn được an toàn.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, profile?.id]);

  return { settings, updateSettings, isSaving, lastSync, triggerHaptic };
}
