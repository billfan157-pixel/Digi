import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Droplets, Target, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useModalStore } from '@/store/useModalStore';

export default function FirstSessionChecklistModal() {
  const { t } = useTranslation();
  const show = useModalStore((s) => s.showFirstSessionChecklist);
  const setShow = useModalStore((s) => s.setShowFirstSessionChecklist);
  const setShowProfileSettings = useModalStore((s) => s.setShowProfileSettings);
  const setActiveTab = useModalStore((s) => s.setActiveTab);

  if (!show) return null;

  const openAddWater = () => {
    setActiveTab('home');
    window.dispatchEvent(new CustomEvent('openDrinkMenuFromWidget'));
    setShow(false);
  };

  const openReminderSettings = () => {
    setActiveTab('profile');
    setShowProfileSettings(true);
    setShow(false);
  };

  const openGoal = () => {
    setActiveTab('home');
    window.dispatchEvent(new CustomEvent('openHydrationGoal'));
    setShow(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 dark:bg-slate-950/65 backdrop-blur-sm"
          onClick={() => setShow(false)}
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          className="relative w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200 dark:border-white/10 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] p-6 pb-8"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                {t('first_session.quick_start')}
              </p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t('first_session.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t('first_session.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="p-2 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 active:scale-95 transition-all"
              aria-label="Đóng"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={openGoal}
              className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/20 p-4 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-300 flex items-center justify-center">
                  <Target size={18} aria-hidden />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">{t('first_session.set_goal')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{t('first_session.set_goal_desc')}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300">{t('first_session.open')}</span>
            </button>

            <button
              type="button"
              onClick={openAddWater}
              className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/20 p-4 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <Droplets size={18} aria-hidden />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">{t('first_session.log_water')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{t('first_session.log_water_desc')}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{t('first_session.add')}</span>
            </button>

            <button
              type="button"
              onClick={openReminderSettings}
              className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/20 p-4 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Bell size={18} aria-hidden />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">{t('first_session.enable_reminders')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{t('first_session.enable_reminders_desc')}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{t('first_session.enable')}</span>
            </button>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 active:scale-95 transition-all dark:bg-white/10 dark:hover:bg-white/15 border border-slate-900/10 dark:border-white/10"
            >
              {t('first_session.later')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

