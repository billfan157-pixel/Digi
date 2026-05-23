import { BarChart3, Droplets } from 'lucide-react';
import { glassCard } from '../../styles/glass';

interface EmptyAnalyticsStateProps {
  dataDays: number;
  minDays?: number;
}

export default function EmptyAnalyticsState({
  dataDays,
  minDays = 3,
}: EmptyAnalyticsStateProps) {
  const progress = Math.min(dataDays / minDays, 1);

  return (
    <div className={`${glassCard} p-8 text-center`}>
      <div className="flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.03] border border-white/[0.08] mb-4">
          <BarChart3 size={28} className="text-white/30" />
        </div>

        <h3 className="text-lg font-black text-white/90 mb-2">
          Chưa đủ dữ liệu phân tích
        </h3>

        <p className="text-[13px] text-white/50 max-w-[260px] leading-relaxed mb-6">
          Uống nước đều đặn vài ngày để xem thống kê thói quen, xu hướng và gợi ý cá nhân hóa.
        </p>

        {/* Progress ring */}
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="url(#emptyProgressGradient)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 264} 264`}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="emptyProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets size={16} className="text-cyan-400/60" />
            <span className="text-lg font-black text-white mt-0.5">{dataDays}</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Đã có <span className="text-cyan-400">{dataDays}</span> / {minDays} ngày dữ liệu
        </p>
      </div>
    </div>
  );
}
