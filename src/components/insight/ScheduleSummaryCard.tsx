import { Clock, ChevronRight } from 'lucide-react';

interface ScheduleSummaryCardProps {
  selectedDay: 'today' | 'tomorrow';
  scheduleCount: number;
  totalMl: number;
  onClick: () => void;
}

export default function ScheduleSummaryCard({
  selectedDay,
  scheduleCount,
  totalMl,
  onClick,
}: ScheduleSummaryCardProps) {
  const dayLabel = selectedDay === 'today' ? 'Hôm nay' : 'Ngày mai';

  return (
    <button
      onClick={onClick}
      className="w-full p-3.5 rounded-[var(--theme-border-radius-inner,12px)] bg-gradient-to-br from-cyan-500/5 via-slate-900/40 to-blue-500/5 border border-cyan-500/20 text-white text-left hover:from-cyan-500/10 hover:to-blue-500/10 transition-all duration-300 active:scale-[0.98] flex items-center justify-between group shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--theme-border-radius-inner,8px)] bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
          <Clock size={16} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 leading-none">
            Lịch nhắc nhở {dayLabel.toLowerCase()}
          </p>
          <h4 className="text-xs font-bold text-slate-200 mt-1">
            {scheduleCount > 0 ? (
              <span>
                <span className="text-cyan-400 font-extrabold">{scheduleCount}</span> mốc ({totalMl}ml)
              </span>
            ) : (
              'Reminders not set'
            )}
          </h4>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">
            {scheduleCount > 0 ? 'Tap to view details or edit' : 'Tap to use AI to schedule'}
          </p>
        </div>
      </div>
      <div className="w-7 h-7 rounded-[var(--theme-border-radius-inner,8px)] bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all">
        <ChevronRight size={14} />
      </div>
    </button>
  );
}
