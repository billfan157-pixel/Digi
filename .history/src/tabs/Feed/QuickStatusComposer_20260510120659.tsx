import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

interface QuickStatusComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; imageUrl?: string; postKind: 'status' }) => Promise<void>;
  onClose: () => void;
}

export const QuickStatusComposer = ({ profile, onPublish, onClose }: QuickStatusComposerProps) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      toast.error('Nhập nội dung hoặc thêm ảnh!');
      return;
    }
    setIsPublishing(true);
    try {
      await onPublish({ content: text.trim() || '📸 Khoảnh khắc hydration', imageUrl: imagePreview || undefined, postKind: 'status' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative w-full max-w-md rounded-t-[2rem] border border-white/10 bg-slate-950/95 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Đăng status</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400"><X size={18} /></button>
        </div>

        <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder="Bạn đang nghĩ gì về hydration hôm nay?" className="w-full h-28 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 resize-none outline-none focus:border-cyan-500/30" autoFocus />

        {imagePreview && (
          <div className="relative mt-3 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="" className="w-full max-h-[300px] object-cover" />
            <button onClick={() => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImagePreview(''); }} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/70 rounded-full flex items-center justify-center text-white"><X size={14} /></button>
          </div>
        )}


