import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Zap, Users, Loader2 } from 'lucide-react';
import { glassCard } from '@/styles/glass';

interface QuickActionBarProps {
  onBotDuel: () => void;
  onQuickMatch: () => void;
  onGroupChallenge: () => void;
  isBotMatching: boolean;
  isQueuing: boolean;
  hasActiveBattle: boolean;
}

const QuickActionBar = React.memo(function QuickActionBar({
  onBotDuel,
  onQuickMatch,
  onGroupChallenge,
  isBotMatching,
  isQueuing,
  hasActiveBattle,
}: QuickActionBarProps) {
  const { t } = useTranslation();

  return (
    <div className="px-5 mb-4 grid grid-cols-3 gap-3">
      <button
        onClick={onBotDuel}
        disabled={isBotMatching || hasActiveBattle}
        className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50`}
      >
        {isBotMatching ? (
          <Loader2 size={24} className="animate-spin text-cyan-400" />
        ) : (
          <Bot size={24} className="text-cyan-400" />
        )}
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
          {t('battle.duel_with_bot')}
        </span>
        <span className="text-[8px] text-slate-500">{t('common.start')}</span>
      </button>

      <button
        onClick={onQuickMatch}
        disabled={isQueuing}
        className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50`}
      >
        {isQueuing ? (
          <Loader2 size={24} className="animate-spin text-rose-400" />
        ) : (
          <Zap size={24} className="text-rose-400" />
        )}
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
          {t('battle.duel_quick')}
        </span>
        <span className="text-[8px] text-slate-500">{t('battle.find_random_opponent')}</span>
      </button>

      <button
        onClick={onGroupChallenge}
        className={`${glassCard} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all`}
      >
        <Users size={24} className="text-emerald-400" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
          {t('battle.group_challenge')}
        </span>
        <span className="text-[8px] text-slate-500">{t('battle.group_challenge_desc')}</span>
      </button>
    </div>
  );
});

export default QuickActionBar;
