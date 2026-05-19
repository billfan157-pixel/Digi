import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const CLUB_QUERY_KEY = (userId?: string) => ['clubs', userId] as const;

async function fetchMyClub(userId: string) {
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('role, club_id, clubs(*)')
    .eq('user_id', userId)
    .maybeSingle();
  if (memberError) throw memberError;
  return memberData?.clubs ? { ...memberData.clubs, role: memberData.role } : null;
}

async function fetchAllClubs() {
  const { data, error } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((club: Record<string, unknown>) => ({
    ...club,
    member_count: (club.club_members as Array<{ count: number }> | null)?.[0]?.count ?? 0,
  }));
}

export function useClubs(userId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryKey = CLUB_QUERY_KEY(userId);

  const myClubQuery = useQuery({
    queryKey: [...queryKey, 'myClub'] as const,
    queryFn: () => fetchMyClub(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const allClubsQuery = useQuery({
    queryKey: [...queryKey, 'all'] as const,
    queryFn: fetchAllClubs,
    enabled: !!userId,
    staleTime: 30_000,
  });

  const joinMut = useMutation({
    mutationFn: async (clubId: string) => {
      if (!userId) throw new Error('Missing user id');
      const { data, error } = await supabase
        .from('club_members')
        .insert({ user_id: userId, club_id: clubId, role: 'member' });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã tham gia club thành công');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('Không thể tham gia club'),
  });

  const leaveMut = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user id');
      const { data, error } = await supabase
        .from('club_members')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã rời câu lạc bộ');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('Không thể rời club'),
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`clubs-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_members' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient, queryKey]);

  return {
    myClub: myClubQuery.data ?? null,
    allClubs: allClubsQuery.data ?? [],
    loading: myClubQuery.isLoading || allClubsQuery.isLoading,
    joining: joinMut.isPending,
    joinClub: useCallback((clubId: string) => joinMut.mutate(clubId), [joinMut]),
    leaveClub: useCallback(() => leaveMut.mutate(), [leaveMut]),
    refresh: useCallback(() => {
      queryClient.invalidateQueries({ queryKey });
    }, [queryClient, queryKey]),
  };
}
