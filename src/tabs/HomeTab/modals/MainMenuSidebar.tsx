import {
  User,
  LogOut,
  X,
  Swords,
  ScrollText,
  Coins,
  Store,
  ShieldCheck,
  Sparkles,
  Activity,
  Target,
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
  const profile = useAppStore((state: { profile: unknown }) => state.profile) as Record<string, unknown> | null;
  const { setShowShopModal, setActiveTab, setCompeteSubTab, setShowQuestModal, setShowChallengeModal } =
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
                      level={Number(profile?.level) || 1}
                      avatarUrl={profile?.avatar_url as string | null ?? null}
                      nickname={String(profile?.nickname || '')}
                      showBadge={false}
                      frameId={profile?.equipped_frame_id as string | undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base leading-tight truncate">
                        {String(profile?.nickname || t('home.you'))}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Sparkles size={11} className="text-cyan-400 shrink-0" />
                        <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                          {t('home.level_prefix', { level: Number(profile?.level) || 1 })}
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
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-3.5">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-400/10 blur-[30px] rounded-full" />
                  <ShieldCheck size={16} className="text-emerald-400 mb-1.5" />
                  <span className="text-emerald-400 font-black text-lg block leading-none">
                    <CountUp value={Number(profile?.wp) || 0} />
                  </span>
                  <span className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest mt-1 block">
                    {t('home.sk_points')}
                  </span>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/15 p-3.5">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-400/10 blur-[30px] rounded-full" />
                  <Coins size={16} className="text-amber-400 mb-1.5" />
                  <span className="text-amber-400 font-black text-lg block leading-none">
                    <CountUp value={Number(profile?.coins) || 0} />
                  </span>
                  <span className="text-[9px] text-amber-400/60 font-bold uppercase tracking-widest mt-1 block">
                    {t('home.reward_points')}
                  </span>
                </div>
              </motion.div>

              {/* ── DIVIDER ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* ── NAV GROUP: Hành trình & Thi đua ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-1"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2.5 px-1">
                  {t('home.journey_competition')}
                </p>

                <SidebarButton
                  icon={<Swords size={16} className="text-rose-400" />}
                  label={t('home.competitive_challenges')}
                  highlight={t('home.fight')}
                  onClick={() => {
                    onClose();
                    setActiveTab('league');
                    setCompeteSubTab('battles');
                  }}
                />
                <SidebarButton
                  icon={<ScrollText size={16} className="text-purple-400" />}
                  label={t('home.quest_roadmap')}
                  highlight={t('home.quest')}
                  onClick={() => {
                    onClose();
                    setShowQuestModal(true);
                  }}
                />
                <SidebarButton
                  icon={<Target size={16} className="text-cyan-400" />}
                  label={t('home.challenge_arena')}
                  highlight={t('home.bet_wp')}
                  onClick={() => {
                    onClose();
                    setShowChallengeModal(true);
                  }}
                />
                <SidebarButton
                  icon={<Store size={16} className="text-amber-400" />}
                  label={t('home.health_store')}
                  highlight={t('home.shop')}
                  onClick={() => {
                    onClose();
                    setShowShopModal(true);
                  }}
                />
              </motion.div>

              {/* ── NAV GROUP: Hệ thống ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2.5 px-1">
                  {t('home.system')}
                </p>

                <SidebarButton
                  icon={<Activity size={16} className="text-sky-400" />}
                  label={t('home.settings')}
                  highlight={t('home.settings')}
                  onClick={() => {
                    onClose();
                    onSettings();
                  }}
                />
              </motion.div>
            </div>

            {/* ── Footer ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="px-4 pb-5 pt-3 border-t border-white/[0.04]"
            >
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-rose-300 bg-rose-500/8 border border-rose-500/15 hover:bg-rose-500/15 hover:border-rose-500/25 active:scale-[0.97] transition-all duration-150 font-bold text-sm"
              >
                <LogOut size={16} />
                {t('home.logout')}
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Reusable sidebar nav button ── */
function SidebarButton({
  icon,
  label,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-150 group"
    >
      <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
        {icon}
      </span>
      <span className="flex-1 text-left text-sm font-semibold">{label}</span>
      {highlight && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
          {highlight}
        </span>
      )}
    </button>
  );
}