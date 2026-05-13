import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useStreak(userId: string | undefined, waterGoal: number, todayIntake: number, isPremium: boolean = false) {
  const [pastStreak, setPastStreak] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [lastFreezeReset, setLastFreezeReset] = useState<string>('');
  const [freezeCandidateDay, setFreezeCandidateDay] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const toDateStr = useCallback((date: Date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  ), []);

  // Reset streak freezes monthly for premium users
  useEffect(() => {
    if (!userId || userId === 'undefined' || !isPremium) return;

    const today = new Date().toLocaleDateString('en-CA');
    const currentMonth = today.substring(0, 7); // YYYY-MM

    if (lastFreezeReset !== currentMonth) {
      // Reset streak freezes to 2 per month
      supabase
        .from('profiles')
        .update({ streak_freezes: 2 })
        .eq('id', userId)
        .then(() => {
          setStreakFreezes(2);
          setLastFreezeReset(currentMonth);
        });
    }
  }, [userId, isPremium, lastFreezeReset]);

  const fetchStreakData = useCallback(async (isActive: () => boolean) => {
    if (!userId || userId === 'undefined' || !waterGoal) return;

    if (isPremium) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak_freezes')
        .eq('id', userId)
        .single();

      if (isActive() && profile) {
        setStreakFreezes(profile.streak_freezes || 0);
      }
    }

    const now = new Date();
    const dates: string[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(toDateStr(d));
    }

    const yesterday = dates[0] || null;
    const dayBeforeYesterday = dates[1] || null;
    
    const todayKey = toDateStr(now).replace(/-/g, '');
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
    const startDateKey = toDateStr(startDate).replace(/-/g, '');

    const { data, error } = await supabase
      .from('water_logs')
      .select('day, amount')
      .eq('user_id', userId)
      .gte('day', startDateKey)
      .lte('day', todayKey);

    if (error) {
      console.error('Lỗi tải dữ liệu streak:', error);
      return;
    }

    const dailyTotals = new Map<string, number>();
    (data || []).forEach((log: any) => {
      const amt = Number(log.amount ?? log.ml ?? 0);
      const s = String(log.day);
      if (s.length !== 8) return;
      const logDay = `${s.substring(0,4)}-${s.substring(4,6)}-${s.substring(6,8)}`;

      const current = dailyTotals.get(logDay) || 0;
      dailyTotals.set(logDay, current + (Number.isNaN(amt) ? 0 : amt));
    });

    let currentPastStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      const total = dailyTotals.get(dates[i]) || 0;
      if (total >= waterGoal) currentPastStreak++;
      else break;
    }

    const yesterdayTotal = yesterday ? (dailyTotals.get(yesterday) || 0) : 0;
    const dayBeforeYesterdayTotal = dayBeforeYesterday ? (dailyTotals.get(dayBeforeYesterday) || 0) : 0;
    const nextFreezeCandidate = (
      yesterday &&
      yesterdayTotal < waterGoal &&
      dayBeforeYesterdayTotal >= waterGoal
    ) ? yesterday : null;

    if (isActive()) {
      setPastStreak(currentPastStreak);
      setFreezeCandidateDay(nextFreezeCandidate);
    }
  }, [isPremium, toDateStr, userId, waterGoal]);

  useEffect(() => {
    if (!userId || userId === 'undefined' || !waterGoal) return;

    let active = true;
    const isActive = () => active;

    void fetchStreakData(isActive);

    return () => {
      active = false;
    };
  }, [fetchStreakData, refreshVersion, userId, waterGoal]);

  // Tổng Streak = Chuỗi quá khứ + (1 nếu hôm nay đã đạt)
  const streak = useMemo(() => pastStreak + (todayIntake >= waterGoal ? 1 : 0), [pastStreak, todayIntake, waterGoal]);

  const needsFreeze = useMemo(() => {
    if (!isPremium || streakFreezes <= 0) return false;
    return Boolean(freezeCandidateDay);
  }, [freezeCandidateDay, isPremium, streakFreezes]);

  const useStreakFreeze = async () => {
    if (!userId || userId === 'undefined' || !isPremium || streakFreezes <= 0 || !needsFreeze) return false;

    try {
      const { data, error } = await supabase.rpc('use_streak_freeze', {
        p_user_id: userId,
      });

      if (error) {
        // Surface the server error to the user — do NOT mutate local state
        const friendlyMessage = error.message?.includes('No active streak')
          ? 'Không có chuỗi streak nào đang hoạt động để bảo vệ.'
          : error.message?.includes('already met')
          ? 'Ngày hôm qua đã đạt mục tiêu, không cần dùng Streak Freeze.'
          : error.message?.includes('No streak freezes')
          ? 'Bạn đã hết lượt Streak Freeze trong tháng này.'
          : 'Không thể sử dụng Streak Freeze lúc này.';

        const { toast } = await import('sonner');
        toast.error(friendlyMessage);
        return false;
      }

      // Only update local state from the verified server response
      if (typeof data?.remaining_freezes !== 'number') {
        return false;
      }

      setStreakFreezes(data.remaining_freezes);
      setFreezeCandidateDay(null);

      // Re-fetch streak data to reflect the compensating water_log entry
      setRefreshVersion(value => value + 1);

      const { toast } = await import('sonner');
      toast.success(`Đã bảo vệ streak thành công! Còn ${data.remaining_freezes} lượt Freeze.`);
      return true;
    } catch {
      return false;
    }
  };

  return {
    streak,
    streakFreezes,
    needsFreeze,
    useStreakFreeze,
    isPremium
  };
}
