import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Camera, Droplets, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface QuickStatusComposerProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  onPublish: (data: { content: string; imageUrl?: string; postKind: 'pulse' }) => Promise<void>;
  onClose: () => void;
}

export const QuickStatusComposer = ({ waterIntake, waterGoal, streak, onPublish, onClose }: QuickStatusComposerProps) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressPercent = Math.min(100, Math.round((waterIntake / Math.max(waterGoal, 1)) * 100));

  const handleImagePick = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  }, [imagePreview]);

  const handleSubmit = async () => {
    if (!text.trim() && !imagePreview) {
      toast.error('Viết ghi chú hoặc thêm Proof.');
      return;
    }
    setIsPublishing(true);
    try {
      await onPublish({
        content: text.trim() || `Pulse ${waterIntake}/${waterGoal}ml hôm nay`,
        imageUrl: imagePreview || undefined,
        postKind: 'pulse',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative w-full max-w-md rounded-t-[2rem] border border-white/10 bg-slate-950/95 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Pulse</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400"><X size={18} /></button>
        </div>

        <div className="mb-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Droplets size={15} />
              {waterIntake}/{waterGoal}ml
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-300">
              <Flame size={15} />
              {streak} ngày
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ghi chú ngắn cho Pulse hôm nay..."
          className="w-full h-28 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 resize-none outline-none focus:border-cyan-500/30"
          autoFocus
        />

        {imagePreview && (
          <div className="relative mt-3 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="" className="w-full max-h-[300px] object-cover" />
            <button onClick={() => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImagePreview(''); }} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/70 rounded-full flex items-center justify-center text-white"><X size={14} /></button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 active:scale-95 transition-all">
            <Camera size={16} /><span className="text-xs font-bold">Thêm Proof</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          <button onClick={handleSubmit} disabled={isPublishing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold active:scale-95 disabled:opacity-50 transition-all">
            {isPublishing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={16} />}
            {isPublishing ? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
