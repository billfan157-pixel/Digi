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
                    <Coins size={20} className="text-amber-400" />
                    <span className="text-amber-400 font-black text-lg">
                      <CountUp value={profile?.coins || 0} />
                    </span>
                    <span className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest text-center">Điểm thưởng</span>
                  </div>
                </div>
              </div>

              {/* HÀNH TRÌNH SỨC KHỎE */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Hành trình & Thi đua</h4>
                <button onClick={() => { onClose(); setShowBattleArena(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-300 hover:hover:bg-slate-800/50 hover:hover:text-white active:scale-95 transition-all duration-200 ease-out border hover:border-white/5">
                  <Swords size={18} className="text-rose-400" /> Thử thách đối kháng
                </button>
                <button onClick={() => { onClose(); setShowQuestModal(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-300 hover:hover:bg-slate-800/50 hover:hover:text-white active:scale-95 transition-all duration-200 ease-out border hover:border-white/5">
                  <ScrollText size={18} className="text-purple-400" /> Lộ trình nhiệm vụ
                </button>
                <button onClick={() => { onClose(); setShowShopModal(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-300 hover:hover:bg-slate-800/50 hover:hover:text-white active:scale-95 transition-all duration-200 ease-out border hover:border-white/5">
                  <Store size={18} className="text-amber-400" /> Cửa hàng sức khỏe
                </button>
              </div>

              {/* HỆ THỐNG */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Hệ thống</h4>
                <button onClick={() => { onClose(); onSettings(); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-300 hover:hover:bg-slate-800/50 hover:hover:text-white active:scale-95 transition-all duration-200 ease-out border hover:border-white/5">
                <Settings size={18} className="text-slate-400" /> {t('home.settings')}
              </button>
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all duration-200 ease-out font-bold">
                <LogOut size={18} /> {t('home.logout')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}