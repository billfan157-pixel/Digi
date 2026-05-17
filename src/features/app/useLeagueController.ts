import { useCallback, useEffect, useState } from 'react';
import type { TabType } from '@/components/layout/BottomNav';
import { useLeagueData } from '@/features/league/useLeagueData';
import type { AppProfile } from '@/services/profile.service';

interface UseLeagueControllerOptions {
  profile: AppProfile | null;
  activeTab: TabType;
  streak: number;
  setShowAddFriend: (value: boolean) => void;
}

export function useLeagueController({
  profile,
  activeTab,
  streak,
  setShowAddFriend,
}: UseLeagueControllerOptions) {
  const [wp, setWp] = useState(0);
  const [leagueMode, setLeagueMode] = useState<'public' | 'friends' | 'clubs'>('public');

  useEffect(() => {
    if (profile?.wp !== undefined) {
      setTimeout(() => setWp(Number(profile.wp)), 0);
    }
  }, [profile?.wp]);

  const { friendsList, publicLeaderboard } = useLeagueData({
    profile,
    activeTab,
    leagueMode,
    setShowAddFriend,
  });

  const getLeagueData = useCallback(() => {
    const myData = {
      id: profile?.id,
      name: profile?.nickname || 'Bạn',
      dept: 'Người dùng hệ thống',
      wp,
      streak,
      isMe: true,
    };

    if (leagueMode === 'public') {
      const currentUserInList = publicLeaderboard.some((user: { isMe: boolean }) => user.isMe);
      if (!currentUserInList && profile) {
        return [...publicLeaderboard, myData];
      }
      return publicLeaderboard;
    }

    return [...friendsList, myData];
  }, [friendsList, leagueMode, profile, publicLeaderboard, streak, wp]);

  return {
    wp,
    leagueMode,
    setLeagueMode,
    getLeagueData,
  };
}
