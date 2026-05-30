/**
 * Sprint 13-14: AI Personalization Engine
 * Weekly Report Modal — hiển thị báo cáo tổng kết tuần
 */
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Droplets,
  Calendar,
  Award,
  Share2,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WeeklyReport } from '../../lib/weeklyReportEngine';
import { glassCard, glassMetric } from '../../styles/glass';

interface WeeklyReportModalProps {
  report: WeeklyReport | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  isLoading?: boolean;
}

const TREND_CONFIG: Record<string, { icon: React.ReactNode; color: string; labelKey: string }> = {
  improving: {
    icon: <TrendingUp size={16} />,
    color: 'text-emerald-400',
    labelKey: 'weekly.trend_improving',
  },
  declining: {
    icon: <TrendingDown size={16} />,
    color: 'text-rose-400',
    labelKey: 'weekly.trend_declining',
  },
  stable: {
    icon: <BarChart3 size={16} />,
    color: 'text-cyan-400',
    labelKey: 'weekly.trend_stable',
  },
};

export default function WeeklyReportModal({
  report,
  isOpen,
  onClose,
  onShare,
  isLoading,
}: WeeklyReportModalProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] z-50 flex flex-col"
          >
            <div className={`${glassCard} w-full relative overflow-y-auto max-h-full rounded-[24px] backdrop-blur-2xl shadow-2xl`}>
              {/* Mesh Gradient Background */}
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none mix-blend-screen transform -translate-x-1/2 translate-y-1/2" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600/30 flex items-center justify-center text-slate-400 hover:text-white z-10"
              >
                <X size={16} />
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-slate-400 text-sm">{t('weekly.creating_report')}</div>
                </div>
              ) : report ? (
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-3">
                      <BarChart3 size={24} className="text-cyan-400" />
                    </div>
                    <h2 className="text-lg font-black text-white">{t('weekly.report_title')}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDate(report.weekStart)} → {formatDate(report.weekEnd)}
                    </p>
                  </div>

                  {/* Ring progress */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50" cy="50" r="42"
                          fill="none"
                          stroke="rgba(148,163,184,0.15)"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50" cy="50" r="42"
                          fill="none"
                          stroke="url(#progressGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(report.goalHitDays / 7) * 264} 264`}
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#2dd4bf" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white">{report.goalHitDays}</span>
                        <span className="text-[10px] text-slate-400">{t('weekly.of_7_days')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {t('weekly.goal_hit')}
                    </p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={<Droplets size={14} />}
                      label={t('insight.total_amount')}
                      value={`${(report.totalIntake / 1000).toFixed(1)}L`}
                      color="text-cyan-400"
                    />
                    <StatCard
                      icon={<Target size={14} />}
                      label={t('insight.average_amount')}
                      value={`${Math.round(report.avgDaily)}ml`}
                      color="text-emerald-400"
                    />
                    <StatCard
                      icon={<Calendar size={14} />}
                      label={t('insight.best_day')}
                      value={report.bestDay.date ? `${report.bestDay.ml}ml` : '—'}
                      sub={report.bestDay.date ? formatDate(report.bestDay.date) : undefined}
                      color="text-violet-400"
                    />
                    <StatCard
                      icon={<TrendingUp size={14} />}
                      label={t('insight.consistency')}
                      value={`${report.consistencyScore}%`}
                      color="text-amber-400"
                    />
                  </div>

                  {/* Comparison */}
                  {report.comparisonToPreviousWeek !== 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                      report.comparisonToPreviousWeek > 0
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}>
                      {report.comparisonToPreviousWeek > 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span className="text-xs font-bold">
                        {report.comparisonToPreviousWeek > 0 ? t('weekly.increase') : t('weekly.decrease')}{' '}
                        {Math.abs(report.comparisonToPreviousWeek)}% {t('weekly.vs_last_week')}
                      </span>
                    </div>
                  )}

                  {/* Trend */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/30">
                    {TREND_CONFIG[report.trend]?.icon || <BarChart3 size={16} className="text-slate-400" />}
                    <span className={`text-xs font-bold ${TREND_CONFIG[report.trend]?.color || 'text-slate-400'}`}>
                      {TREND_CONFIG[report.trend]?.labelKey ? t(TREND_CONFIG[report.trend].labelKey) : report.trend}
                    </span>
                  </div>

                  {/* Insight */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Award size={12} />
                      {t('weekly.insight_label')}
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {report.insight}
                    </p>
                  </div>

                  {/* Tip */}
                  {report.tip && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                        <ChevronRight size={12} />
                        {t('weekly.tip_label')}
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {report.tip}
                      </p>
                    </div>
                  )}

                  {/* Share button */}
                  <button
                    onClick={onShare}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-bold hover:from-cyan-500/30 hover:to-emerald-500/30 transition-colors"
                  >
                    <Share2 size={16} />
                    {t('weekly.share_report')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart3 size={32} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">{t('weekly.no_data')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`${glassMetric} flex items-center gap-3 px-3 py-3 rounded-xl`}>
      <div className={`${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
        {sub && <p className="text-[9px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}