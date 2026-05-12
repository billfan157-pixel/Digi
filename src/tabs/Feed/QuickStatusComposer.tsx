import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Activity, Camera, Droplets, Flame, Globe2, Send, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuickStatusComposerProps {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  onPublish: (data: { content: string; imageUrl?: string; postKind: 'pulse'; visibility: 'public' | 'followers' }) => Promise<void>;
  onClose: () => void;
}

export const QuickStatusComposer = ({ waterIntake, waterGoal, streak, onPublish, onClose }: QuickStatusComposerProps) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers'>('followers');
  const [isPublishing, setIsPublishing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const progressPercent = Math.min(100, Math.round((waterIntake / Math.max(waterGoal, 1)) * 100));
  const presets = [
    `Đã đạt ${progressPercent}% mục tiêu hôm nay.`,
    'Cần thêm một nhịp nhắc nước.',
    'Vừa bù nước sau vận động.',
  ];

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
      toast.error('Viết ghi chú hoặc thêm ảnh.');
      return;
    }
    setIsPublishing(true);
    try {
      await onPublish({
        content: text.trim() || `Pulse ${waterIntake}/${waterGoal}ml hôm nay`,
        imageUrl: imagePreview || undefined,
        postKind: 'pulse',
        visibility,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative w-full max-w-md rounded-t-[2rem] border border-white/10 bg-slate-950/95 shadow-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Pulse</p>
              <h3 className="truncate text-lg font-black text-white">Cập nhật tiến độ</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 active:scale-95 transition-all"><X size={18} /></button>
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
          <p className="mt-3 text-xs font-semibold text-slate-400">Pulse nằm trên feed để bạn bè theo dõi tiến độ và động viên.</p>
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={140}
          placeholder="Viết một cập nhật ngắn về tiến độ uống nước..."
          className="w-full h-28 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 resize-none outline-none focus:border-cyan-500/30"
          autoFocus
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setText(preset)}
                className="shrink-0 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-300 active:scale-95 transition-all hover:border-cyan-500/30 hover:text-cyan-300"
              >
                {preset}
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[10px] font-bold text-slate-500">{text.length}/140</span>
        </div>

        {imagePreview && (
          <div className="relative mt-3 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="" className="w-full max-h-[300px] object-cover" />
            <button onClick={() => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImagePreview(''); }} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/70 rounded-full flex items-center justify-center text-white"><X size={14} /></button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 active:scale-95 transition-all">
              <Camera size={16} /><span className="text-xs font-bold">Thêm ảnh</span>
            </button>
            <div className="flex rounded-xl border border-white/10 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setVisibility('followers')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${visibility === 'followers' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}
                aria-label="Chỉ bạn bè"
              >
                <Users size={14} />
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${visibility === 'public' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}
                aria-label="Công khai"
              >
                <Globe2 size={14} />
              </button>
            </div>
          </div>
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
