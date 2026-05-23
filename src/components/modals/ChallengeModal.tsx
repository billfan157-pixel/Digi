import { X, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import ChallengesList from '@/components/ChallengesList';

export default function ChallengeModal() {
  const isOpen = useUIStore(s => s.showChallengeModal);
  const onClose = () => useUIStore.getState().setShowChallengeModal(false);
  const profile = useAppStore(s => s.profile);
  const userId = profile?.id || '';
  const userPoints = profile?.wp || 0;

  const handleChallengeJoined = (stakedWp: number) => {
    // Deduct staked WP locally for immediate UI update
    if (profile) {
      useAppStore.getState().setAppState({
        profile: {
          ...profile,
          wp: Math.max(0, profile.wp - stakedWp),
        },
      });
      // Trigger global event to refresh profile data
      window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl p-4"
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md overflow-hidden rounded-t-[2.5rem] sm:rounded-3xl border border-white/10 bg-slate-900 shadow-2xl max-h-[88vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="relative p-6 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-500/10 flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Target className="text-cyan-400" size={24} />
                Đấu trường Thử thách
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Wellness Points: <span className="text-yellow-400 font-black">{userPoints.toLocaleString()} WP</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <X size={18} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {userId && (
            <ChallengesList
              userId={userId}
              userPoints={userPoints}
              onChallengeJoined={handleChallengeJoined}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
