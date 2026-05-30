import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Coins, Frown } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export default function DuelResultModal() {
  const { t } = useTranslation();
  const isOpen = useUIStore(s => s.showDuelResult);
  const onClose = () => useUIStore.getState().setShowDuelResult(false);
  const data = useUIStore(s => s.duelResultData);

  if (!isOpen || !data) return null;

  const { result, rewardCoins, opponentName } = data;
  const isWin = result === 'won';
  const isDraw = result === 'draw';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          className="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl overflow-hidden"
        >
          <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl pointer-events-none ${
            isWin ? 'bg-emerald-500/20' : isDraw ? 'bg-amber-500/20' : 'bg-rose-500/20'
          }`} />
          <div className={`absolute -bottom-20 -left-20 h-40 w-40 rounded-full blur-3xl pointer-events-none ${
            isWin ? 'bg-emerald-500/10' : isDraw ? 'bg-amber-500/10' : 'bg-rose-500/10'
          }`} />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10"
          >
            <X size={18} />
          </button>

          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] border-2 ${
            isWin
              ? 'border-emerald-400/40 bg-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.2)]'
              : isDraw
                ? 'border-amber-400/40 bg-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                : 'border-rose-400/40 bg-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
          }`}>
            {isWin ? (
              <Trophy size={36} className="text-emerald-400" />
            ) : isDraw ? (
              <span className="text-3xl font-black text-amber-400">=</span>
            ) : (
              <Frown size={36} className="text-rose-400" />
            )}
          </div>

          <h2 className={`text-2xl font-black mb-2 ${
            isWin ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {isWin ? t('duel.win') : isDraw ? t('duel.draw') : t('duel.loss')}
          </h2>

          <p className="text-sm text-slate-400 font-medium mb-6">
            {isWin
              ? t('duel.beat_opponent', { name: opponentName || t('duel.opponent_default') })
              : isDraw
                ? t('duel.draw_with_opponent', { name: opponentName || t('duel.opponent_default') })
                : t('duel.lost_to_opponent', { name: opponentName || t('duel.opponent_default') })}
          </p>

          {rewardCoins > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3">
              <Coins size={20} className="text-amber-400" />
              <span className="text-lg font-black text-amber-300">+{rewardCoins} xu</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 py-3 text-xs font-black text-white transition-all active:scale-95"
          >
            {t('common.close')}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
