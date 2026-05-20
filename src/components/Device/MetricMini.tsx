import React from 'react';

export function MetricMini({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 transition-all hover:bg-slate-900/60 hover:border-cyan-500/30">
      {/* Subtle background glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

      <div className="relative flex flex-col items-center text-center">
        {Icon && <Icon size={12} className="text-slate-500 mb-1.5 group-hover:text-cyan-400 transition-colors" />}
        <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-black leading-none">{label}</p>
        <p className="text-sm font-black text-white mt-1.5 tracking-tight group-hover:text-cyan-100 transition-colors">{value}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-cyan-400 group-hover:w-1/2 transition-all duration-300" />
    </div>
  );
}
