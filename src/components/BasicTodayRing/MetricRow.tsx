import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MetricRowProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  secondaryInfo?: React.ReactNode;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MetricRow({
  icon: Icon,
  title,
  subtitle,
  value,
  secondaryInfo,
  accentClass,
  bgClass,
  borderClass,
  isExpandable = false,
  isExpanded = false,
  onToggle,
}: MetricRowProps) {
  return (
    <button
      onClick={isExpandable ? onToggle : undefined}
      disabled={!isExpandable}
      className={`w-full flex items-center justify-between rounded-2xl border ${borderClass} ${bgClass} p-4 backdrop-blur-xl transition-all duration-200 ease-out ${
        isExpandable ? 'hover:bg-slate-800/60 hover:border-cyan-500/30 active:scale-[0.98]' : ''
      }`}
      aria-label={`${title}: ${value}`}
      role={isExpandable ? 'button' : undefined}
      aria-expanded={isExpandable ? isExpanded : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${borderClass} ${bgClass}`}>
          <Icon size={18} className={accentClass} aria-hidden="true" />
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-white">{title}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${accentClass}/80`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <span className="text-lg font-black text-white">{value}</span>
          {secondaryInfo && (
            <span className="text-[10px] text-slate-400 mt-0.5 block">{secondaryInfo}</span>
          )}
        </div>
        {isExpandable && (
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>
    </button>
  );
}
