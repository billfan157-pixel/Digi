import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, Clock, Zap, Trophy, Loader2, Coins, ChevronRight, X, Lock } from 'lucide-react';
import { glassControl, glassCard } from '../../styles/glass';

interface BattleModesProps {
  selectedMode: 'daily' | 'quick' | 'tournament' | null;
  setSelectedMode: (mode: 'daily' | 'quick' | 'tournament' | null) => void;
  onEnterQueue: (mode: 'daily' | 'quick' | 'tournament', stake: number) => Promise<void>;
  isQueuing: boolean;
  totalMatches?: number;
  userElo?: number;
}

const STAKE_PRESETS: Record<string, number[]> = {
  daily: [0, 50, 100, 200],
  quick: [0, 10, 50, 100],
  tournament: [0, 100, 300, 500],
};

const MODE_CONFIG = {
  daily: { gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20', iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/15' },
  quick: { gradient: 'from-rose-500/20 to-orange-500/20', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', iconColor: 'text-rose-400', iconBg: 'bg-rose-500/15' },
  tournament: { gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', iconColor: 'text-amber-400', iconBg: 'bg-amber-500/15' },
};

const BattleModes: React.FC<BattleModesProps> = ({ 
  selectedMode, 
  setSelectedMode, 
  onEnterQueue, 
  isQueuing,
  totalMatches = 0,
  userElo = 1200
}) => {
  const { t } = useTranslation();
  const [stake, setStake] = useState(0);

  const isTournamentLocked = totalMatches < 10;

  // Determine recommended mode based on user's current ELO
  let recommendedMode: 'daily' | 'quick' | 'tournament' = 'daily';
  if (userElo < 1300) {
    recommendedMode = 'quick';
  } else if (userElo >= 1500 && !isTournamentLocked) {
    recommendedMode = 'tournament';
  } else {
    recommendedMode = 'daily';
  }

  const modes = [
    { id: 'daily' as const, icon: Clock, label: t('battle.daily') || 'Đấu Hàng Ngày', desc: '24 giờ · Mục tiêu 2L', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'quick' as const, icon: Zap, label: t('battle.quick') || 'Đấu Nhanh', desc: '1 giờ · Phản xạ', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'tournament' as const, icon: Trophy, label: t('battle.tournament') || 'Giải Đấu', desc: '7 ngày · Leo tháp', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const activeMode = modes.find(m => m.id === selectedMode);
  const presets = activeMode ? STAKE_PRESETS[activeMode.id] : [];

  return (
    <div className="px-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
          <Target size={20} className="text-cyan-400" /> {t('common.select_mode') || 'Chọn Chế Độ'}
        </h3>
        {selectedMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => { setSelectedMode(null); setStake(0); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors"
          >
            <X size={12} /> Đóng
          </motion.button>
        )}
      </div>

      <div className={`${glassControl} rounded-[2rem] p-2 flex gap-2 shadow-2xl`}>
        {modes.map((m) => {
          const config = MODE_CONFIG[m.id];
          const isSelected = selectedMode === m.id;
          const isLocked = m.id === 'tournament' && isTournamentLocked;
          const isRecommended = recommendedMode === m.id;

          return (
            <motion.button
              key={m.id}
              onClick={() => {
                setSelectedMode(m.id);
                setStake(0);
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? `bg-gradient-to-b ${config.gradient} ${config.border} border shadow-lg ${config.glow}`
                  : 'border border-transparent hover:bg-white/5 active:scale-95'
              }`}
            >
              {isRecommended && (
                <div className="absolute top-2 left-2 z-20 bg-emerald-500/20 text-emerald-300 text-[7px] font-black px-1 py-0.5 rounded-md border border-emerald-500/30 tracking-wider">
                  {t('battle.recommended') || 'GỢI Ý'}
                </div>
              )}

              {isLocked && (
                <div className="absolute top-2 right-2 z-20 bg-slate-950/70 text-slate-400 p-1 rounded-lg border border-white/5">
                  <Lock size={10} />
                </div>
              )}

              {isSelected && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-t from-transparent via-${m.id === 'daily' ? 'cyan' : m.id === 'quick' ? 'rose' : 'amber'}-500/5 to-transparent pointer-events-none`} />
                  <motion.div
                    layoutId="modeGlow"
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full ${m.id === 'daily' ? 'bg-cyan-400' : m.id === 'quick' ? 'bg-rose-400' : 'bg-amber-400'} shadow-[0_0_12px_currentColor]`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                </>
              )}

              <motion.div
                animate={isSelected ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.6 }}
                className={`w-10 h-10 rounded-2xl ${isSelected ? config.iconBg : 'bg-white/5'} flex items-center justify-center border border-white/10 transition-all duration-300`}
              >
                <m.icon size={20} className={`${isSelected ? config.iconColor : 'text-slate-400'} ${isSelected ? 'drop-shadow-[0_0_8px_currentColor]' : ''} transition-colors`} />
              </motion.div>

              <div className="text-center relative z-10">
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-white' : 'text-slate-400'} transition-colors`}>
                  {m.label}
                </p>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedMode && activeMode && (
          <motion.div
            key={selectedMode}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`${glassCard} rounded-[2rem] p-5 mt-4 space-y-4 relative overflow-hidden`}
          >
            {/* Card ambient glow based on mode */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 blur-[80px] rounded-full pointer-events-none ${
              selectedMode === 'daily' ? 'bg-cyan-500/10' : selectedMode === 'quick' ? 'bg-rose-500/10' : 'bg-amber-500/10'
            }`} />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedMode === 'daily' ? 'bg-cyan-500/15 text-cyan-400' : selectedMode === 'quick' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {selectedMode === 'daily' ? <Clock size={16} /> : selectedMode === 'quick' ? <Zap size={16} /> : <Trophy size={16} />}
                  </div>
                  <p className="text-white font-bold text-sm">{activeMode.label}</p>
                </div>
              </div>

              {/* Recommendation explanation */}
              {recommendedMode === selectedMode && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-xs font-black">★</div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-emerald-300 font-black uppercase tracking-wider">{t('battle.recommended_mode') || 'Chế độ khuyên dùng'}</p>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      {selectedMode === 'quick' && (t('battle.recommended_quick_desc') || 'Phù hợp nhất với ELO hiện tại của bạn để rèn luyện phản xạ & leo rank nhanh.')}
                      {selectedMode === 'daily' && (t('battle.recommended_daily_desc') || 'Phù hợp nhất với ELO hiện tại của bạn để duy trì thói quen uống nước bền bỉ hằng ngày.')}
                      {selectedMode === 'tournament' && (t('battle.recommended_tournament_desc') || 'Phù hợp nhất với ELO hiện tại của bạn để tham gia tranh tài đỉnh cao.')}
                    </p>
                  </div>
                </div>
              )}

              {selectedMode === 'tournament' && isTournamentLocked ? (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                  <Lock size={28} className="text-rose-400" />
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">{t('battle.tournament_locked') || 'Chế độ Giải Đấu Đang Khóa'}</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {t('battle.tournament_lock_requirement') || 'Bạn cần hoàn thành ít nhất 10 trận đấu xếp hạng để mở khóa Giải Đấu.'}
                  </p>
                  <div className="w-full bg-slate-950/60 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-orange-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalMatches / 10) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    {t('battle.tournament_lock_progress', { count: totalMatches }) || `Tiến trình: ${totalMatches}/10 trận đấu`}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                      <Coins size={10} /> {t('battle.select_stake') || 'Chọn tiền cược'}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {presets.map(p => (
                        <motion.button
                          key={p}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setStake(p)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                            stake === p
                              ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                              : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {p === 0 ? (t('battle.free') || 'Miễn phí') : `${p} WP`}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (isQueuing) return;
                      try {
                        await onEnterQueue(selectedMode, stake);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    disabled={isQueuing}
                    className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      selectedMode === 'daily' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-900/30' :
                      selectedMode === 'quick' ? 'bg-gradient-to-r from-rose-600 to-orange-600 shadow-rose-900/30' :
                      'bg-gradient-to-r from-amber-600 to-yellow-600 shadow-amber-900/30'
                    }`}
                  >
                    {isQueuing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={18} />
                        {stake > 0 
                          ? (t('battle.start_ranked_stake', { stake }) || `Bắt đầu xếp hạng — Cược ${stake} WP`) 
                          : (t('battle.start_ranked') || 'Bắt đầu xếp hạng')}
                        <ChevronRight size={16} className="opacity-60" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleModes;
