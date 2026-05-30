import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Zap, Flame, Swords, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Battle } from '../../models';

interface PostMatchSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  battle: Battle;
  result: {
    status: 'won' | 'loss' | 'draw';
    reward: number; // Coins earned
    bonus: number;  // Bonus coins from streak
    elo_delta: number;
    new_elo: number;
    win_streak: number;
  } | null;
}

export default function PostMatchSummary({
  isOpen,
  onClose,
  battle,
  result,
}: PostMatchSummaryProps) {
  // battle prop reserved for future use (displaying opponent details)
  void battle;
  const { t } = useTranslation();
  const [animatedElo, setAnimatedElo] = useState(0);

  useEffect(() => {
    if (!isOpen || !result) return;
    const startElo = result.new_elo - result.elo_delta;
    setAnimatedElo(startElo);
    const duration = 1500; // 1.5s
    const steps = 30;
    const increment = result.elo_delta / steps;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedElo(result.new_elo);
        clearInterval(timer);
      } else {
        setAnimatedElo(Math.round(startElo + increment * currentStep));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const isWin = result.status === 'won';
  const isLoss = result.status === 'loss';
  const isDraw = result.status === 'draw';

  // Determine WP gained based on SQL logic (Win: 10, Draw: 5, Loss: 0)
  const wpGained = isWin ? 10 : isDraw ? 5 : 0;

  // Simple particle system using Framer Motion
  const particles = Array.from({ length: 40 });

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none">
      {/* Background ambient colors */}
      {isWin && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      )}
      {isLoss && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      )}
      {isDraw && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      )}

      {/* Confetti / Particle Particles for Winner */}
      {isWin && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((_, idx) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            const delay = Math.random() * 0.5;
            return (
              <motion.div
                key={idx}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '40%',
                  backgroundColor: ['#10B981', '#34D399', '#FBBF24', '#60A5FA', '#A78BFA'][idx % 5],
                }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.2, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance + 100, // fall down a bit
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  repeat: Infinity,
                  delay,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Header Results Banner */}
      <div className="text-center z-10 mt-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          {isWin && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                <Trophy size={42} className="text-emerald-400" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 uppercase tracking-wider mt-4">
                {t('battle.win', 'CHIẾN THẮNG!')}
              </h1>
            </div>
          )}
          {isLoss && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                <Swords size={42} className="text-rose-400" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 uppercase tracking-wider mt-4">
                {t('battle.loss', 'THẤT BẠI!')}
              </h1>
            </div>
          )}
          {isDraw && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                <Swords size={42} className="text-amber-400" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 uppercase tracking-wider mt-4">
                {t('battle.draw', 'HÒA CUỘC')}
              </h1>
            </div>
          )}
        </motion.div>
      </div>

      {/* Main Stats Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        className="w-full max-w-sm bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl relative z-10 space-y-6 shadow-2xl"
      >
        {/* ELO Summary */}
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {t('battle.current_elo', 'ĐIỂM XẾP HẠNG')}
          </p>
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className="text-lg text-slate-500 font-bold">
              {result.new_elo - result.elo_delta}
            </span>
            <ArrowRight size={14} className="text-slate-600" />
            <span className="text-3xl font-black text-white tracking-tight tabular-nums">
              {animatedElo}
            </span>
          </div>
          {result.elo_delta !== 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 }}
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                result.elo_delta > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {result.elo_delta > 0 ? `+${result.elo_delta}` : result.elo_delta} ELO
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Rewards Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Wellness Points (WP) */}
          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
              <Zap size={18} />
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Wellness Points</span>
            <span className="text-lg font-black text-white mt-1">
              +{wpGained} WP
            </span>
          </div>

          {/* Vàng / Coins */}
          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-2">
              <Coins size={18} />
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('battle.coins_earned')}</span>
            <span className="text-lg font-black text-white mt-1">
              +{result.reward + result.bonus} {t('common.coin_plural', 'WP')}
            </span>
            {result.bonus > 0 && (
              <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">
                (+{result.bonus} {t('battle.streak_bonus')})
              </span>
            )}
          </div>
        </div>

        {/* Streak notification */}
        {result.win_streak >= 3 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-3 rounded-2xl"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
              <Flame size={16} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider">{t('battle.pro_streak')}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                {t('battle.streak_detail', { count: result.win_streak })}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm z-10">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
        >
          {t('club.back_to_arena', 'Về Đấu Trường')}
        </motion.button>
      </div>
    </div>
  );
}
