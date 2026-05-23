import { Grid } from 'lucide-react';

interface HeaderProps {
  totalIntake: number;
}

export default function Header({ totalIntake }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 relative z-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
          <Grid size={20} className="text-cyan-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Phân bổ theo giờ</h3>
          <p className="text-xs text-slate-400 font-medium">7 ngày qua • Heatmap</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-white">
          {totalIntake.toLocaleString('vi-VN')}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
          ml tổng
        </p>
      </div>
    </div>
  );
}
