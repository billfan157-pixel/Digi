import { useCallback, useMemo, useState } from 'react';
import { Activity, Calendar, CloudSun, Watch } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeActivity, normalizeClimate } from '@/lib/profileNormalization';
import { updateProfileFields } from '@/services/profile.service';

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
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  setShowEditProfile: (value: boolean) => void;
  isWeatherSynced: boolean;
  syncWeather: (arg?: any, options?: any) => any;
  isCalendarSynced: boolean;
  syncCalendar: () => any;
  isWatchConnected: boolean;
  toggleHealthConnection: () => any;
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
    gender: 'Nam',
    age: 20,
    height: 172,
    weight: 82,
    activity: 'high',
    climate: 'tropical',
    goal: 'Giảm mỡ & Tăng cơ',
  });

  const openEditProfile = useCallback(() => {
    if (!profile) return;

    setEditProfileData({
      nickname: profile.nickname || '',
      gender: profile.gender || 'Nam',
      age: profile.age || 20,
      height: profile.height || 170,
      weight: profile.weight || 60,
      activity: profile.activity || 'sedentary',
      climate: profile.climate || 'temperate',
      goal: profile.goal || 'Sức khỏe tổng quát',
    });
    setShowEditProfile(true);
  }, [profile, setShowEditProfile]);

  const handleSaveProfile = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.id || profile.id === 'undefined') return;

    setIsUpdatingProfile(true);
    const toastId = toast.loading('Đang cập nhật hồ sơ...');

    try {
      const normalizedProfileData = {
        ...editProfileData,
        activity: normalizeActivity(editProfileData.activity),
        climate: normalizeClimate(editProfileData.climate),
      };

      const updatedProfile = await updateProfileFields(profile.id, {
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
      toast.success('Cập nhật hồ sơ thành công! ✅', { id: toastId });
      setShowEditProfile(false);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi cập nhật hồ sơ!', { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [editProfileData, profile?.id, setProfile, setShowEditProfile]);

  const handleConnectStrava = useCallback(async () => {
    toast.info('Strava / Garmin chưa được phát hành trong build public này. Flow manual token đã bị tắt để tránh gây hiểu nhầm.');
  }, []);

  const connectedSystems = useMemo(() => [
    {
      icon: CloudSun,
      label: 'Trạm thời tiết',
      sub: 'Đồng bộ theo vị trí hiện tại',
      active: isWeatherSynced,
      action: () => syncWeather(undefined, { useCurrentLocation: true }),
      activeColor: '#f97316',
      activeBg: 'rgba(249,115,22,0.2)',
      activeBorder: 'rgba(249,115,22,0.4)',
    },
    {
      icon: Calendar,
      label: 'Lịch trình thông minh',
      sub: 'Nhắc nhở theo agenda và giờ học',
      active: isCalendarSynced,
      action: syncCalendar,
      activeColor: '#818cf8',
      activeBg: 'rgba(99,102,241,0.2)',
      activeBorder: 'rgba(99,102,241,0.4)',
    },
    {
      icon: Watch,
      label: 'Watch / HealthKit',
      sub: 'Dữ liệu sức khỏe từ thiết bị đã hỗ trợ',
      active: isWatchConnected,
      action: toggleHealthConnection,
      activeColor: '#22d3ee',
      activeBg: 'rgba(6,182,212,0.2)',
      activeBorder: 'rgba(6,182,212,0.4)',
    },
    {
      icon: Activity,
      label: 'Strava / Garmin',
      sub: 'Chưa khả dụng trong build public',
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
      sedentary: 'Ít vận động',
      light: 'Vận động nhẹ',
      moderate: 'Vận động vừa',
      active: 'Năng động',
      hard: 'Cường độ cao',
      athlete: 'Vận động viên',
    };

    return activityLabelMap[profile?.activity || ''] || profile?.activity || '--';
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
