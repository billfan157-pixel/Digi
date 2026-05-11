import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Droplets, Flame, Swords, X, Image as ImageIcon, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';
import type { SocialComposerKind } from './types';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

interface RitualOption {
  kind: RitualKind;
  label: string;
  subtitle: string;
  icon: typeof Droplets;
  gradient: string;
  accent: string;
  bg: string;
}

const RITUALS: RitualOption[] = [
  {
    kind: 'baptism',
    label: 'Chụp ảnh hydration',
    subtitle: 'Ghi lại khoảnh khắc uống nước',
    icon: Camera,
    gradient: 'from-cyan-500 to-blue-500',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    kind: 'ignition',
    label: 'Đánh dấu cột mốc',
    subtitle: 'Kỷ niệm streak hoặc tiến độ',
    icon: Flame,
    gradient: 'from-orange-500 to-amber-500',
    accent: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    kind: 'duel',
    label: 'Gửi chiến thư',
    subtitle: 'Thách đấu bạn bè uống nước',
    icon: Swords,
    gradient: 'from-purple-500 to-pink-500',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    kind: 'wave',
    label: 'Lan tỏa nước',
    subtitle: 'Báo hiệu hoàn thành mục tiêu',
    icon: Droplets,
    gradient: 'from-emerald-500 to-teal-500',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

// Emoji moods for Ignition ritual
const MOOD_EMOJIS = ['💪', '🔥', '🎯', '✨', '🙌', '💧', '🌟', '⚡'];

interface HydrationRitualSheetProps {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  onPublish: (params: {
    kind: RitualKind;
    content: string;
    imageUrl?: string;
    moodEmoji?: string;
    opponentId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const HydrationRitualSheet = ({
  profile,
  waterIntake,
  waterGoal,
  streak,
  onPublish,
  onClose,
}: HydrationRitualSheetProps) => {
  const [selectedRitual, setSelectedRitual] = useState<RitualKind | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSelectedRitual(null);
    setSelectedMood(null);
    setCustomText('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const progressPct = waterGoal > 0 ? Math.round(Math.min(100, (waterIntake / waterGoal) * 100)) : 0;

  const handleSubmit = async () => {
    if (isPublishing) return;

    if (selectedRitual === 'baptism' && !imageFile && !customText.trim()) {
      toast.error('Chụp ảnh hoặc viết gì đó để ghi lại khoảnh khắc!');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({
        kind: selectedRitual || 'baptism',
        content: selectedRitual === 'ignition'
          ? `${selectedMood || '💪'} ${customText.trim() || `Chuỗi ${streak} ngày đang bùng cháy!`}`
          : customText.trim() || '',
        imageUrl: imagePreview || undefined,
        moodEmoji: selectedMood || undefined,
      });
      reset();
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedRitualMeta = RITUALS.find(r => r.kind === selectedRitual);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-h-[90vh] rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 rounded-t-3xl shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg">
              {selectedRitual ? (
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedRitualMeta?.bg}`} />
                  {selectedRitualMeta?.label}
                </span>
              ) : 'Nghi thức Hydration'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {selectedRitual ? 'Xác nhận để lan tỏa' : 'Chọn một nghi thức'}
            </p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-white p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1: Pick ritual */}
          {!selectedRitual && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
              {RITUALS.map((ritual) => {
                const Icon = ritual.icon;
                return (
                  <button
                    key={ritual.kind}
                    onClick={() => setSelectedRitual(ritual.kind)}
