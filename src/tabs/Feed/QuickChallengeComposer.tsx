import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Swords, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

interface QuickChallengeComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; postKind: 'duel' }) => Promise<void>;
  onClose: () => void;
}

export const QuickChallengeComposer = ({ onPublish, onClose }: QuickChallengeComposerProps) => {
  const [text, setText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content) {
      toast.error('Viết lời Duel trước khi đăng.');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({ content, postKind: 'duel' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative w-full max-w-md rounded-t-[2rem] border border-purple-500/20 bg-slate-950/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
              <Swords size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tạo Duel</h3>
              <p className="text-xs text-slate-500">Chỉ bạn bè mới xem và nhận lời.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Ví dụ: Ai đạt 2 lít trước 18:00 hôm nay không?"
          className="h-32 w-full resize-none rounded-2xl border border-white/5 bg-slate-800/50 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/30"
          autoFocus
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPublishing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {isPublishing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={16} />}
          {isPublishing ? 'Đang đăng...' : 'Đăng Duel'}
        </button>
      </motion.div>
    </div>
  );
};
