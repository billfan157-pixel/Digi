import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Coins, Droplets, Flame, Send, Swords, Target, X, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

interface QuickChallengeComposerProps {
  profile: Profile;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  onPublish: (data: { content: string; postKind: 'duel'; extra?: Record<string, unknown> }) => Promise<void>;
  onClose: () => void;
}

type DuelPresetId = 'goal' | 'sprint' | 'streak';

const duelPresets: Array<{
  id: DuelPresetId;
  label: string;
  description: string;
  icon: LucideIcon;
  targetMl: number;
  deadline: string;
  prompt: string;
}> = [
  {
    id: 'goal',
    label: 'Goal Race',
    description: 'First to reach water goal wins.',
    icon: Target,
    targetMl: 2000,
    deadline: '22:00 today',
    prompt: 'Who can reach their water goal today before me?',
  },
  {
    id: 'sprint',
    label: 'Quick Sprint',
    description: 'A short round to chug water together.',
    icon: Droplets,
    targetMl: 500,
    deadline: '60 minutes',
    prompt: 'Sprint 500ml in 60 minutes, who\'s in?',
  },
  {
    id: 'streak',
    label: 'Keep Streak',
    description: 'Challenge each other not to break today\'s streak.',
    icon: Flame,
    targetMl: 1500,
    deadline: 'end of day',
    prompt: 'Who can keep their water streak until end of day with me?',
  },
];

const stakeOptions = [0, 25, 50, 100];

