import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
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
    subtitle: 'Capture hydration photo',
    description: 'Record your water drinking moment with today\'s progress.',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    icon: Camera,
  },
  {
    kind: 'ignition',
    label: 'Ignition',
    subtitle: 'Peak streak',
    description: 'Mark your journey with an outstanding emotion.',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    icon: Flame,
  },
  {
    kind: 'wave',
    label: 'Hydration Wave',
    subtitle: 'Spread the water',
    description: 'Signal goal completion to friends.',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    icon: Droplets,
  },
  {
    kind: 'duel',
    label: 'Duel',
    subtitle: 'Duel friends',
    description: 'Create a hydration challenge directly on the feed.',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    icon: Swords,
  },
];

function getRitualLabel(t: (k: string) => string, kind: RitualKind): string {
  const map: Record<RitualKind, string> = {
    baptism: t('feed.ritual_baptism'),
    ignition: t('feed.ritual_ignition'),
    wave: t('feed.ritual_wave'),
    duel: t('feed.ritual_duel'),
  };
  return map[kind];
}

function getRitualSubtitle(t: (k: string) => string, kind: RitualKind): string {
  const map: Record<RitualKind, string> = {
    baptism: t('feed.ritual_baptism_sub'),
    ignition: t('feed.ritual_ignition_sub'),
    wave: t('feed.ritual_wave_sub'),
    duel: t('feed.ritual_duel_sub'),
  };
  return map[kind];
}

function getRitualDescription(t: (k: string) => string, kind: RitualKind): string {
  const map: Record<RitualKind, string> = {
    baptism: t('feed.ritual_baptism_desc'),
    ignition: t('feed.ritual_ignition_desc'),
    wave: t('feed.ritual_wave_desc'),
    duel: t('feed.ritual_duel_desc'),
  };
  return map[kind];
}

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
  }) => Promise<void>;
  onClose: () => void;
}

export const HydrationRitualSheet = ({
  waterIntake,
  waterGoal,
  streak,
  onPublish,
  onClose,
}: HydrationRitualSheetProps) => {
  const { t } = useTranslation();
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
          (imagePreview ? t('feed.took_hydration_photo') : t('feed.hydration_moment'))
        );
      case 'ignition':
        return `${selectedMood || '💪'} ${customText.trim() || t('feed.streak_days', { days: streak })}`;
      case 'wave':
        return customText.trim() || t('feed.completed_goal_pct', { pct: progressPct });
      case 'duel':
        return (
          customText.trim() ||
          t('feed.duel_preview_default')
        );
      default:
        return '';
    }
  }, [customText, imagePreview, progressPct, selectedKind, selectedMood, streak, t]);

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
        toast.error(t('feed.images_only'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('feed.image_too_large'));
        return;
      }

      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    },
    [imagePreview, t]
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
      toast.error(t('feed.content_required'));
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({
        kind: selectedKind,
        content: previewText,
        imageUrl: imagePreview || undefined,
      });
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);

      reset();
      onClose();
    } catch {
      // handled by parent
    } finally {
      setIsPublishing(false);
    }
  }, [
    customText,
    imageFile,
    imagePreview,
    isPublishing,
    onClose,
    onPublish,
    previewText,
    reset,
    selectedKind,
    t,
  ]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 360 }}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-slate-950/95 shadow-2xl"
      >
        <div className="absolute left-1/2 top-3 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-white/10" />

        <div className="shrink-0 border-b border-white/5 px-5 pb-4 pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {selectedKind ? (
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
              ) : null}

              <div className="min-w-0">
                <h2 className="truncate text-base font-bold tracking-tight text-white">
                  {selectedRitual ? getRitualLabel(t, selectedRitual.kind) : t('feed.hydration_ritual_title')}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {selectedKind
                    ? t('feed.confirm_to_spread')
                    : t('feed.choose_ritual')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!selectedKind ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-3"
            >
              {RITUALS.map((ritual) => {
                const Icon = ritual.icon;

                return (
                  <button
                    key={ritual.kind}
                    type="button"
                    onClick={() => setSelectedKind(ritual.kind)}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-800/25 p-4 text-left transition-all hover:border-white/15 active:scale-[0.99]"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${ritual.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70">
                        <Icon size={18} className="text-slate-300" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">
                          {getRitualLabel(t, ritual.kind)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {getRitualSubtitle(t, ritual.kind)}
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                          {getRitualDescription(t, ritual.kind)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          ) : null}

          <AnimatePresence mode="wait">
            {selectedKind === 'baptism' && (
              <motion.div
                key="baptism"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between rounded-2xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-cyan-400">
                      <Droplets size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {waterIntake} / {waterGoal} ml
                      </p>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400">
                    {progressPct}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed border-slate-700 bg-slate-800/20 transition-colors hover:border-cyan-500/40"
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview photo"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur transition-colors hover:bg-slate-950"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50 transition-all group-hover:border-cyan-500/20 group-hover:bg-cyan-500/10">
                        <Camera
                          size={22}
                          className="text-slate-500 transition-colors group-hover:text-cyan-400"
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-500">
                        {t('feed.take_water_bottle_photo')}
                      </p>
                    </div>
                  )}
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImagePick}
                  className="hidden"
                />

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t('common.ritual_note_placeholder')}
                  className="h-20 w-full resize-none rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/30"
                />
              </motion.div>
            )}

            {selectedKind === 'ignition' && (
              <motion.div
                key="ignition"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 px-4 py-6 text-center">
                  <p className="text-4xl font-black tracking-tight text-white">
                    {streak}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-orange-400/80">
                    {t('feed.consecutive_days')}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {t('feed.choose_mood')}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {MOOD_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedMood(emoji)}
                      className={`aspect-square rounded-xl border text-xl transition-all ${
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
                  placeholder={t('common.extra_note_placeholder')}
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
                    {t('feed.goal_with_value', { goal: waterGoal })}
                  </p>
                  <p className="mx-auto mt-3 max-w-[200px] text-[10px] leading-relaxed text-slate-500">
                    {t('feed.hydration_signal_desc')}
                  </p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t('common.message_placeholder_optional')}
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
                    {t('feed.ritual_duel_friends')}
                  </p>
                  <p className="mt-1 text-xs text-purple-400/80">
                    {t('feed.ritual_duel_challenge_desc')}
                  </p>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t('common.duel_message_placeholder')}
                  className="h-20 w-full resize-none rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500/30"
                />

                <p className="text-center text-[10px] leading-relaxed text-slate-600">
                  {t('feed.challenge_letter_desc')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedKind && selectedRitual ? (
          <div className="shrink-0 border-t border-white/5 bg-slate-950/90 px-5 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <span className="text-xs font-medium text-slate-500">
                {t('feed.your_post')}
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
                  {t('feed.spread')}
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
