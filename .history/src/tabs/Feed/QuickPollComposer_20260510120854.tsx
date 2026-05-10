import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, PostPollOption } from '../../models';

interface QuickPollComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; postKind: 'poll'; extra: Record<string, any> }) => Promise<void>;
  onClose: () => void;
}

const DURATIONS = [
  { value: '1h', label: '1 giờ' },
  { value: '6h', label: '6 giờ' },
  { value: '24h', label: '24 giờ' },
];

export const QuickPollComposer = ({ profile, onPublish, onClose }: QuickPollComposerProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('24h');
  const [isPublishing, setIsPublishing] = useState(false);

  const addOption = () => {
    if (options.length >= 4) { toast.error('Tối đa 4 lựa chọn!'); return; }
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) { toast.error('Cần ít nhất 2 lựa chọn!'); return; }
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, val: string) => {
    setOptions(prev => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handleSubmit = async () => {
    const filled = options.filter(o => o.trim());
    if (!question.trim()) { toast.error('Nhập câu hỏi khảo sát!'); return; }
    if (filled.length < 2) { toast.error('Cần ít nhất 2 lựa chọn!'); return; }

    setIsPublishing(true);
    try {
      const pollOptions: PostPollOption[] = filled.map((text, idx) => ({
        id: `opt-${idx}`,
        text: text.trim(),
        count: 0,
      }));

      const expiresMs = duration === '1h' ? 3600000 : duration === '6h' ? 21600000 : 86400000;
      const pollExpiresAt = new Date(Date.now() + expiresMs).toISOString();

      await onPublish({
        content: question.trim(),
        postKind: 'poll',
        extra: {
          poll_options: pollOptions,
          poll_expires_at: pollExpiresAt,
        },
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
          <h3 className="text-white font-bold text-lg flex items-center gap-2">📋 Khảo sát</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400"><X size={18} /></button>
        </div>

        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Câu hỏi của bạn là gì?"
          className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/30 mb-4"
          autoFocus
        />

        <div className="space-y-2 mb-3">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">{idx + 1}</span>
              <input
                value={opt}
                onChange={e => updateOption(idx, e.target.value)}
                placeholder={`Lựa chọn ${idx + 1}`}
                className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/30"
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(idx)} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>

        {options.length < 4 && (
          <button onClick={addOption} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors mb-4">
            <Plus size={14} /> Thêm lựa chọn
          </button>
        )}

        <div className="flex gap-2 mb-4">
          {DURATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
