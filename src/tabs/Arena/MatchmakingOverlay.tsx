import { useEffect, useState, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Swords, X, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '../../models';
import AvatarFrame from '@/components/AvatarFrame';

interface MatchmakingOverlayProps {
  queueStatus: { joinedAt: number; mode: string; stake: number } | null;
  profile: Profile | null;
  onCancel: () => void;
  matchedData: {
    battle_id: string;
    opponent_id: string;
    opponent_elo: number;
    opponent_nickname?: string;
    opponent_avatar_url?: string;
    opponent_level?: number;
  } | null;
  onMatchedAnimationComplete: () => void;
}

export default function MatchmakingOverlay({
  queueStatus,
  profile,
  onCancel,
  matchedData,
  onMatchedAnimationComplete,
}: MatchmakingOverlayProps) {
  const { t } = useTranslation();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = useMemo(() => [
    t('home.nudge.morning_msg', 'Uống một cốc nước ngay sau khi ngủ dậy giúp cơ thể bù nước và kích hoạt các cơ quan nội tạng.'),
    t('water.hydration_warning', 'Tránh uống quá 1000ml nước trong 1 giờ để không gây hạ natri máu.'),
    t('battle.matchmaking_tip_elo', 'Mỗi 30 giây chờ đợi, phạm vi ELO tìm kiếm sẽ mở rộng thêm 50 điểm để giúp bạn tìm trận nhanh hơn!'),
    t('battle.matchmaking_tip_wp', 'Wellness Points (WP) là thước đo sức khỏe của bạn. Hãy tích lũy WP qua việc hoàn thành các thử thách nước.'),
    t('battle.matchmaking_tip_quickadd', 'Nhấp vào bình nước của bạn ở trang chủ để nhanh chóng ghi nhận lượng nước vừa uống!'),
  ], [t]);

  const elapsed = useSyncExternalStore(
    (cb) => {
      if (!queueStatus || matchedData) return () => {};
      const timer = setInterval(cb, 1000);
      return () => clearInterval(timer);
    },
    () => {
      if (!queueStatus || matchedData) return 0;
      return Math.floor((Date.now() - queueStatus.joinedAt) / 1000);
    }
  );

  // Cycle tips every 6s
  useEffect(() => {
    if (matchedData) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tips.length, matchedData]);

  // Auto-finish matched animation after 3.5 seconds
  useEffect(() => {
    if (matchedData) {
      const timer = setTimeout(() => {
        onMatchedAnimationComplete();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [matchedData, onMatchedAnimationComplete]);

  if (!queueStatus && !matchedData) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const myWp = profile?.wp ?? 0;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[999] flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 max-w-md">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t('battle.arena', 'VÕ ĐÀI')} · {t('battle.ranked_queue', 'RANKED QUEUE')}
          </span>
          <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
            {matchedData ? t('battle.opponent_found_upper', 'ĐÃ TÌM THẤY ĐỐI THỦ!') : t('battle.matchmaking_searching', 'ĐANG TÌM ĐỐI THỦ...')}
          </h2>
        </div>
        {!matchedData && (
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-90 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Center Visuals */}
      <div className="w-full flex-1 flex flex-col items-center justify-center relative max-w-md z-10 my-8">
        <AnimatePresence mode="wait">
          {!matchedData ? (
            /* Matchmaking searching state */
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center w-full"
            >
              {/* Pulsing Radar Ring */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                {/* Outer animated radar waves */}
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-cyan-500/20 bg-cyan-500/[0.01]"
                    initial={{ width: 100, height: 100, opacity: 0.6 }}
                    animate={{ width: 220, height: 220, opacity: 0 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.9,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Inner scanner line */}
                <motion.div
                  className="absolute w-44 h-44 rounded-full border border-dashed border-cyan-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />

                {/* Core button with pulsing icon */}
                <div className="w-24 h-24 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
                  <Radar size={36} className="text-cyan-400 animate-pulse" />
                  <Loader2 size={88} className="absolute text-cyan-400/20 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>

              {/* Status details */}
              <div className="text-center space-y-3">
                <div className="inline-block bg-slate-900/60 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md">
                  <p className="text-2xl font-black text-white tabular-nums tracking-wide">{timeStr}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                    {t('battle.wait_time')}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t('common.mode')}: {queueStatus?.mode} {queueStatus?.stake && queueStatus.stake > 0 ? `· ${t('battle.stake')} ${queueStatus.stake} WP` : ''}
                  </p>
                  <p className="text-[10px] text-cyan-400/80 font-black tracking-wide uppercase">
                    WP {myWp}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Cinematic Match Found face-off state */
            <motion.div
              key="matched"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center w-full"
            >
              {/* White flash screen effect */}
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white z-[999] pointer-events-none rounded-3xl"
              />

              <div className="flex items-center justify-between w-full relative">
                {/* VS Glowing Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                >
                  <Swords size={20} className="text-white" />
                </motion.div>

                {/* Challenger Profile */}
                <motion.div
                  initial={{ x: -150, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                  className="w-[43%] flex flex-col items-center text-center p-4 rounded-2xl bg-slate-900/40 border border-cyan-500/20 shadow-lg shadow-cyan-500/5"
                >
                  <AvatarFrame
                    size="md"
                    level={profile?.level || 1}
                    avatarUrl={profile?.avatar_url ?? null}
                    nickname={profile?.nickname}
                    showBadge={false}
                    frameId={profile?.equipped_frame_id}
                  />
                  <h3 className="text-xs font-black text-white truncate max-w-full mt-3">
                    {profile?.nickname || t('common.you')}
                  </h3>
                  <div className="mt-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[8px] font-black text-cyan-400">
                      {profile?.wp || 0} WP
                    </span>
                  </div>
                </motion.div>

                {/* Opponent Profile */}
                <motion.div
                  initial={{ x: 150, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                  className="w-[43%] flex flex-col items-center text-center p-4 rounded-2xl bg-slate-900/40 border border-rose-500/20 shadow-lg shadow-rose-500/5"
                >
                  <AvatarFrame
                    size="md"
                    level={matchedData.opponent_level || 1}
                    avatarUrl={matchedData.opponent_avatar_url ?? null}
                    nickname={matchedData.opponent_nickname}
                    showBadge={false}
                  />
                  <h3 className="text-xs font-black text-white truncate max-w-full mt-3">
                    {matchedData.opponent_nickname || t('common.opponent')}
                  </h3>
                  <div className="mt-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[8px] font-black text-rose-400">
                      {matchedData.opponent_elo || 0} WP
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Ready Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-12 text-center"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] animate-pulse">
                  {t('battle.match_starting')}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Tips */}
      <div className="w-full max-w-md z-10 px-4 min-h-[60px] flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">{t('battle.useful_tips')}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTipIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] text-slate-400 font-bold leading-relaxed mt-0.5"
            >
              {tips[currentTipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
