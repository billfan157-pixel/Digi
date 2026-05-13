import React from 'react';

interface InsightBentoGridProps {
  children: React.ReactNode;
}

const InsightBentoGrid: React.FC<InsightBentoGridProps> = ({ children }) => {
  return (
    <div className="px-5 grid grid-cols-2 gap-4 pb-8">
      {children}
    </div>
  );
};

export interface BentoCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: any;
  color: string;
  bg: string;
  className?: string;
  fullWidth?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({ 
  title, value, unit, icon: Icon, color, bg, className = "", fullWidth = false 
}) => {
  return (
    <div className={`
      relative overflow-hidden
      bg-gradient-to-br from-white/[0.07] to-transparent
      backdrop-blur-3xl
      border border-white/10
      rounded-[2rem] p-6 
      shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
      group hover:border-white/20 transition-all duration-500
      ${fullWidth ? 'col-span-2' : 'col-span-1'} 
      ${className}
    `}>
      {/* Subtle Top Highlight Edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Soft Background Glow */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 ${bg} opacity-5 blur-[60px] rounded-full group-hover:opacity-10 transition-all duration-700`} />
      
      <div className="flex justify-between items-center mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={22} className={color} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">
            {value}
          </span>
          {unit && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{unit}</span>}
        </div>
      </div>

      {/* Decorative pulse point */}
      <div className={`absolute bottom-6 right-6 w-1 h-1 rounded-full ${color.replace('text-', 'bg-')} opacity-20 animate-pulse`} />
    </div>
  );
};

export default InsightBentoGrid;
