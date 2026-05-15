import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useBattleArena(profile: Record<string, unknown> | null, isOpen: boolean, onSpendCoins: (amount: number) => Promise<boolean>) {
  const [activeBattle, setActiveBattle] = useState<Record<string, unknown> | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Record<string, unknown>[]>([]);
  const [opponents, setOpponents] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(100);

  const loadArenaData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    
    try {
      const { data: battles, error } = await supabase
        .from('hydration_battles')
        .select(`
          *,
          challenger:profiles!hydration_battles_challenger_fkey(id, nickname, avatar_url, water_today, water_goal),
          opponent:profiles!hydration_battles_opponent_fkey(id, nickname, avatar_url, water_today, water_goal)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      let currentActive = battles?.find((b: Record<string, unknown>) => b.status === 'active') as Record<string, unknown> | null;
      
      if (currentActive) {
        const battleDay = new Date(String(currentActive.created_at)).toISOString().split('T')[0];
        if (battleDay < today) {
          const { data: result, error } = await supabase.rpc('resolve_stale_battle', {
            battle_id: currentActive.id
          });
          if (!error && result) {
            if (result.status === 'won') toast.success(`Trận hôm qua đã kết thúc. Bạn THẮNG và ẵm trọn ${result.reward} Vàng!`, { duration: 8000 });
            else if (result.status === 'draw') toast.info(`Trận đấu hôm qua HÒA. Đã hoàn trả ${result.reward} Vàng.`);
            else if (result.status === 'lost') toast.error(`Thua cuộc! Đối thủ đã uống nhiều hơn bạn vào hôm qua.`);
          }
          currentActive = null; 
        }
      }

      setActiveBattle(currentActive ?? null);
      setPendingInvites(battles?.filter((b: Record<string, unknown>) => b.status === 'pending' && b.opponent_id === profile.id) || []);

      if (!currentActive) {
        const { data: users } = await supabase.from('profiles').select('id, nickname, level, avatar_url').neq('id', profile.id).limit(10);
        setOpponents(users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu Đấu trường');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) loadArenaData();
  }, [isOpen, loadArenaData]);

  const handleChallenge = async (opponentId: string) => {
    const profileCoins = Number(profile?.coins || 0);
    if (profileCoins < stakeAmount) return toast.error('Không đủ Vàng để cược!');
    const success = await onSpendCoins(stakeAmount);
    if (!success) return;

    const tid = toast.loading('Đang rải chiến thư...');
    try {
      await supabase.from('hydration_battles').insert({
        challenger_id: profile?.id, opponent_id: opponentId, stake_coins: stakeAmount, status: 'pending'
      });
      toast.success('Đã gửi chiến thư!', { id: tid });
      loadArenaData();
    } catch {
      toast.error('Lỗi gửi thách đấu', { id: tid });
    }
  };

  const handleAccept = async (battle: Record<string, unknown>) => {
    const profileCoins = Number(profile?.coins || 0);
    const battleStake = Number(battle.stake_coins || 0);
    if (profileCoins < battleStake) return toast.error('Sếp không đủ Vàng để theo cược!');
    const success = await onSpendCoins(battleStake);
    if (!success) return;

    const tid = toast.loading('Đang lên đài...');
    try {
      const { error } = await supabase.rpc('accept_battle', {
        p_user_id: profile?.id,
        p_battle_id: battle.id
      });
      if (error) throw error;

      toast.success('Bắt đầu cuộc đua!', { id: tid });
      loadArenaData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi vào trận', { id: tid });
    }
  };

  return { activeBattle, pendingInvites, opponents, isLoading, stakeAmount, setStakeAmount, handleChallenge, handleAccept };
}
