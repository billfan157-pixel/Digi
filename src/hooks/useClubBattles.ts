import i18n from '@/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ClubBattle {
  id: string;
  challenger_club_id: string;
  opponent_club_id: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  target_ml: number;
  deadline: string | null;
  winner_club_id: string | null;
  stake_coins: number;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  challenger_name: string;
  opponent_name: string;
  challenger_total: number;
  opponent_total: number;
}

interface BattleWithParticipants extends ClubBattle {
  participants?: Array<{
    user_id: string;
    total_water: number;
  }>;
}

async function fetchClubBattles(clubId: string): Promise<BattleWithParticipants[]> {
  const { data, error } = await supabase.rpc('get_club_battles', { p_club_id: clubId });
  if (error) throw error;
  return (data as BattleWithParticipants[]) ?? [];
}

export function useClubBattles(clubId?: string) {
  const queryClient = useQueryClient();

  const battlesQuery = useQuery({
    queryKey: ['club_battles', clubId],
    queryFn: () => fetchClubBattles(clubId!),
    enabled: !!clubId,
    refetchInterval: 30_000,
  });

  const activeBattle = (battlesQuery.data ?? []).find(
    b => b.status === 'active' || b.status === 'pending'
  );

  const battleHistory = (battlesQuery.data ?? []).filter(
    b => b.status === 'completed'
  );

  const createBattle = useMutation({
    mutationFn: async (params: {
      opponent_club_id: string;
      target_ml: number;
      stake_coins: number;
    }) => {
      const { data, error } = await supabase.rpc('create_club_battle', {
        p_opponent_club_id: params.opponent_club_id,
        p_target_ml: params.target_ml,
        p_stake_coins: params.stake_coins,
      });
      if (error) throw error;
      const result = data as { error?: string; battle_id?: string; status?: string };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(i18n.t('battle.challenge_sent'));
      queryClient.invalidateQueries({ queryKey: ['club_battles', clubId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const acceptBattle = useMutation({
    mutationFn: async (battleId: string) => {
      const { data, error } = await supabase.rpc('accept_club_battle', { p_battle_id: battleId });
      if (error) throw error;
      const result = data as { error?: string };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(i18n.t('battle.challenge_accepted'));
      queryClient.invalidateQueries({ queryKey: ['club_battles', clubId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const contribute = useMutation({
    mutationFn: async (params: {
      battle_id: string;
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('contribute_club_battle', {
        p_battle_id: params.battle_id,
        p_amount: params.amount,
      });
      if (error) throw error;
      const result = data as { error?: string };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(i18n.t('battle.water_contributed_battle'));
      queryClient.invalidateQueries({ queryKey: ['club_battles', clubId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    battles: battlesQuery.data ?? [],
    activeBattle,
    battleHistory,
    loading: battlesQuery.isLoading,
    createBattle,
    acceptBattle,
    contribute,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['club_battles', clubId] }),
  };
}
