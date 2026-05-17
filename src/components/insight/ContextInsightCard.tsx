import React from 'react';
import { Calendar, Thermometer, Clock, Moon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ContextInsight } from '../../hooks/useContextAwareInsights';

interface ContextInsightCardProps {
  insight: ContextInsight;
  index: number;
}

const ICON_MAP: Record<ContextInsight['icon'], React.ComponentType<{ size?: number; className?: string }>> = {
  calendar: Calendar,
  thermometer: Thermometer,
  clock: Clock,
  moon: Moon,
};

const COLOR_MAP: Record<ContextInsight['category'], { bg: string; border: string; text: string; iconBg: string }> = {
  calendar: { bg: 'bg-violet-500/8', border: 'border-violet-500/20', text: 'text-violet-400', iconBg: 'bg-violet-500/15' },
  weather: { bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/15' },
  day_pattern: { bg: 'bg-cyan-500/8', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/15' },
  sleep: { bg: 'bg-indigo-500/8', border: 'border-indigo-500/20', text: 'text-indigo-400', iconBg: 'bg-indigo-500/15' },
};

const CATEGORY_LABELS: Record<ContextInsight['category'], string> = {
  calendar: 'Lịch',
  weather: 'Thời tiết',
  day_pattern: 'Thói quen',
  sleep: 'Giấc ngủ',
};

export default function ContextInsightCard({ insight, index }: ContextInsightCardProps) {
  const Icon = ICON_MAP[insight.icon];
  const colors = COLOR_MAP[insight.category];
  const isPositive = insight.impact.delta.startsWith('+') || insight.impact.delta.includes('Cao') || insight.impact.delta.includes('events');
  const isNegative = insight.impact.delta.startsWith('-') || insight.impact.delta.includes('giảm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={16} className={colors.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>
              {CATEGORY_LABELS[insight.category]}
            </span>
            <span className="text-[9px] text-slate-500">
              {Math.round(insight.confidence * 100)}% tin cậy
            </span>
          </div>

          <h4 className="text-xs font-bold text-white mb-1.5">{insight.title}</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">{insight.insight}</p>

          <div className="flex items-center gap-1.5 mt-2.5">
            {isNegative ? (
              <ArrowDownRight size={12} className="text-rose-400" />
            ) : isPositive ? (
              <ArrowUpRight size={12} className="text-emerald-400" />
            ) : null}
            <span className={`text-[10px] font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
              {insight.impact.delta}
            </span>
            <span className="text-[9px] text-slate-500 ml-1">{insight.impact.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
