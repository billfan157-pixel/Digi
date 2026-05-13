import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, AlertCircle, TrendingUp, Info } from 'lucide-react';

interface BehaviorPattern {
  pattern: string;
  confidence: number;
  recommendation: string;
}

interface BehaviorInsightCardsProps {
  patterns: BehaviorPattern[];
}

export default function BehaviorInsightCards({ patterns }: BehaviorInsightCardsProps) {
  if (patterns.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={14} className="text-amber-400" />
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Phân tích thói quen</h4>
      </div>
      
      <div className="grid grid-cols-1 gap-2.5">
        {patterns.map((p, idx) => {
          const isPositive = p.pattern.includes('Đều đặn');
          const Icon = isPositive ? CheckCircle2 : p.pattern.includes('giảm') ? AlertCircle : TrendingUp;
          const colorClass = isPositive ? 'text-emerald-400' : 'text-cyan-400';
          const bgClass = isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-cyan-500/10 border-cyan-500/20';

          return (
            <motion.div
              key={p.pattern}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3.5 rounded-2xl border ${bgClass} flex items-start gap-3.5 group hover:bg-opacity-20 transition-all`}
            >
              <div className={`mt-0.5 p-2 rounded-xl bg-black/20 ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-black text-white">{p.pattern}</h5>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-cyan-500">AI Insight</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  {p.recommendation}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <p className="text-[9px] text-slate-500 italic px-1 flex items-center gap-1.5">
        <Info size={10} /> Dựa trên dữ liệu 7 ngày gần nhất của bạn.
      </p>
    </div>
  );
}
