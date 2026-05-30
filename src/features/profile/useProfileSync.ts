import { useCallback } from 'react';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { levelFromExp } from '@/config/questConfig';
import { appQueryKeys } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import { fetchProfileById } from '@/services/profile.service';
import type { AppProfile } from '@/services/profile.service';

interface UseProfileSyncOptions {
  profile: AppProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<AppProfile | null>>;
  isEnabled: boolean;
}

export function useProfileSync({ profile, setProfile, isEnabled }: UseProfileSyncOptions) {
  const refetchProfile = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined' || !isEnabled) return;

    const profileId = profile.id as string;
    try {
      const nextProfile = await fetchProfileById(profileId);
      if (nextProfile) {
        queryClient.setQueryData(appQueryKeys.profile(profileId), nextProfile);
        setProfile(nextProfile);
      }
    } catch (error) {
      console.error('Error refetching profile:', error);
      const cachedProfile = queryClient.getQueryData<Record<string, unknown>>(appQueryKeys.profile(profileId));
      if (!cachedProfile) return;

      setProfile({
        ...cachedProfile,
        level: levelFromExp(Number(cachedProfile.total_exp) || 0),
      } as AppProfile);
    }
  }, [isEnabled, profile, setProfile]);

  const syncProfileData = useCallback(async () => {
    const toastId = toast.loading(i18n.t('settings.syncing'));
    await refetchProfile();
    toast.success(i18n.t('premium.sync_success'), { id: toastId });
  }, [refetchProfile]);

  const handleWaterSync = useCallback(async (optimisticAmount?: number, optimisticExp?: number) => {
    if (optimisticAmount === undefined) {
      await refetchProfile();
      return;
    }

    if (!profile?.id || profile.id === 'undefined') return;

    // NOTE: EXP, coins, và level đã được backend xử lý trong RPC process_hydration_event.
    // Frontend KHÔNG ghi đè water_today/total_water lên server để tránh stale closure ghi đè.
    // Chỉ cập nhật local UI cache tạm thời, sau đó refetch server truth.
    const newWaterToday = Math.max(0, (profile.water_today || 0) + optimisticAmount);
    const newTotalWater = Math.max(0, (profile.total_water || 0) + optimisticAmount);
    const newTotalExp = Math.max(0, (profile.total_exp || 0) + (optimisticExp || 0));
    const newLevel = levelFromExp(newTotalExp);

    const updatedProfile = {
      ...profile,
      water_today: newWaterToday,
      total_water: newTotalWater,
      total_exp: newTotalExp,
      level: newLevel,
    };

    setProfile(updatedProfile);
    queryClient.setQueryData(appQueryKeys.profile(profile.id as string), updatedProfile);

    // Server là nguồn sự thật duy nhất cho hydration counters
    await refetchProfile();
  }, [profile, refetchProfile, setProfile]);

  const handleSpendCoins = useCallback(async (amount: number) => {
    if (amount <= 0) return true;
    if (!profile?.id || profile.id === 'undefined') return false;

    toast.error(i18n.t('premium.sync_locked'));
    await refetchProfile();
    return false;
  }, [profile, refetchProfile]);

  return {
    refetchProfile,
    syncProfileData,
    handleWaterSync,
    handleSpendCoins,
  };
}
