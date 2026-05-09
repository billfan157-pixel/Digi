import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Droplets, Flame, Swords, X, Send, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

interface RitualOption {
  kind: RitualKind;
  label: string;
  subtitle: string;
  description: string;
  gradient: string;
}

const RITUALS: RitualOption[] = [
  {
    kind: 'baptism',
    label: 'Baptism',
    subtitle: 'Chụp ảnh hydration',
    description: 'Ghi lại khoảnh khắc uống nước cùng tiến độ hôm nay',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
  },
  {
    kind: 'ignition',
    label: 'Ignition',
    subtitle: 'Cột mốc streak',
    description: 'Đánh dấu hành trình với biểu tượng cảm xúc',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
  },
  {
    kind: 'wave',
    label: 'Hydration Wave',
    subtitle: 'Lan tỏa nước',
    description: 'Báo hiệu hoàn thành mục tiêu cho bạn bè',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  {
    kind: 'duel',
    label: 'Duel',
    subtitle: 'Thách đấu bạn bè',
    description: 'Tạo chiến thư hydration trực tiếp trên feed',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
  },
];

const MOOD_EMOJIS = ['💪', '🔥', '🎯', '✨', '🙌', '💧', '🌟', '⚡'];

const RITUAL_META: Record<RitualKind, { gradient: string; border: string; accent: string }> = {
  baptism: { gradient: 'from-cyan-500 to-blue-500', border: 'border-cyan-500/40', accent: 'text-cyan-400' },
  ignition: { gradient: 'from-orange-500 to-amber-500', border: 'border-orange-500/40', accent: 'text-orange-400' },
  wave: { gradient: 'from-emerald-500 to-teal-500', border: 'border-emerald-500/40', accent: 'text-emerald-400' },
  duel: { gradient: 'from-purple-500 to-pink-500', border: 'border-purple-500/40', accent: 'text-purple-400' },
};

interface HydrationRitualSheetProps {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  onPublish: (params: {
    kind: RitualKind;
    content: string;
    imageUrl?: string;
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
  const [selectedKind, setSelectedKind] = useState<RitualKind | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setSelectedKind(null);
    setSelectedMood(null);
    setCustomText('');
    setImageFile(null);
    setImagePreview('');
  }, []);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ hỗ trợ ảnh!'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const progressPct = waterGoal > 0 ? Math.round(Math.min(100, (waterIntake / waterGoal) * 100)) : 0;
  const meta = selectedKind ? RITUAL_META[selectedKind] : null;

  const getContentPreview = () => {
    if (!selectedKind) return '';
    switch (selectedKind) {
      case 'baptism':
        return customText.trim() || (imagePreview ? '📸 Đã chụp ảnh hydration' : 'Khoảnh khắc hydration...');
      case 'ignition':
        return `${selectedMood || '💪'} ${customText.trim() || `Chuỗi ${streak} ngày`}`;
      case 'wave':
        return customText.trim() || `🌊 Đã hoàn thành ${progressPct}% mục tiêu!`;
      case 'duel':
        return customText.trim() || `⚔️ Thách đấu — ai uống đủ nước trước sẽ thắng!`;
    }
  };

  const handleSubmit = async () => {
    if (isPublishing) return;
    if (selectedKind === 'baptism' && !imageFile && !customText.trim()) {
      toast.error('Thêm ảnh hoặc viết gì đó để ghi lại khoảnh khắc!');
      return;
    }
    setIsPublishing(true);
    try {
      await onPublish({ kind: selectedKind!, content: getContentPreview(), imageUrl: imagePreview || undefined });
      reset();
      onClose();
    } catch { /* handled by parent */ }
    finally { setIsPublishing(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => { reset(); onClose(); }}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-md mx-auto bg-slate-900 rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Drag indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10 z-20" />

        {/* Header */}
        <div className="shrink-0 px-6 pt-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedKind && (
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {selectedKind ? RITUALS.find(r => r.kind === selectedKind)?.label : 'Nghi thức Hydration'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedKind ? 'Xác nhận để lan tỏa lên feed' : 'Chọn một nghi thức để chia sẻ'}
                </p>
              </div>
            </div>
            <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Ritual picker */}
          {!selectedKind && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
              {RITUALS.map((ritual) => (
                <button
                  key={ritual.kind}
                  onClick={() => setSelectedKind(ritual.kind)}
                  className="group relative w-full text-left p-4 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-white/20 active:scale-[0.99] transition-all overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${ritual.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{ritual.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{ritual.subtitle}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{ritual.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Specific ritual UI */}
          <AnimatePresence mode="wait">
            {selectedKind === 'baptism' && (
              <motion.div key="baptism" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                {/* Stats bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="text-cyan-400"><Droplets size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{waterIntake} / {waterGoal} ml</p>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400">{progressPct}%</span>
                </div>

                {/* Image */}
                <button onClick={() => imageInputRef.current?.click()} className="relative w-full aspect-[4/3] rounded-2xl border border-dashed border-slate-700 hover:border-cyan-500/40 transition-colors bg-slate-800/20 overflow-hidden group">
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
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