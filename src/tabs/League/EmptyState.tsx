import { Radar } from 'lucide-react';
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
  <div className="relative overflow-hidden rounded-[var(--theme-border-radius,24px)] border border-[var(--theme-border-glass,rgba(255,255,255,0.08))] bg-[var(--theme-surface-glass,rgba(34,211,238,0.04))] p-8 text-center backdrop-blur-[var(--theme-blur,40px)]">
    {/* Decoration glow */}
    <div className="absolute -top-8 -left-8 w-24 h-24 bg-[var(--theme-glow-color,rgba(34,211,238,0.15))] blur-[50px] rounded-full pointer-events-none" />
    
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--theme-border-glass,rgba(255,255,255,0.08))] bg-[var(--theme-surface-glass,rgba(255,255,255,0.04))]">
      <Radar size={26} className="text-slate-500" />
    </div>
    
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
        className="rounded-[var(--theme-border-radius-inner,12px)] border border-[var(--theme-border-glass,rgba(255,255,255,0.1))] bg-[var(--theme-surface-glass,rgba(255,255,255,0.05))] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/5 active:scale-[0.97]"
      >
        {t('league.reset_filter')}
      </button>
      {leagueMode === 'friends' && onAddFriend && (
        <button
          onClick={onAddFriend}
          className="rounded-[var(--theme-border-radius-inner,12px)] border border-emerald-500/20 bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
        >
          {t('league.challenge_friends')}
        </button>
      )}
    </div>
  </div>
  );
};