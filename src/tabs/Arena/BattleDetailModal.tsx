import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Clock, Coins, TrendingUp, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import type { Battle, Profile } from '../../models';

interface BattleDetailModalProps {
  battle: Battle;
  profile: Profile | null;
  now: number;
  onClose: () => void;
  onActionComplete: () => void;
}

const BattleDetailModal: React.FC<BattleDetailModalProps> = ({ battle, profile, now, onClose, onActionComplete }) => {
  const [isActing, setIsActing] = useState(false);
  const isChallenger = battle.challenger_id === profile?.id;
  const me = isChallenger ? battle.challenger : battle.opponent;
  const opponent = isChallenger ? battle.opponent : battle.challenger;
  
  const userNickname = me?.nickname ?? 'Bạn';
  const oppNickname = opponent?.nickname ?? 'Đối thủ';

  const myProgress = battle.yourProgress ?? me?.water_today ?? 0;
  const oppProgress = battle.opponentProgress ?? opponent?.water_today ?? 0;
  const yourLead = myProgress >= oppProgress;
  
  const endsAt = new Date();
  endsAt.setHours(23, 59, 59, 999);
  const timeLeft = Math.max(0, endsAt.getTime() - now);
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden"
      >
        {/* Glow */}
        <div className={`absolute -top-24 ${yourLead ? 'left-0 bg-cyan-500/20' : 'right-0 bg-rose-500/20'} w-48 h-48 blur-[60px] rounded-full pointer-events-none`} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Chi tiết thách đấu</p>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Võ Đài <Swords size={20} className="text-rose-500" />
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* VS Face-off */}
        <div className="relative mb-10 z-10">
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-2xl">
              <span className="text-xs font-black text-slate-500 italic">VS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* You */}
            <div className={`rounded-[2rem] border p-5 text-center transition-all duration-500 ${yourLead ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-800/40 border-white/5'}`}>
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border text-xl font-black ${yourLead ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                {userNickname.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-black text-slate-300 mb-1 truncate">{userNickname}</p>
              <p className={`text-3xl font-black ${yourLead ? 'text-cyan-400' : 'text-white'}`}>{myProgress}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1.5 opacity-60">ml uống</p>
            </div>

            {/* Opponent */}
            <div className={`rounded-[2rem] border p-5 text-center transition-all duration-500 ${!yourLead ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-slate-800/40 border-white/5'}`}>
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border text-xl font-black ${!yourLead ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
                {oppNickname.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-black text-slate-300 mb-1 truncate">{oppNickname}</p>
              <p className={`text-3xl font-black ${!yourLead ? 'text-rose-400' : 'text-white'}`}>{oppProgress}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1.5 opacity-60">ml uống</p>
            </div>
          </div>
        </div>

        {/* Stats HUD */}
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col items-center justify-center shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2 mb-1.5">
              <Coins size={16} className="text-amber-500" />
              <span className="text-[9px] text-amber-500/70 uppercase tracking-widest font-black">Tiền cược</span>
            </div>
            <p className="text-xl font-black text-amber-400">{battle.stake_coins} WP</p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock size={16} className="text-slate-400" />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Thời gian</span>
            </div>
            <p className="text-xl font-black text-white">{hoursLeft}h còn</p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 space-y-3">
          {battle.status === 'active' && (
            <button
              onClick={() => {
                toast.success('💧 Đã nạp thêm nước và đẩy tiến độ!', {
                  className: "bg-slate-900 border border-white/10 text-white rounded-2xl"
                });
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp size={18} /> Bơm thêm nước ngay!
            </button>
          )}

          {battle.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!profile?.id) return;
                  setIsActing(true);
                  try {
                    const { error } = await supabase.rpc('decline_battle', {
                      p_user_id: profile.id,
                      p_battle_id: battle.id,
                    });
                    if (error) throw error;
                    toast.error('Đã từ chối thách đấu');
                    onActionComplete();
                    onClose();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Lỗi từ chối');
                  } finally {
                    setIsActing(false);
                  }
                }}
                disabled={isActing}
                className="flex-1 py-4 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 font-black text-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {isActing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Từ chối'}
              </button>
              <button
                onClick={async () => {
                  if (!profile?.id) return;
                  setIsActing(true);
                  try {
                    const { error } = await supabase.rpc('accept_battle', {
                      p_user_id: profile.id,
                      p_battle_id: battle.id,
                    });
                    if (error) throw error;
                    toast.success('⚔️ Đã chấp nhận thách đấu!');
                    onActionComplete();
                    onClose();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Lỗi chấp nhận');
                  } finally {
                    setIsActing(false);
                  }
                }}
                disabled={isActing}
                className="flex-[2] py-4 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isActing ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Chấp nhận</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BattleDetailModal;
