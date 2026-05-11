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
