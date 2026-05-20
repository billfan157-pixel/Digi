import { useState, useEffect, useCallback } from 'react';
import { X, Swords, Coins, Shield, Loader2, Trophy, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Profile, Battle } from '../../models';

import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import AvatarFrame from '../AvatarFrame';

export default function BattleArenaModal() {
  const isOpen = useUIStore(s => s.showBattleArena);
  const onClose = () => useUIStore.getState().setShowBattleArena(false);
  const profile = useAppStore(s => s.profile);
  
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Battle[]>([]);
  const [opponents, setOpponents] = useState<Partial<Profile>[]>([]);
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
          challenger:public_profiles!hydration_battles_challenger_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level),
          opponent:public_profiles!hydration_battles_opponent_public_profile_fkey(id, nickname, avatar_url, water_today, water_goal, level)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      let currentActive = battles?.find((b: Battle) => b.status === 'active');
      
      // Resolve stale battles
      if (currentActive) {
        const battleDay = new Date(currentActive.created_at).toISOString().split('T')[0];
        if (battleDay < today) {
          const { data: result, error: staleError } = await supabase.rpc('resolve_stale_battle', { battle_id: currentActive.id });
          if (staleError) console.error('Lỗi resolve battle:', staleError);
          if (result) {
            if (result.status === 'won') toast.success(`🎉 Bạn THẮNG trận hôm qua: +${result.reward} WP!`);
            else if (result.status === 'draw') toast.info(`Trận hôm qua HÒA. Đã hoàn WP.`);
            else if (result.status === 'lost') toast.error(`Thua cuộc! Đối thủ đã uống nhiều hơn bạn.`);
          }
          currentActive = null;
        }
      }

      setActiveBattle(currentActive);
      setPendingInvites(battles?.filter((b: Battle) => b.status === 'pending' && b.opponent_id === profile.id) || []);

      if (!currentActive) {
        const { data: users, error: opponentsError } = await supabase
          .from('public_profiles')
          .select('id, nickname, level, avatar_url')
          .neq('id', profile.id)
          .limit(10);
        if (opponentsError) console.error('Lỗi tải đối thủ:', opponentsError);
        setOpponents(users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu Võ Đài');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) loadArenaData();
  }, [isOpen, loadArenaData]);

  // Handle Challenge
  const handleChallenge = async (opponentId: string) => {
    if (!profile) return;
    if (profile.coins < stakeAmount) return toast.error('Không đủ Vàng để cược!');
    
    const tid = toast.loading('Đang gửi chiến thư...');
    try {
      const { error } = await supabase.from('hydration_battles').insert({
        challenger_id: profile?.id, opponent_id: opponentId, stake_coins: stakeAmount, status: 'pending'
      });
      if (error) throw error;
      toast.success('Đã gửi thách đấu!', { id: tid });
      loadArenaData();
    } catch {
      toast.error('Lỗi gửi thách đấu', { id: tid });
    }
  };

  // Handle Accept
  const handleAccept = async (battle: Battle) => {
    if (!profile) return;
    if (profile.coins < battle.stake_coins) return toast.error('Bạn không đủ Vàng!');

    const tid = toast.loading('Đang lên đài...');
    try {
      const { error } = await supabase.rpc('accept_battle', {
        p_user_id: profile.id,
        p_battle_id: battle.id,
      });
      if (error) throw error;
      toast.success('🔥 Bắt đầu cuộc đua!', { id: tid });
      loadArenaData();
    } catch {
      toast.error('Lỗi vào trận', { id: tid });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Võ Đài Vinh Quang</p>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Giao Đấu <Swords className="text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-rose-500" size={40} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Đang tìm đối thủ...</p>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            
            {/* 1. ACTIVE BATTLE HUD */}
            {activeBattle ? (
              <div className="bg-slate-950/60 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
                <div className="text-center mb-6">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                     <Zap size={12} className="fill-current" /> Đang tranh tài • {activeBattle.stake_coins} WP
                   </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Challenger */}
                  <div className="flex flex-col items-center flex-1">
                    <AvatarFrame size="md" level={activeBattle.challenger?.level || 1} avatarUrl={activeBattle.challenger?.avatar_url ?? null} nickname={activeBattle.challenger?.nickname} showBadge={false} />
                    <p className="text-xs font-black text-white mt-3 truncate w-full text-center">{activeBattle.challenger?.nickname}</p>
                    <div className="mt-2 text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                      {activeBattle.challenger?.water_today}<span className="text-[10px] text-slate-500 ml-1">ml</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-600 italic">VS</div>
                  </div>

                  {/* Opponent */}
                  <div className="flex flex-col items-center flex-1">
                    <AvatarFrame size="md" level={activeBattle.opponent?.level || 1} avatarUrl={activeBattle.opponent?.avatar_url ?? null} nickname={activeBattle.opponent?.nickname} showBadge={false} />
                    <p className="text-xs font-black text-white mt-3 truncate w-full text-center">{activeBattle.opponent?.nickname}</p>
                    <div className="mt-2 text-2xl font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                      {activeBattle.opponent?.water_today}<span className="text-[10px] text-slate-500 ml-1">ml</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                   <button 
                     onClick={onClose}
                     className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all"
                   >
                     Xem chi tiết ở Tab Đấu Trường
                   </button>
                </div>
              </div>
            ) : (
              <>
                {/* 2. PENDING INVITES */}
                {pendingInvites.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black tracking-[0.2em] text-amber-500 uppercase flex items-center gap-2 mb-2">
                      <Shield size={14} className="fill-amber-500/10"/> Thư khiêu chiến
                    </p>
                    {pendingInvites.map(invite => (
                      <motion.div 
                        key={invite.id} 
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-5 flex justify-between items-center shadow-lg shadow-amber-500/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Swords size={20} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{invite.challenger?.nickname}</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500/80 mt-1">
                              <Coins size={12}/> {invite.stake_coins} WP
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAccept(invite)}
                          className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                        >
                          Lên đài
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 3. MATCHMAKING */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                      <Target size={14} className="text-rose-500"/> Tìm đối thủ
                    </p>
                    
                    {/* Stake Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                      {[50, 100, 500].map(amt => (
                        <button 
                          key={amt} 
                          onClick={() => setStakeAmount(amt)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                            stakeAmount === amt 
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {opponents.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-white/5 rounded-[2rem] bg-white/2">
                        <Trophy size={32} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 text-xs font-bold px-10">Đấu trường đang vắng lặng... hãy quay lại sau nhé!</p>
                      </div>
                    ) : (
                      opponents.map(user => (
                        <div key={user.id} className="group bg-white/3 border border-white/5 hover:border-rose-500/30 transition-all duration-300 rounded-[2rem] p-4 flex justify-between items-center relative overflow-hidden shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/0 to-rose-500/5 group-hover:via-rose-500/5 transition-all" />
                          <div className="flex items-center gap-4 relative z-10">
                            <AvatarFrame size="sm" level={user.level || 1} avatarUrl={user.avatar_url || null} nickname={user.nickname} showBadge={false} />
                            <div>
                              <p className="text-sm font-black text-white">{user.nickname}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1.5 py-0.5 rounded-md bg-slate-800 border border-white/5">
                                  Lv.{user.level || 1}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sẵn sàng
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => user.id && handleChallenge(user.id)}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-90 transition-all relative z-10 border border-rose-500/20 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          >
                            <Swords size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
