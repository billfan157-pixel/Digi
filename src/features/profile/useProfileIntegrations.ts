import { useCallback, useMemo, useState } from 'react';
import { Activity, Calendar, CloudSun, Watch } from 'lucide-react';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { normalizeActivity, normalizeClimate } from '@/lib/profileNormalization';
import { updateProfileFields, type AppProfile } from '@/services/profile.service';
import { profileSchema, formatZodErrors } from '@/lib/validations';

interface EditProfileData {
  nickname: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  climate: string;
  goal: string;
}

interface UseProfileIntegrationsOptions {
  profile: AppProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<AppProfile | null>>;
  setShowEditProfile: (value: boolean) => void;
  isWeatherSynced: boolean;
  syncWeather: (options?: { force?: boolean; silent?: boolean }) => Promise<boolean>;
  isCalendarSynced: boolean;
  syncCalendar: () => unknown;
  isWatchConnected: boolean;
  toggleHealthConnection: () => unknown;
}

export function useProfileIntegrations({
  profile,
  setProfile,
  setShowEditProfile,
  isWeatherSynced,
  syncWeather,
  isCalendarSynced,
  syncCalendar,
  isWatchConnected,
  toggleHealthConnection,
}: UseProfileIntegrationsOptions) {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<EditProfileData>({
    nickname: '',
    gender: i18n.t('common.default_gender_male'),
    age: 20,
    height: 172,
    weight: 82,
    activity: 'high',
    climate: 'tropical',
    goal: i18n.t('common.default_goal_fat_muscle'),
  });

  const openEditProfile = useCallback(() => {
    if (!profile) return;

    setEditProfileData({
      nickname: profile.nickname || '',
      gender: profile.gender || i18n.t('common.default_gender_male'),
      age: profile.age || 20,
      height: profile.height || 170,
      weight: profile.weight || 60,
      activity: profile.activity || 'sedentary',
      climate: profile.climate || 'temperate',
      goal: profile.goal || i18n.t('common.default_goal_health'),
    });
    setShowEditProfile(true);
  }, [profile, setShowEditProfile]);

  const handleSaveProfile = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.id || profile.id === 'undefined') return;

    const parsed = profileSchema.safeParse(editProfileData);
    if (!parsed.success) {
      toast.error(formatZodErrors(parsed.error));
      return;
    }

    setIsUpdatingProfile(true);
    const toastId = toast.loading(i18n.t('settings.updating_profile'));

    try {
      const normalizedProfileData = {
        ...editProfileData,
        activity: normalizeActivity(editProfileData.activity),
        climate: normalizeClimate(editProfileData.climate),
      };

      const updatedProfile = await updateProfileFields(profile.id as string, {
        nickname: normalizedProfileData.nickname,
        gender: normalizedProfileData.gender,
        age: normalizedProfileData.age,
        height: normalizedProfileData.height,
        weight: normalizedProfileData.weight,
        activity: normalizedProfileData.activity,
        climate: normalizedProfileData.climate,
        goal: normalizedProfileData.goal,
        updated_at: new Date().toISOString(),
      });

      setEditProfileData(normalizedProfileData);
      setProfile(updatedProfile);
      toast.success(i18n.t('settings.profile_updated_plain'), { id: toastId });
      setShowEditProfile(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : i18n.t('settings.profile_update_error'), { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [editProfileData, profile?.id, setProfile, setShowEditProfile]);

  const handleConnectStrava = useCallback(async () => {
    toast.info(i18n.t('settings.integration_strava_unavailable'));
  }, []);

  const connectedSystems = useMemo(() => [
    {
      icon: CloudSun,
      label: i18n.t('common.weather_station_label'),
      sub: i18n.t('common.weather_station_sub'),
      active: isWeatherSynced,
      action: () => syncWeather({ force: true }),
      activeColor: '#f97316',
      activeBg: 'rgba(249,115,22,0.2)',
      activeBorder: 'rgba(249,115,22,0.4)',
    },
    {
      icon: Calendar,
      label: i18n.t('common.smart_schedule_label'),
      sub: i18n.t('common.smart_schedule_sub'),
      active: isCalendarSynced,
      action: syncCalendar,
      activeColor: '#818cf8',
      activeBg: 'rgba(99,102,241,0.2)',
      activeBorder: 'rgba(99,102,241,0.4)',
    },
    {
      icon: Watch,
      label: i18n.t('common.health_kit_label'),
      sub: i18n.t('common.health_kit_sub'),
      active: isWatchConnected,
      action: toggleHealthConnection,
      activeColor: '#22d3ee',
      activeBg: 'rgba(6,182,212,0.2)',
      activeBorder: 'rgba(6,182,212,0.4)',
    },
    {
      icon: Activity,
      label: i18n.t('common.strava_label'),
      sub: i18n.t('common.strava_sub'),
      active: false,
      action: handleConnectStrava,
      activeColor: '#fc5200',
      activeBg: 'rgba(252,82,0,0.2)',
      activeBorder: 'rgba(252,82,0,0.4)',
    },
  ], [
    handleConnectStrava,
    isCalendarSynced,
    isWatchConnected,
    isWeatherSynced,
    syncCalendar,
    syncWeather,
    toggleHealthConnection,
  ]);

  const activityLabel = useMemo(() => {
    const activityLabelMap: Record<string, string> = {
      sedentary: i18n.t('common.activity_sedentary'),
      light: i18n.t('common.activity_light'),
      moderate: i18n.t('common.activity_moderate'),
      active: i18n.t('common.activity_active'),
      hard: i18n.t('common.activity_hard'),
      athlete: i18n.t('common.activity_athlete'),
    };

    return activityLabelMap[String(profile?.activity || '')] || String(profile?.activity || '--');
  }, [profile?.activity]);

  return {
    editProfileData,
    setEditProfileData,
    isUpdatingProfile,
    openEditProfile,
    handleSaveProfile,
    connectedSystems,
    connectedSystemsCount: connectedSystems.filter(system => system.active).length,
    activityLabel,
  };
}
