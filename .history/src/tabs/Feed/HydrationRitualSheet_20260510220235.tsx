import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ChevronLeft,
  Droplets,
  Flame,
  Send,
  Swords,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

interface RitualOption {
  kind: RitualKind;
  label: string;
  subtitle: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
}

const RITUALS: RitualOption[] = [
  {
    kind: 'baptism',
    label: 'Baptism',
    subtitle: 'Chụp ảnh hydration',
    description: 'Ghi lại khoảnh khắc uống nước cùng tiến độ hôm nay.',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    icon: Camera,
  },
  {
    kind: 'ignition',
    label: 'Ignition',
    subtitle: 'Cột mốc streak',
    description: 'Đánh dấu hành trình với một cảm xúc nổi bật.',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    icon: Flame,
  },
  {
    kind: 'wave',
    label: 'Hydration Wave',
    subtitle: 'Lan tỏa nước',
    description: 'Báo hiệu hoàn thành mục tiêu cho bạn bè.',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    icon: Droplets,
  },
  {
    kind: 'duel',
    label: 'Duel',
    subtitle: 'Thách đấu bạn bè',
    description: 'Tạo chiến thư hydration trực tiếp trên feed.',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    icon: Swords,
  },
];

const MOOD_EMOJIS = ['💪', '🔥', '🎯', '✨', '🙌', '💧', '🌟', '⚡'];

const RITUAL_META: Record<
  RitualKind,
  { gradient: string; border: string; accent: string }
