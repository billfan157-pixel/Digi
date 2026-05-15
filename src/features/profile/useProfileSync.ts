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
  profile: Record<string, unknown> | null;
  setProfile: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  isEnabled: boolean;
}

export function useProfileSync({ profile, setProfile, isEnabled }: UseProfileSyncOptions) {
  const refetchProfile = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined' || !isEnabled) return;

    const profileId = profile.id as string;
    try {
      const nextProfile = await queryClient.fetchQuery({
        queryKey: appQueryKeys.profile(profileId),
        queryFn: () => fetchProfileById(profileId),
      });
      setProfile(nextProfile as unknown as Record<string, unknown> | null);
    } catch (error) {
      console.error('Error refetching profile:', error);
      const cachedProfile = queryClient.getQueryData<Record<string, unknown>>(appQueryKeys.profile(profileId));
      if (!cachedProfile) return;

      setProfile({
        ...cachedProfile,
        level: levelFromExp(Number(cachedProfile.total_exp) || 0),
      });
    }
  }, [isEnabled, profile, setProfile]);

  const syncProfileData = useCallback(async () => {
    const toastId = toast.loading('Đang đồng bộ dữ liệu...');
    await refetchProfile();
    toast.success('Đồng bộ thành công!', { id: toastId });
  }, [refetchProfile]);

  const handleWaterSync = useCallback(async (optimisticAmount?: number) => {
    if (optimisticAmount === undefined) {
      await refetchProfile();
      return;
    }

    if (!profile?.id || profile.id === 'undefined') return;

    const p = profile as Record<string, unknown>;
    // NOTE: EXP, coins, và level đã được backend xử lý trong RPC process_hydration_event.
    // Frontend chỉ sync water_today và total_water để tránh double EXP.
    const newWaterToday = (Number(p.water_today) || 0) + optimisticAmount;
    const newTotalWater = (Number(p.total_water) || 0) + optimisticAmount;

    const updatedProfile = {
      ...profile,
      water_today: newWaterToday,
      total_water: newTotalWater,
    };

    setProfile(updatedProfile);
    queryClient.setQueryData(appQueryKeys.profile(profile.id as string), updatedProfile);

    try {
      await updateProfileFields(profile.id as string, {
        water_today: updatedProfile.water_today,
        total_water: updatedProfile.total_water,
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
