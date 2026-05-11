import {
  User,
  Settings,
  LogOut,
  X,
  Swords,
  ScrollText,
  Coins,
  Store,
  ShieldCheck,
  Sparkles,
  Activity,
} from 'lucide-react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import CountUp from '@/components/CountUp';
import AvatarFrame from '@/components/AvatarFrame';

interface MainMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function MainMenuSidebar({
  isOpen,
  onClose,
  onProfile,
  onSettings,
  onLogout,
}: MainMenuSidebarProps) {
  const { t } = useTranslation();
  const profile = useAppStore((state: any) => state.profile);
  const { setShowShopModal, setShowBattleArena, setShowQuestModal } =
    useUIStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="main-menu-sidebar" className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop nền tối + hiệu ứng blur mạnh */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="relative w-72 h-full bg-slate-900/80 backdrop-blur-2xl border-l border-white/[0.06] shadow-[-8px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* ── Header ── */}
            <div className="relative px-5 pt-6 pb-4 border-b border-white/[0.04]">
              {/* Decoration glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg tracking-tight">
                  {t('home.menu_title')}
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.10] active:scale-90 transition-all duration-150"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-5 pb-3 space-y-6">
              {/* ── USER CARD ── */}
              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <button
                    onClick={() => {
                      onClose();
                      onProfile();
                    }}
                    className="w-full flex items-center gap-3.5 bg-gradient-to-br from-slate-800/60 to-slate-800/30 p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] active:scale-[0.97] transition-all duration-150 text-left shadow-sm"
                  >
                    <AvatarFrame
                      size="md"
                      level={profile.level || 1}
                      avatarUrl={profile?.avatar_url ?? null}
                      nickname={profile.nickname}
                      showBadge={false}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight truncate">
                        {profile.nickname || t('home.you')}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Sparkles size={11} className="text-cyan-400 shrink-0" />
                        <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                          Cấp {profile.level || 1}
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                      <User size={12} className="text-slate-400" />
                    </div>
                  </button>
                </motion.div>
              )}

              {/* ── STATS ROW ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-2.5"
              >
