import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { HealthReport } from '@/lib/aiReports';
import { generateWeeklyReport, getLatestHealthReport } from '@/lib/aiReports';
import { provisionUserQuests, runChallengeEngine, runQuestEngine } from '@/lib/questEngine';
import { playSuccessSound } from '@/lib/audio';
import confetti from 'canvas-confetti';

import { AppStorage } from '@/lib/storage';
import type { AppProfile } from '@/services/profile.service';
import type { WaterLog } from '@/models';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface UsePremiumGamificationOptions {
  profile: AppProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<AppProfile | null>>;
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  waterEntries: WaterLog[];
  weeklyHistory: { d: string; ml: number; isToday: boolean }[];
  weeklyLogCount: number;
  watchData: { heartRate?: number; steps?: number } | null | undefined;
  setShowPremiumModal: (value: boolean) => void;
}

export function usePremiumGamification({
  profile,
  isPremium,
  setIsPremium,
  waterIntake,
  waterGoal,
  streak,
  waterEntries,
  weeklyHistory,
  weeklyLogCount,
  watchData,
  setShowPremiumModal,
}: UsePremiumGamificationOptions) {
  const previousLevelRef = useRef<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState({ from: 0, to: 0 });
  const [weeklyReport, setWeeklyReport] = useState<HealthReport | null>(null);
  const [isWeeklyReportLoading, setIsWeeklyReportLoading] = useState(false);

  const syncPremiumStatus = useCallback(async (options?: { poll?: boolean }) => {
    if (!profile?.id || profile.id === 'undefined') {
      setIsPremium(false);
      return false;
    }

    const attempts = options?.poll ? 5 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_end')
        .eq('id', profile.id)
        .single();

      if (!error && data) {
        const endDate = data.subscription_end ? new Date(data.subscription_end) : null;
        const premiumActive = data.subscription_tier === 'premium' && (!endDate || endDate > new Date());

        setIsPremium(premiumActive);

        if (premiumActive || !options?.poll) {
          return premiumActive;
        }
      }

      if (attempt < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsPremium(false);
    return false;
  }, [profile?.id, setIsPremium]);

  useEffect(() => {
    void syncPremiumStatus();
  }, [syncPremiumStatus]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || !isPremium) {
      setWeeklyReport(null);
      return;
    }

    let ignore = false;

    const loadLatestWeeklyReport = async () => {
      setIsWeeklyReportLoading(true);

      try {
        const latestReport = await getLatestHealthReport(profile.id as string, 'weekly');
        if (!ignore) {
          setWeeklyReport(latestReport);
        }
      } finally {
        if (!ignore) {
          setIsWeeklyReportLoading(false);
        }
      }
    };

    void loadLatestWeeklyReport();

    return () => {
      ignore = true;
    };
  }, [profile?.id, isPremium]);

  useEffect(() => {
    const profileLevel = Number(profile?.level) || 0;
    if (!profileLevel || previousLevelRef.current === null || profileLevel <= previousLevelRef.current) {
      previousLevelRef.current = profileLevel || null;
      return;
    }

    const newLevel = profileLevel;
    const isMilestone10 = newLevel % 10 === 0;

    setLevelUpInfo({ from: previousLevelRef.current, to: newLevel });
    setShowLevelUp(true);
    confetti({ particleCount: isMilestone10 ? 400 : 200, spread: 120, origin: { y: 0.6 }, zIndex: 9999 });
    playSuccessSound();

    setTimeout(() => {
      toast.success(`Lên cấp ${newLevel}! Thành tích đã được ghi nhận.`, { icon: '⭐', duration: 5000 });
    }, 500);

    previousLevelRef.current = profileLevel;
  }, [profile]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || waterIntake < waterGoal || waterGoal === 0) return;

    const storageKey = `awarded_100pct_badge_${profile.id}`;
    if (AppStorage.getItem(storageKey)) return;

    const awardFirst100PercentBadge = async () => {
      try {
        const { data: badgeData, error: badgeError } = await supabase.from('badges').select('id').eq('name', 'Giọt Nước Nhỏ').maybeSingle();
        if (badgeError || !badgeData) return;

        const { data: userBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', profile.id)
          .eq('badge_id', badgeData.id)
          .maybeSingle();

        if (!userBadge) {
          const { error } = await supabase.from('user_badges').insert({
            user_id: profile.id,
            badge_id: badgeData.id,
          });

          if (!error) {
            toast.success('🎉 Bạn đã nhận được Huy hiệu: Giọt Nước Nhỏ!');
            AppStorage.setItem(storageKey, 'true');
          }
          return;
        }

        AppStorage.setItem(storageKey, 'true');
      } catch (error) {
        console.error('Lỗi khi kiểm tra và trao huy hiệu:', error);
      }
    };

    void awardFirst100PercentBadge();
  }, [profile?.id, waterGoal, waterIntake]);

  useEffect(() => {
    if (!profile?.id || profile.id === 'undefined' || !UUID_RE.test(String(profile.id))) return;

    const assignQuestsIfNeeded = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const profileId = profile.id as string;
      const lastCheckKey = `daily_quest_check_v3_${profileId}`;
      const lastCheckDate = AppStorage.getItem(lastCheckKey);

      if (lastCheckDate === todayStr) return;

      try {
        const { error } = await supabase.rpc('assign_daily_quests', { p_user_id: profileId });
        if (error) throw error;
        await provisionUserQuests(profileId, Number(profile.level) || 1);
        AppStorage.setItem(lastCheckKey, todayStr);
      } catch (error) {
        console.error('Lỗi khi gán nhiệm vụ hàng ngày:', error);
      }
    };

    void assignQuestsIfNeeded();
  }, [profile?.id, profile?.level]);

  useEffect(() => {
    if (!profile?.id || waterGoal === 0 || waterIntake < waterGoal) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const soundKey = `digiwell_100pct_sound_${profile.id}_${todayStr}`;

    if (AppStorage.getItem(soundKey)) return;

    playSuccessSound();
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      zIndex: 9999,
      colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7'],
    });

    AppStorage.setItem(soundKey, 'true');
  }, [profile?.id, waterGoal, waterIntake]);

  useEffect(() => {
    const questCtx = {
      userId: profile?.id as string,
      waterToday: waterIntake,
      waterGoal,
      streak,
      totalWater: Number(profile?.total_water) || 0,
      logCountToday: waterEntries.length,
      weeklyDays: weeklyHistory.filter(item => item.ml >= waterGoal).length,
      weeklyWater: weeklyHistory.reduce((sum, item) => sum + item.ml, 0),
      weeklyLogCount,
      equippedSound: String(profile?.equipped_notification_sound || ''),
      level: Number(profile?.level) || 1,
    };

    if (!questCtx.userId || !profile?.onboarding_completed) return;

    runQuestEngine(questCtx);
    runChallengeEngine(questCtx);
  }, [
    profile?.equipped_notification_sound,
    profile?.id,
    profile?.level,
    profile?.onboarding_completed,
    profile?.total_water,
    streak,
    waterEntries.length,
    waterGoal,
    waterIntake,
    weeklyHistory,
    weeklyLogCount,
  ]);

  const handleGenerateWeeklyReport = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined') return;

    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsWeeklyReportLoading(true);
    const toastId = toast.loading('AI đang tạo báo cáo tuần...');

    try {
      const report = await generateWeeklyReport(profile.id as string, {
        nickname: profile.nickname || '',
        goal: profile.goal || '',
        activity: profile.activity || '',
        avgHeartRate: Number(watchData?.heartRate) || 0,
      });

      setWeeklyReport(report);
      toast.success('Đã tạo báo cáo tuần thành công.', { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể tạo báo cáo tuần lúc này.';
      toast.error(message, { id: toastId });
    } finally {
      setIsWeeklyReportLoading(false);
    }
  }, [isPremium, profile, setShowPremiumModal, watchData?.heartRate]);

  return {
    showLevelUp,
    setShowLevelUp,
    levelUpInfo,
    weeklyReport,
    isWeeklyReportLoading,
    handleGenerateWeeklyReport,
    syncPremiumStatus,
  };
}
