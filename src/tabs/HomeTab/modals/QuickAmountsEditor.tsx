import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface QuickAmountsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  draftAmounts: [number, number, number];
  onDraftChange: (amounts: [number, number, number]) => void;
  onSave: () => void;
}

export default function QuickAmountsEditor({ 
  isOpen, 
  onClose, 
  draftAmounts, 
  onDraftChange, 
  onSave 
}: QuickAmountsEditorProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="editing-quick-amounts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
            className="relative w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute -top-1/4 left-0 w-full h-1/2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Settings size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">{t('home.customize_quick_add')}</h3>
                  <p className="text-slate-400 text-sm">{t('home.setup_favorite_volumes')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[0, 1, 2].map((index) => (
                  <div key={`quick-amount-${index}`} className="group">
                    <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {index + 1}
                      </div>
                      {t('home.level')} {index + 1}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="50"
                        max="1000"
                        value={draftAmounts[index] || ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value >= 0 && value <= 2000) {
                            const newDraft: [number, number, number] = [...draftAmounts];
                            newDraft[index] = value;
                            onDraftChange(newDraft);
                          }
                        }}
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-4 text-center text-white text-xl font-black focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-500"
                        placeholder="ml"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                        ml
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold transition-all hover:bg-white/10 border border-white/10"
                >
                  {t('home.cancel')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const parsed = draftAmounts.filter(n => !isNaN(n) && n >= 50 && n <= 2000);
                    if (parsed.length === 3) {
                      onSave();
                      onClose();
                      toast.success("✅ Đã cập nhật mức nạp nhanh!");
                    } else {
                      toast.error("⚠️ Vui lòng nhập 3 mức từ 50-2000ml");
                    }
                  }}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold transition-all hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  💾 {t('home.save_changes')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}