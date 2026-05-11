import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Beaker, Coffee, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';
import type { TipCategory } from './types';

interface QuickTipComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; postKind: 'tip'; extra: Record<string, any> }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: { key: TipCategory; label: string; icon: typeof Beaker; color: string }[] = [
  { key: 'science', label: 'Khoa học', icon: Beaker, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { key: 'practical', label: 'Mẹo vặt', icon: Coffee, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { key: 'recipe', label: 'Công thức', icon: ChefHat, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
];

export const QuickTipComposer = ({ profile, onPublish, onClose }: QuickTipComposerProps) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<TipCategory>('practical');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) { toast.error('Nhập nội dung mẹo hydration!'); return; }
    setIsPublishing(true);
    try {
      await onPublish({ content: text.trim(), postKind: 'tip', extra: { tip_category: category } });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative w-full max-w-md rounded-t-[2rem] border border-white/10 bg-slate-950/95 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">💡 Mẹo hydration</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400"><X size={18} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${category === cat.key ? cat.color : 'border-white/5 text-slate-500 hover:text-slate-300'}`}
            >
              <cat.icon size={14} />{cat.label}
            </button>
          ))}
        </div>


