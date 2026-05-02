import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useConfirmDialogStore } from '@/store/useConfirmDialog';

export default function ConfirmDialog() {
  const open = useConfirmDialogStore((s) => s.open);
  const options = useConfirmDialogStore((s) => s.options);
  const confirm = useConfirmDialogStore((s) => s.confirm);
  const cancel = useConfirmDialogStore((s) => s.cancel);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    },
    [cancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    // Auto-focus the confirm button for keyboard users
    requestAnimationFrame(() => confirmRef.current?.focus());
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  const isDanger = options.variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-sm"
          onClick={cancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10"
            style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            {isDanger && (
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
            )}

            {/* Title */}
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-white mb-2"
            >
              {options.title}
            </h3>

            {/* Message */}
            <p
              id="confirm-dialog-message"
              className="text-sm text-slate-400 leading-relaxed mb-6"
            >
              {options.message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancel}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all"
              >
                {options.cancelLabel || 'Hủy'}
              </button>
              <button
                ref={confirmRef}
                onClick={confirm}
                className={`flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all ${
                  isDanger
                    ? 'bg-red-500/90 text-white hover:bg-red-500'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {options.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
