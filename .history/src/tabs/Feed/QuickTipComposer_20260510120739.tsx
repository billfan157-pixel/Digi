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
