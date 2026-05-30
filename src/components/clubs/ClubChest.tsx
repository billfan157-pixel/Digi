import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Loader2, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface ClubChestData {
  id: string;
  target_ml: number;
  current_ml: number;
  reward_coins: number;
  reward_exp: number;
  is_claimed: boolean;
  progress: number;
}

interface ClubChestProps {
  clubId: string;
}

export default function ClubChest({ clubId }: ClubChestProps) {
  const { t } = useTranslation();
  const [chest, setChest] = useState<ClubChestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadChest = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_or_create_club_chest', { p_club_id: clubId });
    if (!error && data) setChest(data as ClubChestData);
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    loadChest();
  }, [loadChest]);

  const handleContribute = async () => {
    if (!chest) return;
    const { data, error } = await supabase.rpc('contribute_club_chest', { p_chest_id: chest.id, p_amount: 200 });
    if (error) { toast.error(error.message); return; }
    if (data) setChest({ ...chest, ...(data as Partial<ClubChestData>) });
    toast.success(t('club.contributed_200ml'));
  };

  const handleClaim = async () => {
    if (!chest || chest.current_ml < chest.target_ml) return;
    setClaiming(true);
    const { data, error } = await supabase.rpc('claim_club_chest', { p_chest_id: chest.id });
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('club.chest_reward_received', { coins: (data as { coins: number }).coins, exp: (data as { exp: number }).exp }));
    loadChest();
  };

  if (loading) return null;

  const isFull = !!(chest && chest.current_ml >= chest.target_ml);

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="text-amber-400" size={20} />
          <span className="text-white font-bold text-sm">{t('club.war_chest')}</span>
        </div>
        {isFull && !chest?.is_claimed && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-semibold">{t('club.chest_full')}</span>
        )}
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-3 mb-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(chest?.progress ?? 0, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span>{(chest?.current_ml ?? 0).toLocaleString()} / {(chest?.target_ml ?? 50000).toLocaleString()} ml</span>
        <span>{Math.round(chest?.progress ?? 0)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-slate-400">
          <span>+{chest?.reward_coins ?? 500} xu</span>
          <span>+{chest?.reward_exp ?? 100} exp</span>
        </div>
        <div className="flex gap-2">
          {!chest?.is_claimed && (
            <button
              onClick={handleContribute}
              disabled={isFull}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-40 transition-all"
            >
              <Unlock size={14} className="inline mr-1" />{t('club.contribute_200ml')}
            </button>
          )}
          {isFull && !chest.is_claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-all"
            >
              {claiming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} className="inline mr-1" />}
              {t('club.claim_reward')}
            </button>
          )}
          {chest?.is_claimed && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lock size={14} /> {t('club.claimed')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
