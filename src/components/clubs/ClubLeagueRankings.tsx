import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface RankingEntry {
  rank: number;
  club_id: string;
  name: string;
  league_points: number;
  battle_wins: number;
  battle_losses: number;
  member_count: number;
}

interface ClubLeagueRankingsProps {
  onClose: () => void;
}

export default function ClubLeagueRankings({ onClose }: ClubLeagueRankingsProps) {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_league_rankings').then(({ data, error }) => {
      if (!error && data) setRankings(data as RankingEntry[]);
      setLoading(false);
    });
  }, []);

  const getLeagueBadge = (points: number) => {
    if (points >= 1000) return { name: 'Diamond', color: 'text-purple-400' };
    if (points >= 600) return { name: 'Platinum', color: 'text-cyan-400' };
    if (points >= 300) return { name: 'Gold', color: 'text-yellow-400' };
    if (points >= 100) return { name: 'Silver', color: 'text-slate-300' };
    return { name: 'Bronze', color: 'text-amber-600' };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative mt-20 bg-slate-900 rounded-t-3xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Shield size={20} /> {t('club.battle_rankings')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} className="text-white/70" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-slate-500 py-8">{t('common.loading')}</div>
          ) : rankings.length === 0 ? (
            <div className="text-center text-slate-500 py-8">{t('common.no_results')}</div>
          ) : (
            rankings.map((entry) => {
              const badge = getLeagueBadge(entry.league_points);
              return (
                <div key={entry.club_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold text-sm ${entry.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                      #{entry.rank}
                    </span>
                    <div>
                      <span className="text-white text-sm font-semibold">{entry.name}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Shield size={12} className={badge.color} />
                        <span className={badge.color}>{badge.name}</span>
                        <span>{entry.member_count} TV</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold text-sm">{entry.league_points}đ</span>
                    <div className="text-[10px] text-slate-500">
                      {entry.battle_wins}W - {entry.battle_losses}L
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