function formatTimeHourMin(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function defaultDeadlineFromPreset(preset: typeof duelPresets[0]): { time: string; day: 'today' | 'tomorrow' } {
  if (preset.deadline === '22:00 today') return { time: '22:00', day: 'today' };
  if (preset.deadline === 'end of day') return { time: '23:59', day: 'today' };
  if (preset.deadline === '60 minutes') {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return { time: formatTimeHourMin(d), day: 'today' };
  }
  return { time: '23:59', day: 'today' };
}

function formatDeadlineLabel(time: string, day: 'today' | 'tomorrow'): string {
  return `${time} ${day === 'today' ? 'today' : 'tomorrow'}`;
}

export const QuickChallengeComposer = ({ waterIntake, waterGoal, streak, onPublish, onClose }: QuickChallengeComposerProps) => {
  const { t } = useTranslation();
  const [selectedPresetId, setSelectedPresetId] = useState<DuelPresetId>('goal');
  const selectedPreset = duelPresets.find(preset => preset.id === selectedPresetId) || duelPresets[0];
  const [text, setText] = useState('');
  const [targetMl, setTargetMl] = useState(String(selectedPreset.targetMl));
  const defaultDeadline = defaultDeadlineFromPreset(selectedPreset);
  const [deadlineTime, setDeadlineTime] = useState(defaultDeadline.time);
  const [deadlineDay, setDeadlineDay] = useState<'today' | 'tomorrow'>(defaultDeadline.day);
  const [stakeCoins, setStakeCoins] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const progressPercent = Math.min(100, Math.round((waterIntake / Math.max(waterGoal, 1)) * 100));

  const handlePresetChange = (presetId: DuelPresetId) => {
    const nextPreset = duelPresets.find(preset => preset.id === presetId) || duelPresets[0];
    setSelectedPresetId(presetId);
    setTargetMl(String(nextPreset.targetMl));
    const dd = defaultDeadlineFromPreset(nextPreset);
    setDeadlineTime(dd.time);
    setDeadlineDay(dd.day);
    if (!text.trim() || duelPresets.some(preset => preset.prompt === text.trim())) {
      setText(nextPreset.prompt);
    }
  };

  function computeDeadline(deadlineTime: string, deadlineDay: 'today' | 'tomorrow'): string {
    const [h, m] = deadlineTime.split(':').map(Number);
    const d = new Date();
    if (deadlineDay === 'tomorrow') d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  const handleSubmit = async () => {
    const challengeText = text.trim() || selectedPreset.prompt;
    const normalizedTarget = Math.max(250, Math.min(5000, Math.round((Number(targetMl) || 0) / 50) * 50));
    const normalizedStake = Math.max(0, Math.min(1000, stakeCoins));
    const deadlineLabel = formatDeadlineLabel(deadlineTime, deadlineDay);
    const deadlineISO = computeDeadline(deadlineTime, deadlineDay);
    const content = [
      challengeText,
      `Goal: ${normalizedTarget}ml`,
      `Deadline: ${deadlineLabel}`,
      `Duel type: ${selectedPreset.label}`,
      `Honor stake: ${normalizedStake > 0 ? `${normalizedStake} coins` : 'no coins'}`,
    ].join('\n');

    if (!content) {
      toast.error(t('feed.duel_content_required'));
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish({
        content,
        postKind: 'duel',
        extra: {
          hydration_ml: normalizedTarget,
          streak_snapshot: streak,
          target_ml: normalizedTarget,
          deadline: deadlineISO,
          mode: selectedPreset.label,
        },
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 360 }} className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-purple-500/20 bg-slate-950/95 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl scrollbar-hide">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
              <Swords size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Water Duel</p>
              <h3 className="truncate text-lg font-black text-white">Create Duel Challenge</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-purple-500/15 bg-purple-500/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Droplets size={15} />
              {waterIntake}/{waterGoal}ml
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-300">
              <Flame size={15} />
              {streak} days
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">Duel only shows to friends so they can accept and create a water drinking match.</p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {duelPresets.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handlePresetChange(id)}
              className={`rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                selectedPresetId === id
                  ? 'border-purple-400/50 bg-purple-500/15 text-white shadow-[0_0_18px_rgba(168,85,247,0.15)]'
                  : 'border-white/5 bg-slate-900/60 text-slate-400 hover:border-purple-500/25'
              }`}
            >
              <Icon size={17} className={selectedPresetId === id ? 'text-purple-300' : 'text-slate-500'} />
              <p className="mt-2 text-[10px] font-black uppercase tracking-tight">{label}</p>
              <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-snug opacity-70">{description}</p>
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          maxLength={160}
          placeholder={selectedPreset.prompt}
          className="h-28 w-full resize-none rounded-2xl border border-white/5 bg-slate-800/50 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/30"
          autoFocus
        />
        <div className="mt-2 flex justify-end">
          <span className="text-[10px] font-bold text-slate-500">{text.length}/160</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300">
              <Target size={13} />
              Goal
            </span>
            <input
              type="number"
              value={targetMl}
              onChange={event => setTargetMl(event.target.value)}
              className="w-full bg-transparent text-lg font-black text-white outline-none"
            />
            <span className="text-[10px] font-bold text-slate-500">ml</span>
          </label>

          <label className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300">
              <Clock size={13} />
              Deadline
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <div className="flex flex-col items-center">
                  <button type="button" onClick={() => setDeadlineTime(p => { const [h, m] = p.split(':'); return `${String((+h + 1) % 24).padStart(2, '0')}:${m}`; })} className="flex h-5 w-8 items-center justify-center rounded-t-lg border border-white/5 bg-slate-800/80 text-white/60 hover:text-white active:scale-95 transition-all">
                    <ChevronUp size={12} />
                  </button>
                  <span className="flex h-8 w-8 items-center justify-center text-base font-black text-white tabular-nums">{deadlineTime.split(':')[0]}</span>
                  <button type="button" onClick={() => setDeadlineTime(p => { const [h, m] = p.split(':'); return `${String((+h + 23) % 24).padStart(2, '0')}:${m}`; })} className="flex h-5 w-8 items-center justify-center rounded-b-lg border border-white/5 bg-slate-800/80 text-white/60 hover:text-white active:scale-95 transition-all">
                    <ChevronDown size={12} />
                  </button>
                </div>
                <span className="text-lg font-black text-slate-500 mt-5">:</span>
                <div className="flex flex-col items-center">
                  <button type="button" onClick={() => setDeadlineTime(p => { const [h, m] = p.split(':'); const next = (Math.floor(+m / 15) + 1) * 15 % 60; return `${h}:${String(next).padStart(2, '0')}`; })} className="flex h-5 w-8 items-center justify-center rounded-t-lg border border-white/5 bg-slate-800/80 text-white/60 hover:text-white active:scale-95 transition-all">
                    <ChevronUp size={12} />
                  </button>
                  <span className="flex h-8 w-8 items-center justify-center text-base font-black text-white tabular-nums">{deadlineTime.split(':')[1]}</span>
                  <button type="button" onClick={() => setDeadlineTime(p => { const [h, m] = p.split(':'); const prev = (Math.ceil(+m / 15) - 1) * 15; return `${h}:${String(prev < 0 ? 45 : prev).padStart(2, '0')}`; })} className="flex h-5 w-8 items-center justify-center rounded-b-lg border border-white/5 bg-slate-800/80 text-white/60 hover:text-white active:scale-95 transition-all">
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeadlineDay(deadlineDay === 'today' ? 'tomorrow' : 'today')}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  deadlineDay === 'today'
                    ? 'border-purple-400/40 bg-purple-500/15 text-purple-300'
                    : 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300'
                }`}
              >
                {deadlineDay === 'today' ? 'Today' : 'Tomorrow'}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-3 rounded-2xl border border-white/5 bg-slate-900/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300">
            <Coins size={13} />
            Honor Stake
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stakeOptions.map((stake) => (
              <button
                key={stake}
                type="button"
                onClick={() => setStakeCoins(stake)}
                className={`rounded-xl border px-3 py-2 text-xs font-black transition-all active:scale-95 ${
                  stakeCoins === stake
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-slate-950/60 text-slate-500 hover:border-amber-500/25'
                }`}
              >
                {stake === 0 ? 'None' : `${stake} coins`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] font-semibold text-slate-500">Stake level is currently just for description in the Duel post, coins are not automatically deducted.</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPublishing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3.5 text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {isPublishing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={16} />}
          {isPublishing ? 'Posting...' : 'Post Duel'}
        </button>
      </motion.div>
    </div>
  );
};
