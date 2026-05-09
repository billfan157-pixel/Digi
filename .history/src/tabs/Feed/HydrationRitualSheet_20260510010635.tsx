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
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/20 active:scale-[0.98] transition-all text-left group"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${ritual.bg} flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform`}>
                      <Icon size={22} className={ritual.accent} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{ritual.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{ritual.subtitle}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center`}>
                      <div className="w-3 h-3 rounded-full bg-transparent" />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Step 2: Ritual-specific UI */}
          <AnimatePresence mode="wait">
            {selectedRitual === 'baptism' && (
              <motion.div
                key="baptism"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Progress card */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Tiến độ hôm nay</span>
                    <span className="text-cyan-400 text-sm font-black">{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-slate-400 text-xs mt-2">{waterIntake} / {waterGoal} ml • Streak {streak} ngày</p>
                </div>

                {/* Image picker */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/40 transition-colors flex flex-col items-center justify-center gap-2 bg-slate-800/30 overflow-hidden group"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={22} className="text-cyan-400" />
                      </div>
                      <p className="text-slate-500 text-xs font-medium">Chụp ảnh chai nước / cốc nước</p>
                      <p className="text-slate-600 text-[10px]">Hoặc chọn từ thư viện</p>
                    </>
                  )}
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" capture="environment" onChange={handleImagePick} className="hidden" />

                {/* Optional text */}
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Cảm nhận của bạn về ly nước này? (không bắt buộc)"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 resize-none h-20"
                />
              </motion.div>
            )}

            {selectedRitual === 'ignition' && (
              <motion.div
                key="ignition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Streak preview */}
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-4 text-center">
                  <Flame size={32} className="mx-auto text-orange-400 mb-2" />
                  <p className="text-white text-lg font-black">Chuỗi {streak} ngày</p>
                  <p className="text-slate-400 text-xs mt-1">Chọn cảm xúc để đánh dấu cột mốc</p>
                </div>

                {/* Mood emoji picker */}
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Cảm xúc của bạn</p>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedMood(emoji)}
                        className={`w-11 h-11 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90 ${
                          selectedMood === emoji
                            ? 'bg-orange-500/20 border-2 border-orange-500/50 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                            : 'bg-slate-800/50 border border-white/10 hover:bg-slate-700/50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional text */}
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ghi chú thêm (không bắt buộc)..."
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 resize-none h-20"
                />
              </motion.div>
            )}

            {selectedRitual === 'duel' && (
              <motion.div
                key="duel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-2xl p-4 text-center">
                  <Swords size={32} className="mx-auto text-purple-400 mb-2" />
                  <p className="text-white text-sm font-bold">Thách đấu bạn bè</p>
                  <p className="text-slate-400 text-xs mt-1">Ai uống đủ nước trước sẽ thắng!</p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Viết lời thách đấu..."
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 resize-none h-20"
                />

                <p className="text-slate-500 text-[10px] text-center">
                  ⚔️ Chiến thư sẽ hiện trên feed — bạn bè có thể bấm "Nhận lời" để tham gia
                </p>
              </motion.div>
            )}

            {selectedRitual === 'wave' && (
              <motion.div
                key="wave"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <Droplets size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p className="text-white text-lg font-black">{progressPct}% mục tiêu</p>
                  <p className="text-slate-400 text-xs mt-1">Gửi tín hiệu hydration — bạn bè nhận được +25ml khi bấm vào</p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Lời nhắn (không bắt buộc)..."
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/40 resize-none h-20"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        {selectedRitual && (
          <div className="p-4 border-t border-white/10 bg-slate-900 shrink-0">
            <div className="flex gap-3">
              <button
                onClick={() => { reset(); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 text-sm font-bold active:scale-95 transition-all hover:bg-slate-700"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPublishing}
                className={`flex-[2] py-3.5 rounded-2xl text-sm font-black text-white active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${selectedRitualMeta?.gradient} shadow-lg`}
              >
                {isPublishing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Lan tỏa
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};