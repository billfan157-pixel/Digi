import { User, Settings, LogOut, X } from 'lucide-react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MainMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function MainMenuSidebar({ isOpen, onClose, onProfile, onSettings, onLogout }: MainMenuSidebarProps) {
  const { t } = useTranslation();

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
            <div className="p-4 space-y-2 flex-1">
              <button onClick={() => { onClose(); onProfile(); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
                <User size={18} className="text-cyan-500 dark:text-cyan-400" /> {t('home.profile')}
              </button>
              <button onClick={() => { onClose(); onSettings(); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-200 ease-out">
                <Settings size={18} className="text-slate-500 dark:text-slate-400" /> {t('home.settings')}
              </button>
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