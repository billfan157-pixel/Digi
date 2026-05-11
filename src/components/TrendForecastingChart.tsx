import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyHistoryPoint {
  d: string;
  ml: number;
  isToday: boolean;
}

interface TrendForecastingChartProps {
  weeklyChartData: WeeklyHistoryPoint[];
  waterGoal: number;
}

export default function TrendForecastingChart({
  weeklyChartData,
  waterGoal
}: TrendForecastingChartProps) {

  const trendAnalysis = useMemo(() => {
    if (weeklyChartData.length < 3) {
      return {
        slope: 0,
        intercept: 0,
        r2: 0,
        forecast: [],
        confidence: 0,
        status: 'insufficient_data' as const,
        message: 'Cần ít nhất 3 ngày dữ liệu để phân tích xu hướng'
      };
    }

    // Linear regression calculation
    const n = weeklyChartData.length;
    const x = weeklyChartData.map((_, i) => i); // Day indices 0, 1, 2, ...
    const y = weeklyChartData.map(d => d.ml);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared calculation
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 0);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 0), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    // Forecast next 7 days
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = n + i;
      const predicted = slope * dayIndex + intercept;
      forecast.push(Math.max(0, Math.round(predicted)));
    }

    // Confidence based on R-squared and data consistency
    const consistency = weeklyChartData.filter(d => d.ml >= waterGoal * 0.8).length / n;
    const confidence = Math.min(100, Math.round((r2 * 0.7 + consistency * 0.3) * 100));

    // Status determination
    const last7Days = weeklyChartData.slice(-7);
    const avgLast7 = last7Days.reduce((sum, d) => sum + d.ml, 0) / last7Days.length;
    const projectedGoal = forecast[6]; // 7 days ahead

    let status: 'on_track' | 'at_risk' | 'excellent' | 'needs_attention';
    let message: string;

    if (projectedGoal >= waterGoal && confidence > 70) {
      status = 'excellent';
      message = `Xu hướng tuyệt vời! Dự kiến đạt mục tiêu trong 7 ngày`;
    } else if (projectedGoal >= waterGoal * 0.9 && confidence > 50) {
      status = 'on_track';
      message = `Đang trên đà đạt mục tiêu, tiếp tục duy trì`;
    } else if (projectedGoal < waterGoal * 0.7 || confidence < 30) {
      status = 'needs_attention';
      message = `Cần cải thiện thói quen để đạt mục tiêu`;
    } else {
      status = 'at_risk';
      message = `Có nguy cơ không đạt mục tiêu, hãy chú ý hơn`;
    }

    return {
      slope,
      intercept,
      r2,
      forecast,
      confidence,
      status,
      message
    };
  }, [weeklyChartData, waterGoal]);

  const statusConfig = {
    excellent: {
      icon: Sparkles,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20'
    },
    on_track: {
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      glowColor: 'shadow-cyan-500/20'
    },
    at_risk: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      glowColor: 'shadow-amber-500/20'
    },
    needs_attention: {
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      glowColor: 'shadow-red-500/20'
    },
    insufficient_data: {
      icon: Target,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      glowColor: 'shadow-slate-500/20'
    }
  };

  const config = statusConfig[trendAnalysis.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
              <Icon size={16} className={config.color} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Trend Analysis
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Dự báo 7 ngày
          </h3>
        </div>

        <div className={`rounded-xl ${config.bgColor} border ${config.borderColor} px-3 py-2 text-right shadow-lg ${config.glowColor}`}>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-black">
            Confidence
          </p>
          <p className={`text-xl font-black ${config.color}`}>
            {trendAnalysis.confidence}%
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {trendAnalysis.message}
      </p>

      {trendAnalysis.status !== 'insufficient_data' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Dự kiến ngày 7:</span>
            <span className="text-white font-black">
              {trendAnalysis.forecast[6]} <span className="text-xs text-slate-500">ml</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Mục tiêu:</span>
            <span className="text-cyan-400 font-black">
              {waterGoal} <span className="text-xs text-slate-500">ml</span>
            </span>
          </div>

          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (trendAnalysis.forecast[6] / waterGoal) * 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}/60`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}