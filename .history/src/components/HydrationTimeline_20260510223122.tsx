import { useEffect, useState, useMemo } from 'react';
import type { HydrationSchedule } from '../lib/HydrationEngine';

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

  const totalMl = useMemo(
    () => schedule.reduce((sum, s) => sum + s.amount, 0),
    [schedule]
  );

  if (!schedule || schedule.length === 0) return null;

  const completedMl = schedule
    .filter((_, i) => i < nextIndex || (nextIndex === -1 && true))
    .filter((item) => item.time < currentTime)
    .reduce((sum, s) => sum + s.amount, 0);

  const progressPct = totalMl > 0 ? (completedMl / totalMl) * 100 : 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 tracking-wide uppercase">
              Lịch trình
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {schedule.length} mốc · {totalMl.toLocaleString('vi-VN')}ml
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 tabular-nums">
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Schedule grid */}
      <div className="space-y-[1px] bg-white/[0.04] rounded-xl overflow-hidden">
        {schedule.map((item, index) => {
          const isPast = item.time < currentTime;
          const isNext = index === nextIndex;

          return (
            <div
              key={`${item.time}-${index}`}
              className={`flex items-center gap-4 px-4 py-3 ${
                isNext
                  ? 'bg-cyan-500/8'
                  : isPast
                    ? 'bg-transparent'
                    : 'bg-white/[0.02]'
              }`}
            >
              {/* Time */}
              <span
                className={`text-sm font-medium w-[44px] shrink-0 tabular-nums ${
                  isPast
                    ? 'text-slate-500'
                    : isNext
                      ? 'text-cyan-400'
                      : 'text-slate-300'
                }`}
              >
                {item.time}
              </span>

              {/* Divider dot */}
              <div
                className={`w-[3px] h-[3px] rounded-full shrink-0 ${
                  isPast
                    ? 'bg-emerald-500/60'
                    : isNext
                      ? 'bg-cyan-400'
                      : 'bg-slate-600'
                }`}
              />

              {/* Label */}
              <span
                className={`flex-1 text-sm truncate ${
                  isPast
                    ? 'text-slate-500'
                    : isNext
                      ? 'text-cyan-300'
                      : 'text-slate-400'
                }`}
              >
                {item.note || 'Uống nước'}
              </span>

              {/* Amount */}
              <span
                className={`text-sm font-medium tabular-nums shrink-0 ${
                  isPast
                    ? 'text-slate-500'
                    : isNext
                      ? 'text-cyan-300'
                      : 'text-slate-400'
                }`}
              >
                {item.amount}
                <span className="text-[10px] ml-0.5">ml</span>
              </span>

              {/* Status icon */}
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                {isPast ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isNext ? (
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                ) : (
                  <div className="w-[5px] h-[5px] rounded-full bg-slate-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}