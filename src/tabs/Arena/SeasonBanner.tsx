import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Trophy, X, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SeasonInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  days_remaining: number;
}

function useCountdown(targetDate: string | null) {
  const target = targetDate ? new Date(targetDate).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  return { days, hours, mins, diff };
}

export default function SeasonBanner({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; duel_wp_earned: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  useEffect(() => {
    supabase.rpc('get_current_season').then(({ data, error }) => {
      if (!error && data) {
        setSeason(data as SeasonInfo);
        if (userId && (data as SeasonInfo)?.id) {
          supabase.rpc('get_user_season_rank', {
            p_season_id: (data as SeasonInfo).id,
            p_user_id: userId,
          }).then(({ data: rankData }) => {
            if (rankData) setUserRank(rankData as { rank: number; duel_wp_earned: number });
          });
        }
      }
      setLoading(false);
    });
  }, [userId]);

  const countdown = useCountdown(season?.end_date || null);

  const seasonProgress = useSyncExternalStore(
    (cb) => {
      const timer = setInterval(cb, 60000);
      return () => clearInterval(timer);
    },
    () => {
      if (!season?.start_date || !season?.end_date) return 0;
      const start = new Date(season.start_date).getTime();
      const end = new Date(season.end_date).getTime();
      const now = Date.now();
      if (now >= end) return 100;
      if (now <= start) return 0;
      return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    }
  );

  const rewards = [
    { tier: 'Đồng (Bronze)', rewards: '50 Vàng · Huy Hiệu Đồng', color: 'text-amber-600' },
    { tier: 'Bạc (Silver)', rewards: '150 Vàng · Huy Hiệu Bạc', color: 'text-slate-400' },
    { tier: 'Vàng (Gold)', rewards: '300 Vàng · Huy Hiệu Vàng · Khung Avatar Vàng', color: 'text-yellow-400' },
    { tier: 'Bạch Kim (Platinum)', rewards: '500 Vàng · Huy Hiệu Bạch Kim · Khung Avatar Bạch Kim', color: 'text-teal-400' },
    { tier: 'Kim Cương (Diamond)', rewards: '800 Vàng · Huy Hiệu Kim Cương · Khung Avatar Kim Cương', color: 'text-cyan-400' },
    { tier: 'Thần Thoại (Mythic)', rewards: '1500 Vàng · Huy Hiệu Thần Thoại · Khung Thần Thoại Động', color: 'text-pink-400' },
  ];

  if (loading) return (
    <div className="mx-5 mb-4 h-16 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse" />
  );
  if (!season) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowRewardsModal(true)}
        className="mx-5 mb-4 relative overflow-hidden rounded-2xl border border-indigo-500/20 cursor-pointer hover:border-indigo-500/40 transition-colors shadow-lg"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-indigo-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_50%)]" />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <CalendarDays size={14} className="text-indigo-300 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white truncate">
                  {season.name || t('battle.current_season', 'Mùa Giải Hiện Tại')}
                </span>
                <span className="text-[7px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.25 rounded border border-emerald-500/20">
                  {t('battle.season_time_left', { days: countdown.days, hours: countdown.hours })}
                </span>
              </div>
              
              {/* Season Progress row */}
              <div className="flex items-center gap-2 mt-1.5 max-w-xs">
                <div className="flex-1 h-1 bg-slate-900/60 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${seasonProgress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <span className="text-[7px] font-black text-indigo-300/80">{Math.round(seasonProgress)}%</span>
              </div>
            </div>
          </div>

          {/* User Rank preview on right */}
          {userRank ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 shrink-0 ml-3">
              <div className="text-right">
                <p className="text-indigo-300 text-[10px] font-black">{t('battle.rank_hash', { rank: userRank.rank })}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{userRank.duel_wp_earned} WP</p>
              </div>
              <Trophy size={14} className="text-amber-400 shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-1.5 rounded-xl">
              <Gift size={12} className="text-amber-400/80" /> {t('battle.view_rewards')}
            </div>
          )}
        </div>
      </motion.div>

      {/* Rewards Info Modal */}
      <AnimatePresence>
        {showRewardsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRewardsModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-amber-400" />
                  <h3 className="text-md font-black text-white uppercase tracking-tight">{t('battle.season_rewards')}</h3>
                </div>
                <button
                  onClick={() => setShowRewardsModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description */}
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-4">
                {t('battle.season_rewards_desc')}
              </p>

              {/* Rewards List */}
              <div className="space-y-2 mb-6">
                {rewards.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-[10px] font-bold">
                    <span className={`font-black ${r.color}`}>{r.tier}</span>
                    <span className="text-slate-300 text-right font-medium">{r.rewards}</span>
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowRewardsModal(false)}
                className="w-full py-3 bg-white text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-center"
              >
                {t('common.ok')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
