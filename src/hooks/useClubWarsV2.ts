/**
 * useClubWarsV2 Hook
 * Inter-club competitions v2
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ClubWar {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  war_type: 'points' | 'streak' | 'consistency';
  participants: {
    club_id: string;
    club_name: string;
    score: number;
    rank: number;
  }[];
  rewards: {
    rank: number;
    coins: number;
    badge_id?: string;
  }[];
}

interface WarMatch {
  id: string;
  war_id: string;
  challenger_club_id: string;
  defender_club_id: string;
  challenger_score: number;
  defender_score: number;
  status: 'pending' | 'in_progress' | 'completed';
  winner_club_id?: string;
}

export function useClubWarsV2(clubId: string | undefined) {
  const queryClient = useQueryClient();
  const [activeWar, setActiveWar] = useState<ClubWar | null>(null);

  // Get club wars
  const { data: wars = [], isLoading } = useQuery({
    queryKey: ['club-wars', clubId],
    queryFn: async (): Promise<ClubWar[]> => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from('club_wars')
        .select('*')
        .or(`challenger_club_id.eq.${clubId},defender_club_id.eq.${clubId}`)
        .order('start_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!clubId,
  });

  // Create new war
  const createWar = useMutation({
    mutationFn: async (warData: { defender_club_id: string; war_type: string; duration_days: number }) => {
      const { error } = await supabase.rpc('create_club_war', {
        p_challenger_club_id: clubId,
        p_defender_club_id: warData.defender_club_id,
        p_war_type: warData.war_type,
        p_duration_days: warData.duration_days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-wars'] });
    },
  });

  // Accept/decline war challenge
  const respondToWar = useMutation({
    mutationFn: async ({ warId, accept }: { warId: string; accept: boolean }) => {
      const { error } = await supabase.rpc('respond_club_war', {
        p_war_id: warId,
        p_accept: accept,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-wars'] });
    },
  });

  // Get war leaderboard
  const getWarLeaderboard = useCallback(async (warId: string) => {
    const { data, error } = await supabase
      .from('club_war_participants')
      .select('*, club:club_id(name)')
      .eq('war_id', warId)
      .order('score', { ascending: false });
    if (error) return [];
    return data || [];
  }, []);

  // Submit war entry
  const submitEntry = useMutation({
    mutationFn: async ({ warId, entryData }: { warId: string; entryData: any }) => {
      const { error } = await supabase.rpc('submit_war_entry', {
        p_war_id: warId,
        p_club_id: clubId,
        p_entry_data: entryData,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-wars'] });
    },
  });

  // Claim war rewards
  const claimRewards = useMutation({
    mutationFn: async (warId: string) => {
      const { error } = await supabase.rpc('claim_war_rewards', {
        p_war_id: warId,
        p_club_id: clubId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-wars'] });
    },
  });

  return {
    wars,
    activeWar,
    isLoading,
    createWar: createWar.mutate,
    respondToWar: respondToWar.mutate,
    submitEntry: submitEntry.mutate,
    claimRewards: claimRewards.mutate,
    getWarLeaderboard,
  };
}