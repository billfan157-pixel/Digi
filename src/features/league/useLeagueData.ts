import { useCallback, useEffect, useState } from 'react';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { calculateWP } from '@/utils/healthMath';
import type { SearchResult } from '@/models';
import type { TabType } from '@/components/layout/BottomNav';

interface LeagueEntry {
  id: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

type LeagueMode = 'public' | 'friends' | 'clubs';

interface UseLeagueDataOptions {
  profile: { id?: string | null } | null;
  activeTab: TabType;
  leagueMode: LeagueMode;
  setShowAddFriend: (show: boolean) => void;
}

export function useLeagueData({
  profile,
  activeTab,
  leagueMode,
  setShowAddFriend,
}: UseLeagueDataOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [friendsList, setFriendsList] = useState<LeagueEntry[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [publicLeaderboard, setPublicLeaderboard] = useState<LeagueEntry[]>([]);

  const fetchFriendsData = useCallback(async () => {
    if (!profile?.id || profile.id === 'undefined') return;

    try {
      const { data: fData, error: fErr } = await supabase!
        .from('friends')
        .select('friend_id')
        .eq('user_id', profile.id);
      if (fErr || !fData) return;

      const friendIds = fData.map((friend: { friend_id: string }) => friend.friend_id);
      if (friendIds.length === 0) {
        setFriendsList([]);
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const { data: profilesData } = await supabase!
        .from('public_profiles')
        .select('id, nickname')
        .in('id', friendIds);
      const { data: waterLogs } = await supabase!
        .from('water_logs')
        .select('user_id, amount')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .in('user_id', friendIds);

      if (!profilesData) return;

      const dailyIntakeByUser: Record<string, number> = (waterLogs ?? []).reduce((totals: Record<string, number>, log: { user_id: string; amount: number }) => {
        totals[log.user_id] = (totals[log.user_id] || 0) + log.amount;
        return totals;
      }, {});

      setFriendsList(
        profilesData.map((friend: { id: string; nickname: string }) => {
          const intake = dailyIntakeByUser[friend.id] || 0;
          return {
            id: friend.id,
            name: friend.nickname || 'Người dùng',
            dept: 'Bạn bè',
            wp: calculateWP(intake, 2000, 1),
            streak: 1,
            isMe: false,
          };
        }),
      );
    } catch (error) {
      console.error('Lỗi tải bạn bè:', error);
    }
  }, [profile?.id]);

  const fetchPublicLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase!
        .from('public_profiles')
        .select('id, nickname, wp')
        .order('wp', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return;

      setPublicLeaderboard(
        data.map((entry: { id: string; nickname: string; wp: number }) => ({
          id: entry.id,
          name: entry.nickname || 'Người dùng',
          dept: 'Cộng đồng DigiWell',
          wp: entry.wp || 0,
          streak: 0,
          isMe: entry.id === profile?.id,
        })),
      );
    } catch (error) {
      console.error('Lỗi tải bảng xếp hạng công khai:', error);
    }
  }, [profile?.id]);

  const handleSearchUser = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase!
      .from('public_profiles')
      .select('id, nickname')
      .ilike('nickname', `%${query.replace(/[%_\\]/g, '\\$&')}%`)
      .neq('id', profile?.id)
      .limit(5);

    if (!error && data) {
      setSearchResults(
        data.map((user: { id: string; nickname: string; avatar_url?: string | null; level?: number }) => ({
          id: user.id,
          nickname: user.nickname || 'Người dùng',
          avatar_url: user.avatar_url ?? null,
          level: user.level ?? 1,
        })),
      );
    }
    setIsSearching(false);
  }, [profile?.id]);

  const handleAddFriend = useCallback(async (friendId: string, friendName: string) => {
    const toastId = toast.loading(i18n.t('league.sending_invite'));
    if (!profile?.id) {
      toast.error(i18n.t('league.invite_error'), { id: toastId });
      return;
    }
    const { error } = await supabase!
      .from('friends')
      .insert({ user_id: profile.id, friend_id: friendId });

    if (error) {
      if (error.code === '23505') {
        toast.error(i18n.t('social.friend_already', { name: friendName }), { id: toastId });
      } else {
        toast.error(i18n.t('social.error_with_message', { message: error.message }), { id: toastId });
      }
      return;
    }

    toast.success(i18n.t('social.friend_request_sent', { name: friendName }), { id: toastId });
    setShowAddFriend(false);
    setSearchQuery('');
    setSearchResults([]);
    await fetchFriendsData();
  }, [fetchFriendsData, profile?.id, setShowAddFriend]);

  useEffect(() => {
    if (activeTab !== 'league') return;

    if (leagueMode === 'friends') {
      void fetchFriendsData();
      return;
    }

    if (leagueMode === 'public') {
      void fetchPublicLeaderboard();
    }
  }, [activeTab, leagueMode, fetchFriendsData, fetchPublicLeaderboard]);

  return {
    searchQuery,
    setSearchQuery,
    friendsList,
    searchResults,
    setSearchResults,
    isSearching,
    publicLeaderboard,
    handleSearchUser,
    handleAddFriend,
    refreshFriends: fetchFriendsData,
    refreshPublicLeaderboard: fetchPublicLeaderboard,
  };
}
