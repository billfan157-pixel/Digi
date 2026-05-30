import { Radar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { LeagueMode } from './types';

interface EmptyStateProps {
  searchQuery: string;
  leagueMode: LeagueMode;
  onReset: () => void;
  onAddFriend?: () => void;
}

export const EmptyState = ({ searchQuery, leagueMode, onReset, onAddFriend }: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
  <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-xl">
    {/* Aurora glow */}
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-[60px] rounded-full pointer-events-none" />
    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />

    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] relative"
    >
      <Radar size={26} className="text-slate-400" />
    </motion.div>
    
    <p className="text-lg font-black text-white">{t('league.no_data_matching')}</p>
    
    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
      {searchQuery
        ? t('league.no_data_search')
        : leagueMode === 'friends'
          ? t('league.no_data_friends')
          : t('league.no_data_full')}
    </p>
    
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={onReset}
        className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/15 active:scale-[0.97]"
      >
        {t('league.reset_filter')}
      </button>
      {leagueMode === 'friends' && onAddFriend && (
        <button
          onClick={onAddFriend}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
        >
          {t('league.challenge_friends')}
        </button>
      )}
    </div>
  </div>
  );
};