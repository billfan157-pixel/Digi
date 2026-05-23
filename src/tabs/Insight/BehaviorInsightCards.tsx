import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Info, Clock, Thermometer, Target } from 'lucide-react';
import { glassMetric, glassInner } from '../../styles/glass';
import type { UserHydrationPattern } from '../../lib/patternEngine';

interface BehaviorPattern {
  pattern: string;
  confidence: number;
  recommendation: string;
}

interface BehaviorInsightCardsProps {
  patterns: BehaviorPattern[];
  hydrationPattern?: UserHydrationPattern | null;
}

export default function BehaviorInsightCards({ patterns, hydrationPattern }: BehaviorInsightCardsProps) {
  if (patterns.length === 0 && !hydrationPattern) return null;

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

          return (
            <motion.div
              key={p.pattern}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${glassMetric} p-3.5 flex items-start gap-3.5`}
            >
              <div className={`mt-0.5 p-2 rounded-xl bg-white/[0.05] border border-white/[0.06] ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-black text-white">{p.pattern}</h5>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-cyan-500">Gợi ý AI</span>
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

      {/* Hydration Pattern Summary */}
      {hydrationPattern && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-cyan-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thói quen uống nước</h4>
          </div>

          {/* Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${glassInner} p-3 flex items-center gap-3`}
          >
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.06] text-cyan-400">
              {hydrationPattern.trend === 'improving' && <TrendingUp size={16} />}
              {hydrationPattern.trend === 'declining' && <TrendingDown size={16} />}
              {hydrationPattern.trend === 'stable' && <Clock size={16} />}
              {hydrationPattern.trend === 'volatile' && <AlertCircle size={16} />}
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-black text-white">
                {hydrationPattern.trend === 'improving' && 'Đang cải thiện'}
                {hydrationPattern.trend === 'declining' && 'Đang giảm'}
                {hydrationPattern.trend === 'stable' && 'Ổn định'}
                {hydrationPattern.trend === 'volatile' && 'Dao động'}
              </h5>
              <p className="text-[10px] text-slate-400">
                Điểm đều đặn: <span className="text-cyan-300 font-bold">{hydrationPattern.consistencyScore}/100</span>
              </p>
            </div>
          </motion.div>

          {/* Peak Hours */}
          {hydrationPattern.peakHours.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${glassInner} p-3 flex items-center gap-3`}
            >
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.06] text-emerald-400">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-black text-white">Giờ uống nhiều nhất</h5>
                <p className="text-[10px] text-slate-400">
                  {hydrationPattern.peakHours.map(h => `${h}h`).join(', ')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Weather Factor */}
          {hydrationPattern.weatherFactor !== 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${glassInner} p-3 flex items-center gap-3`}
            >
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.06] text-rose-400">
                <Thermometer size={16} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-black text-white">Ảnh hưởng thời tiết</h5>
                <p className="text-[10px] text-slate-400">
                  {hydrationPattern.weatherFactor > 1 ? 'Uống nhiều hơn khi nóng' : 'Uống ít hơn khi nóng'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
      
      <p className="text-[9px] text-slate-500 italic px-1 flex items-center gap-1.5">
        <Info size={10} /> Dựa trên dữ liệu 7 ngày gần nhất của bạn.
      </p>
    </div>
  );
}