> = {
  baptism: {
    gradient: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-400',
  },
  ignition: {
    gradient: 'from-orange-500 to-amber-500',
    border: 'border-orange-500/30',
    accent: 'text-orange-400',
  },
  wave: {
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  duel: {
    gradient: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/30',
    accent: 'text-purple-400',
  },
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

  const selectedRitual = useMemo(
    () => RITUALS.find((ritual) => ritual.kind === selectedKind) ?? null,
    [selectedKind]
  );

  const progressPct = useMemo(() => {
    if (waterGoal <= 0) return 0;
    return Math.round(Math.min(100, (waterIntake / waterGoal) * 100));
  }, [waterIntake, waterGoal]);

  const previewText = useMemo(() => {
    if (!selectedKind) return '';

    switch (selectedKind) {
      case 'baptism':
        return (
          customText.trim() ||
          (imagePreview ? '📸 Đã chụp ảnh hydration' : 'Khoảnh khắc hydration...')
        );
      case 'ignition':
        return `${selectedMood || '💪'} ${customText.trim() || `Chuỗi ${streak} ngày`}`;
      case 'wave':
        return customText.trim() || `🌊 Đã hoàn thành ${progressPct}% mục tiêu!`;
      case 'duel':
        return (
          customText.trim() ||
          '⚔️ Thách đấu — ai uống đủ nước trước sẽ thắng!'
        );
      default:
        return '';
    }
  }, [customText, imagePreview, progressPct, selectedKind, selectedMood, streak]);

  const reset = useCallback(() => {
    setSelectedKind(null);
    setSelectedMood(null);
    setCustomText('');
    setImageFile(null);

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
  }, [imagePreview]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImagePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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

      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    },
    [imagePreview]
  );

  const handleRemoveImage = useCallback(() => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
  }, [imagePreview]);

  const handleSubmit = useCallback(async () => {
    if (isPublishing || !selectedKind) return;

    if (selectedKind === 'baptism' && !imageFile && !customText.trim()) {
      toast.error('Thêm ảnh hoặc viết gì đó để ghi lại khoảnh khắc!');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({
        kind: selectedKind,
        content: previewText,
        imageUrl: imagePreview || undefined,
      });
      setImagePreview('');
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ChevronLeft,
  Droplets,
  Flame,
  Send,
  Swords,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

interface RitualOption {
  kind: RitualKind;
  label: string;
  subtitle: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
}

const RITUALS: RitualOption[] = [
  {
    kind: 'baptism',
    label: 'Baptism',
    subtitle: 'Chụp ảnh hydration',
    description: 'Ghi lại khoảnh khắc uống nước cùng tiến độ hôm nay.',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    icon: Camera,
  },
  {
    kind: 'ignition',
    label: 'Ignition',
    subtitle: 'Cột mốc streak',
    description: 'Đánh dấu hành trình với một cảm xúc nổi bật.',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    icon: Flame,
  },
  {
    kind: 'wave',
    label: 'Hydration Wave',
    subtitle: 'Lan tỏa nước',
    description: 'Báo hiệu hoàn thành mục tiêu cho bạn bè.',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    icon: Droplets,
  },
  {
    kind: 'duel',
    label: 'Duel',
    subtitle: 'Thách đấu bạn bè',
    description: 'Tạo chiến thư hydration trực tiếp trên feed.',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    icon: Swords,
  },
];

const MOOD_EMOJIS = ['💪', '🔥', '🎯', '✨', '🙌', '💧', '🌟', '⚡'];

const RITUAL_META: Record<
  RitualKind,
  { gradient: string; border: string; accent: string }
> = {
  baptism: {
    gradient: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-400',
  },
  ignition: {
    gradient: 'from-orange-500 to-amber-500',
    border: 'border-orange-500/30',
    accent: 'text-orange-400',
  },
  wave: {
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  duel: {
    gradient: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/30',
    accent: 'text-purple-400',
  },
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

  const selectedRitual = useMemo(
    () => RITUALS.find((ritual) => ritual.kind === selectedKind) ?? null,
    [selectedKind]
  );

  const progressPct = useMemo(() => {
    if (waterGoal <= 0) return 0;
    return Math.round(Math.min(100, (waterIntake / waterGoal) * 100));
  }, [waterIntake, waterGoal]);

  const previewText = useMemo(() => {
    if (!selectedKind) return '';

    switch (selectedKind) {
      case 'baptism':
        return (
          customText.trim() ||
          (imagePreview ? '📸 Đã chụp ảnh hydration' : 'Khoảnh khắc hydration...')
        );
      case 'ignition':
        return `${selectedMood || '💪'} ${customText.trim() || `Chuỗi ${streak} ngày`}`;
      case 'wave':
        return customText.trim() || `🌊 Đã hoàn thành ${progressPct}% mục tiêu!`;
      case 'duel':
        return (
          customText.trim() ||
          '⚔️ Thách đấu — ai uống đủ nước trước sẽ thắng!'
        );
      default:
        return '';
    }
  }, [customText, imagePreview, progressPct, selectedKind, selectedMood, streak]);

  const reset = useCallback(() => {
    setSelectedKind(null);
    setSelectedMood(null);
    setCustomText('');
    setImageFile(null);

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
  }, [imagePreview]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImagePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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

      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    },
    [imagePreview]
  );

  const handleRemoveImage = useCallback(() => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
  }, [imagePreview]);

  const handleSubmit = useCallback(async () => {
    if (isPublishing || !selectedKind) return;

    if (selectedKind === 'baptism' && !imageFile && !customText.trim()) {
      toast.error('Thêm ảnh hoặc viết gì đó để ghi lại khoảnh khắc!');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({
        kind: selectedKind,
        content: previewText,
        imageUrl
                        selectedMood === emoji
                          ? 'border-orange-500/40 bg-orange-500/15 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                          : 'border-white/5 bg-slate-800/40 hover:border-white/20 hover:bg-slate-700/40'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ghi chú thêm (không bắt buộc)..."
                  className="h-20 w-full resize-none rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-orange-500/30"
                />
              </motion.div>
            )}

            {selectedKind === 'wave' && (
              <motion.div
                key="wave"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-6 text-center">
                  <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <Droplets size={28} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{waterIntake} ml</p>
                  <p className="mt-1 text-xs text-emerald-400/80">
                    Mục tiêu: {waterGoal} ml
                  </p>
                  <p className="mx-auto mt-3 max-w-[200px] text-[10px] leading-relaxed text-slate-500">
                    Gửi tín hiệu hydration — bạn bè nhận được +25ml khi bấm vào.
                  </p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Lời nhắn (không bắt buộc)..."
                  className="h-20 w-full resize-none rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500/30"
                />
              </motion.div>
            )}

            {selectedKind === 'duel' && (
              <motion.div
                key="duel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 px-4 py-6 text-center">
                  <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                    <Swords size={28} className="text-purple-400" />
                  </div>
                  <p className="text-base font-bold text-white">
                    Thách đấu bạn bè
                  </p>
                  <p className="mt-1 text-xs text-purple-400/80">
                    Ai uống đủ nước trước sẽ thắng!
                  </p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Viết lời thách đấu..."
                  className="h-20 w-full resize-none rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500/30"
                />

                <p className="text-center text-[10px] leading-relaxed text-slate-600">
                  Chiến thư sẽ hiện trên feed — bạn bè có thể bấm “Nhận lời” để tham gia.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedKind && selectedRitual ? (
          <div className="shrink-0 border-t border-white/5 bg-slate-950/90 px-5 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <span className="text-xs font-medium text-slate-500">
                Bài viết của bạn
              </span>
              <span className="max-w-[210px] truncate text-xs text-slate-400">
                {previewText}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPublishing}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${selectedRitual.kind === 'baptism'
                ? 'from-cyan-500 to-blue-500'
                : selectedRitual.kind === 'ignition'
                  ? 'from-orange-500 to-amber-500'
                  : selectedRitual.kind === 'wave'
                    ? 'from-emerald-500 to-teal-500'
                    : 'from-purple-500 to-pink-500'
                } py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isPublishing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Send size={15} />
                  Lan tỏa
                </>
              )}
            </button>
          </div>
        ) : null}

        <div className="h-4 shrink-0" />
      </motion.div>
    </div>
  );
};