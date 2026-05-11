import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Clock, Sunrise, Moon, Sparkles } from 'lucide-react';
import type { HydrationSchedule } from '../lib/HydrationEngine';

interface TimelineItemProps {
  item: HydrationSchedule;
  index: number;
  isPast: boolean;
  isNext: boolean;
  isLast: boolean;
}

function TimelineItem({ item, index, isPast, isNext, isLast }: TimelineItemProps) {
  // Phân loại buổi dựa trên giờ
  const hour = parseInt(item.time.split(':')[0], 10);
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  const periodMeta = {
    morning: { icon: Sunrise, color: 'text-amber-400', glow: 'rgba(251,191,36,0.3)', label: 'Sáng' },
    afternoon: { icon: Clock, color: 'text-cyan-400', glow: 'rgba(34,211,238,0.3)', label: 'Chiều' },
    evening: { icon: Moon, color: 'text-indigo-400', glow: 'rgba(129,140,248,0.3)', label: 'Tối' },
  }[period];

  const PeriodIcon = periodMeta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Glass card */}
      <div
        className={`relative rounded-2xl border transition-all duration-500 ${
          isPast
            ? 'border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-60'
            : isNext
              ? 'border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-slate-800/60 shadow-[0_0_24px_-6px_rgba(34,211,238,0.25)]'
              : 'border-white/5 bg-slate-800/30 hover:border-white/10'
        } ${isNext ? 'scale-[1.02]' : ''} p-4`}
      >
        {/* Ambient glow cho next item */}
        {isNext && (
          <div
            className="absolute -inset-[1px] rounded-2xl opacity-40 blur-sm -z-10"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), transparent)' }}
          />
        )}

        {/* Timeline connector — vertical line */}
        {!isLast && (
          <div
            className={`absolute left-[22px] top-12 w-px h-[calc(100%+0.75rem)] transition-colors duration-500 ${
              isPast ? 'bg-emerald-500/30' : 'bg-slate-700/40'
            }`}
          />
        )}

        <div className="flex items-start gap-4 relative z-10">
          {/* Period icon */}
          <div
            className={`relative flex items-center justify-center w-11 h-11 rounded-xl border shrink-0 ${
              isPast
                ? 'border-emerald-500/20 bg-emerald-500/10'
                : isNext
                  ? 'border-cyan-400/30 bg-cyan-500/15'
                  : 'border-slate-600/30 bg-slate-800/60'
            }`}
          >
            {isNext && (
              <div
                className="absolute inset-0 rounded-xl animate-pulse opacity-30"
                style={{ boxShadow: `0 0 16px ${periodMeta.glow}` }}
              />
            )}
            <PeriodIcon
              size={18}
              className={isPast ? 'text-emerald-400' : isNext ? periodMeta.color : 'text-slate-500'}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Time + amount row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-base font-bold tracking-tight ${
                    isPast
                      ? 'text-emerald-400'
                      : isNext
                        ? 'text-white'
                        : 'text-slate-300'
                  }`}
                >
                  {item.time}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isPast
                      ? 'text-emerald-400/60 bg-emerald-500/10'
                      : isNext
                        ? 'text-cyan-400 bg-cyan-500/15'
                        : 'text-slate-600 bg-slate-800/60'
                  }`}
                >
                  {periodMeta.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Droplets
                  size={13}
                  className={
                    isPast
                      ? 'text-emerald-400'
                      : isNext
                        ? 'text-cyan-400'
                        : 'text-slate-500'
                  }
                />
                <span
                  className={`text-sm font-bold tabular-nums ${
                    isPast
                      ? 'text-emerald-400'
                      : isNext
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                  }`}
                >
                  {item.amount}
                  <span className="text-[10px] font-medium ml-0.5">ml</span>
                </span>
              </div>
            </div>

            {/* Note */}
            {item.note && (
              <p
                className={`text-xs leading-relaxed mt-1.5 pr-2 ${
                  isPast
                    ? 'text-slate-500'
                    : isNext
                      ? 'text-slate-300'
                      : 'text-slate-500'
                }`}
              >
                {item.note}
              </p>
            )}

            {/* Badge "Sắp đến" cho next item */}
            {isNext && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20"
              >
                <Sparkles size={10} className="text-cyan-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                  Mốc tiếp theo
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface HydrationTimelineProps {
  schedule: HydrationSchedule[];
  className?: string;
}

export default function HydrationTimeline({ schedule, className = '' }: HydrationTimelineProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextIndex = useMemo(
    () => schedule.findIndex(item => item.time >= currentTime),
    [schedule, currentTime]
  );

  if (!schedule || schedule.length === 0) return null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2.5">
