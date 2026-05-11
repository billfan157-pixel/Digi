import { User, Settings, LogOut, X, Swords, ScrollText, Coins, Store, ShieldCheck } from 'lucide-react';
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

export default function MainMenuSidebar({ isOpen, onClose, onProfile, onSettings, onLogout }: MainMenuSidebarProps) {
  const { t } = useTranslation();
  const profile = useAppStore((state: any) => state.profile);
  const { setShowShopModal, setShowBattleArena, setShowQuestModal } = useUIStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="main-menu-sidebar" className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-64 h-full bg-slate-100 dark:bg-slate-900/90 backdrop-blur-xl border-l border-slate-300 dark:border-white/5 shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-300 dark:border-white/5">
              <h2 className="text-slate-900 dark:text-white font-black text-lg">{t('home.menu_title')}</h2>
              <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-white/5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
              
              {/* THẺ NGƯỜI DÙNG */}
              {profile && (
                <div 
                  onClick={() => { onClose(); onProfile(); }}
                  className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all shadow-sm"
                >
                  <AvatarFrame 
                    size="sm" 
                    level={profile.level || 1} 
                    avatarUrl={profile?.avatar_url ?? null} 
                    nickname={profile.nickname} 
                    showBadge={false} 
                  />
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight">{profile.nickname || t('home.you')}</h3>
                    <p className="text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Cấp độ {profile.level || 1}</p>
                  </div>
                </div>
              )}

              {/* ĐIỂM SỐ Y KHOA & PHẦN THƯỞNG */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Chỉ số cá nhân</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm">
                    <ShieldCheck size={20} className="text-emerald-500 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-black text-lg">
                      <CountUp value={profile?.wp || 0} />
                    </span>
                    <span className="text-[9px] text-emerald-600/80 dark:text-emerald-500/70 font-bold uppercase tracking-widest text-center">Điểm sức khỏe</span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm">
                    <Coins size={20} className="text-amber-500 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-400 font-black text-lg">
                      <CountUp value={profile?.coins || 0} />
                    </span>
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-500/70 font-bold uppercase tracking-widest text-center">Điểm thưởng</span>
                  </div>
                </div>
              </div>

              {/* HÀNH TRÌNH SỨC KHỎE */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Hành trình & Thi đua</h4>
                <button onClick={() => { onClose(); setShowBattleArena(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out border border-transparent dark:hover:border-white/5">
                  <Swords size={18} className="text-rose-500 dark:text-rose-400" /> Thử thách đối kháng
                </button>
                <button onClick={() => { onClose(); setShowQuestModal(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out border border-transparent dark:hover:border-white/5">
                  <ScrollText size={18} className="text-purple-500 dark:text-purple-400" /> Lộ trình nhiệm vụ
                </button>
                <button onClick={() => { onClose(); setShowShopModal(true); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out border border-transparent dark:hover:border-white/5">
                  <Store size={18} className="text-amber-500 dark:text-amber-400" /> Cửa hàng sức khỏe
                </button>
              </div>

              {/* HỆ THỐNG */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Hệ thống</h4>
                <button onClick={() => { onClose(); onSettings(); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out border border-transparent dark:hover:border-white/5">
                <Settings size={18} className="text-slate-500 dark:text-slate-400" /> {t('home.settings')}
              </button>
              </div>
            </div>
            <div className="p-4 border-t border-slate-300 dark:border-white/5">
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