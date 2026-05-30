import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Swords, Clock, Droplets, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { glassCard } from '../../../styles/glass';
import { useActiveDuels } from '../../../hooks/useActiveDuels';
import { useAppStore } from '../../../store/useAppStore';
import { supabase } from '../../../lib/supabase';

interface ActiveDuelBannerProps {
  onViewArena?: () => void;
}

function formatCountdown(deadline: string | null): { text: string; expired: boolean } {
  if (!deadline) return { text: '', expired: false };
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return { text: 'Time\'s up', expired: true };
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (h > 0) return { text: `${h}h ${m}m`, expired: false };
  if (m > 0) return { text: `${m}m ${s}s`, expired: false };
  return { text: `${s}s`, expired: false };
}

async function resolveBattle(battleId: string) {
  try {
    const { data, error } = await supabase.rpc('resolve_stale_battle', { battle_id: battleId });
    if (error) throw error;
    return data as { status: string; reward: number; milestone?: string | null };
  } catch (err) {
    console.error('Lỗi tự động kết thúc duel:', err);
    return null;
  }
}

export const ActiveDuelBanner = memo(({ onViewArena }: ActiveDuelBannerProps) => {
  const profile = useAppStore(s => s.profile);
  const { duels } = useActiveDuels(profile?.id);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResolve = useCallback(async (battleId: string, deadline: string | null) => {
    if (!deadline) return;
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining > 0) return;
    const result = await resolveBattle(battleId);
    if (result) {
      toast.info(
        result.status === 'won' ? 'You won the duel!' :
        result.status === 'draw' ? 'Duel ended in a draw!' :
        'You lost the duel!'
      );
      if (result.milestone) {
        toast.success(`🏆 Achievement: ${result.milestone}!`, { duration: 5000 });
      }
    }
  }, []);

  useEffect(() => {
    duels.forEach(duel => {
      if (duel.deadline) {
        const remaining = new Date(duel.deadline).getTime() - Date.now();
        if (remaining <= 0) {
          handleResolve(duel.id, duel.deadline);
        }
      }
    });
  }, [duels, now, handleResolve]);

  if (duels.length === 0) return null;

  return (
    <div className="px-5">
      {duels.map(duel => {
        const opponent = duel.challenger_id === profile?.id ? duel.opponent : duel.challenger;
        const yourPct = Math.min(100, Math.round((duel.yourProgress / Math.max(duel.targetMl, 1)) * 100));
        const opponentPct = Math.min(100, Math.round((duel.opponentProgress / Math.max(duel.targetMl, 1)) * 100));
        const { text: countdownText, expired } = formatCountdown(duel.deadline);

        return (
          <motion.button
            key={duel.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onViewArena ? onViewArena : undefined}
            className={`${glassCard} w-full rounded-[1.75rem] p-4 text-left relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer mb-4`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-rose-500/5 pointer-events-none" />
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />

            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10">
                  <Swords size={14} className="text-rose-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                  Competing
                </span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-lg">
                  {duel.mode}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {countdownText && (
                  <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                    expired ? 'border-rose-500/30 bg-rose-500/10' : 'border-purple-500/20 bg-purple-500/10'
                  }`}>
                    <Clock size={11} className={expired ? 'text-rose-300' : 'text-purple-300'} />
                    <span className={`text-[9px] font-black tabular-nums ${expired ? 'text-rose-300' : 'text-purple-300'}`}>
                      {countdownText}
                    </span>
                  </div>
                )}
                <ChevronRight size={14} className="text-slate-600" />
              </div>
            </div>

            <div className="relative z-10 mb-3 flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-slate-800 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-black text-cyan-300">B</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400">You</p>
                  <p className="text-xs font-black text-white tabular-nums">{duel.yourProgress} / {duel.targetMl}ml</p>
                </div>
              </div>
              <div className="text-[9px] font-black text-slate-600 italic">VS</div>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{opponent?.nickname || 'Opponent'}</p>
                  <p className="text-xs font-black text-rose-300 tabular-nums">{duel.opponentProgress} / {duel.targetMl}ml</p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-slate-800 overflow-hidden">
                  {opponent?.avatar_url ? (
                    <img src={opponent.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-black text-rose-300">{opponent?.nickname?.[0] || '?'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <Droplets size={10} className="text-cyan-400" />
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                    style={{ width: `${yourPct}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-cyan-300 w-8 text-right tabular-nums">{yourPct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets size={10} className="text-rose-400" />
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-500 transition-all duration-700"
                    style={{ width: `${opponentPct}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-rose-300 w-8 text-right tabular-nums">{opponentPct}%</span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});
