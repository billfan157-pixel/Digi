import { useCallback } from 'react';
import { toast } from 'sonner';
import { levelFromExp } from '@/config/questConfig';
import { appQueryKeys } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import {
  fetchProfileById,
  updateProfileFields,
} from '@/services/profile.service';

interface UseProfileSyncOptions {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  isEnabled: boolean;
}

export function useProfileSync({ profile, setProfile, isEnabled }: UseProfileSyncOptions) {
  const refetchProfile = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined' || !isEnabled) return;

    try {
      const nextProfile = await queryClient.fetchQuery({
        queryKey: appQueryKeys.profile(profile.id),
        queryFn: () => fetchProfileById(profile.id),
      });
      setProfile(nextProfile);
    } catch (error) {
      console.error('Error refetching profile:', error);
      const cachedProfile = queryClient.getQueryData<any>(appQueryKeys.profile(profile.id));
      if (!cachedProfile) return;

      setProfile({
        ...cachedProfile,
        level: levelFromExp(cachedProfile.total_exp || 0),
      });
    }
  }, [isEnabled, profile, setProfile]);

  const syncProfileData = useCallback(async () => {
    const toastId = toast.loading('Đang đồng bộ dữ liệu...');
    await refetchProfile();
    toast.success('Đồng bộ thành công!', { id: toastId });
  }, [refetchProfile]);

  const handleWaterSync = useCallback(async (optimisticAmount?: number, optimisticExp?: number) => {
    if (optimisticAmount === undefined || optimisticExp === undefined) {
      await refetchProfile();
      return;
    }

    if (!profile?.id || profile.id === 'undefined') return;

    const newTotalExp = (profile.total_exp || 0) + optimisticExp;
    const newLevel = levelFromExp(newTotalExp);
    const newWaterToday = (profile.water_today || 0) + optimisticAmount;
    const newTotalWater = (profile.total_water || 0) + optimisticAmount;
    const optimisticCoins = Math.floor(optimisticExp * 0.5);

    const updatedProfileForDb = {
      ...profile,
      total_exp: newTotalExp,
      level: newLevel,
      coins: (profile.coins || 0) + optimisticCoins,
      water_today: newWaterToday,
      total_water: newTotalWater,
    };

    setProfile(updatedProfileForDb);
    queryClient.setQueryData(appQueryKeys.profile(updatedProfileForDb.id), updatedProfileForDb);

    try {
      await updateProfileFields(updatedProfileForDb.id, {
        water_today: updatedProfileForDb.water_today,
        total_water: updatedProfileForDb.total_water,
        total_exp: updatedProfileForDb.total_exp,
        level: updatedProfileForDb.level,
        coins: updatedProfileForDb.coins,
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Cập nhật profile thất bại. Đang hoàn tác...');
      await refetchProfile();
      return;
    }

    await refetchProfile();
  }, [profile, refetchProfile, setProfile]);

  const handleSpendCoins = useCallback(async (amount: number) => {
    if (amount <= 0) return true;
    if (!profile?.id || profile.id === 'undefined') return false;

    toast.error('Giao dịch xu đang bị khóa cho tới khi mutation phía server được xác nhận đầy đủ.');
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
