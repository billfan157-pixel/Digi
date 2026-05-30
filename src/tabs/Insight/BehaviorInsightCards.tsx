import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (patterns.length === 0 && !hydrationPattern) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={14} className="text-amber-400" />
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('behavior_analysis')}</h4>
      </div>
      
      <div className="grid grid-cols-1 gap-2.5">
        {patterns.map((p, idx) => {
          const isPositive = p.pattern.includes(t('insight.consistent'));
          const Icon = isPositive ? CheckCircle2 : p.pattern.includes('giảm') ? AlertCircle : TrendingUp;
          const colorClass = isPositive ? 'text-emerald-400' : 'text-[var(--neon-cyan,#22d3ee)]';

          return (
            <motion.div
              key={p.pattern}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${glassMetric} p-3.5 flex items-start gap-3.5`}
            >
              <div className={`mt-0.5 p-2 rounded-[var(--theme-border-radius-inner,12px)] bg-white/[0.05] border border-white/[0.06] ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-black text-white">{p.pattern}</h5>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan,#22d3ee)] animate-pulse" />
                    <span className="text-[9px] font-bold text-[var(--neon-cyan,#22d3ee)]">{t('ai_suggestion')}</span>
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
            <Target size={14} className="text-[var(--neon-cyan,#22d3ee)]" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('drinking_habits')}</h4>
          </div>

          {/* Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${glassInner} p-3 flex items-center gap-3`}
          >
            <div className="p-2 rounded-[var(--theme-border-radius-inner,12px)] bg-white/[0.05] border border-white/[0.06] text-[var(--neon-cyan,#22d3ee)]">
              {hydrationPattern.trend === 'improving' && <TrendingUp size={16} />}
              {hydrationPattern.trend === 'declining' && <TrendingDown size={16} />}
              {hydrationPattern.trend === 'stable' && <Clock size={16} />}
              {hydrationPattern.trend === 'volatile' && <AlertCircle size={16} />}
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-black text-white">
                {hydrationPattern.trend === 'improving' && t('trend_improving')}
                {hydrationPattern.trend === 'declining' && t('trend_declining')}
                {hydrationPattern.trend === 'stable' && t('trend_stable')}
                {hydrationPattern.trend === 'volatile' && t('trend_volatile')}
              </h5>
              <p className="text-[10px] text-slate-400">
                {t('consistency_score')}: <span className="text-[var(--neon-cyan,#22d3ee)] font-bold">{hydrationPattern.consistencyScore}/100</span>
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
              <div className="p-2 rounded-[var(--theme-border-radius-inner,12px)] bg-white/[0.05] border border-white/[0.06] text-emerald-400">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-black text-white">{t('peak_drinking_hours')}</h5>
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
              <div className="p-2 rounded-[var(--theme-border-radius-inner,12px)] bg-white/[0.05] border border-white/[0.06] text-orange-400">
                <Thermometer size={16} />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-black text-white">{t('weather_influence')}</h5>
                <p className="text-[10px] text-slate-400">
                  {hydrationPattern.weatherFactor > 1 ? t('drinks_more_hot') : t('drinks_less_hot')}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
      
      <p className="text-[9px] text-slate-500 italic px-1 flex items-center gap-1.5">
        <Info size={10} /> {t('data_7_days')}
      </p>
    </div>
  );
}
