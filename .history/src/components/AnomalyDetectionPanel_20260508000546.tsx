import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Target, Lightbulb, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyHistoryPoint {
  d: string;
  ml: number;
  isToday: boolean;
}

interface AnomalyDetectionPanelProps {
  weeklyChartData: WeeklyHistoryPoint[];
  waterGoal: number;
  waterIntake: number;
  streak: number;
}

export default function AnomalyDetectionPanel({
  weeklyChartData,
  waterGoal,
  waterIntake,
  streak
}: AnomalyDetectionPanelProps) {

  const anomalyAnalysis = useMemo(() => {
    if (weeklyChartData.length < 3) {
      return {
        anomalies: [],
        consistencyScore: 0,
        habitStrength: 'unknown',
        recommendations: [],
        insights: []
      };
    }

    const anomalies: Array<{
      type: 'drop' | 'spike' | 'inconsistency';
      severity: 'low' | 'medium' | 'high';
      message: string;
      suggestion: string;
      icon: any;
      color: string;
    }> = [];

    // Calculate moving average
    const values = weeklyChartData.map(d => d.ml);
    const movingAvg = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - movingAvg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies
    const lastDay = values[values.length - 1];
    const secondLastDay = values[values.length - 2];

    // Sudden drop detection
    if (values.length >= 2 && secondLastDay && lastDay < secondLastDay * 0.6) {
      anomalies.push({
        type: 'drop',
        severity: lastDay < waterGoal * 0.3 ? 'high' : 'medium',
        message: `Giảm đột ngột ${Math.round((secondLastDay - lastDay) / secondLastDay * 100)}% so với hôm qua`,
        suggestion: 'Hãy uống ngay 500ml nước để phục hồi',
        icon: TrendingDown,
        color: 'text-red-400'
      });
    }

    // Below goal streak
    const recentDays = weeklyChartData.slice(-3);
    const belowGoalDays = recentDays.filter(d => d.ml < waterGoal * 0.8).length;

    if (belowGoalDays >= 2) {
      anomalies.push({
        type: 'inconsistency',
        severity: belowGoalDays === 3 ? 'high' : 'medium',
        message: `${belowGoalDays} ngày gần nhất dưới 80% mục tiêu`,
        suggestion: 'Thiết lập reminder hàng giờ để duy trì consistency',
        icon: AlertTriangle,
        color: 'text-amber-400'
      });
    }

    // High variability (inconsistent pattern)
    if (stdDev > movingAvg * 0.4) {
      anomalies.push({
        type: 'inconsistency',
        severity: 'medium',
        message: 'Mô hình uống nước không ổn định',
        suggestion: 'Thiết lập lịch uống cố định hàng ngày',
        icon: Target,
        color: 'text-orange-400'
      });
    }

    // Consistency score calculation
    const goalAchievements = weeklyChartData.filter(d => d.ml >= waterGoal).length;
    const consistencyScore = Math.round((goalAchievements / weeklyChartData.length) * 100);

    // Habit strength based on streak and consistency
    let habitStrength: 'weak' | 'developing' | 'strong' | 'excellent';
    if (streak >= 14 && consistencyScore >= 90) {
      habitStrength = 'excellent';
    } else if (streak >= 7 && consistencyScore >= 80) {
      habitStrength = 'strong';
    } else if (streak >= 3 && consistencyScore >= 60) {
      habitStrength = 'developing';
    } else {
      habitStrength = 'weak';
    }

    // Generate recommendations
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      icon: any;
      action?: string;
    }> = [];

    if (anomalies.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Khắc phục vấn đề ngay',
        description: 'Giải quyết các bất thường được phát hiện để cải thiện sức khỏe',
        icon: AlertTriangle,
        action: 'Xem chi tiết'
      });
    }

    if (consistencyScore < 70) {
      recommendations.push({
        priority: 'medium',
        title: 'Tăng tính nhất quán',
        description: 'Thiết lập routine uống nước cố định để đạt mục tiêu dễ dàng hơn',
        icon: Target,
        action: 'Thiết lập lịch'
      });
    }

    if (habitStrength === 'weak' || habitStrength === 'developing') {
      recommendations.push({
        priority: 'medium',
        title: 'Xây dựng thói quen',
        description: 'Bắt đầu với mục tiêu nhỏ và tăng dần để tạo momentum',
        icon: Zap,
        action: 'Bắt đầu challenge'
      });
    }

    // Generate insights
    const insights: Array<{
      type: 'positive' | 'neutral' | 'negative';
      message: string;
      icon: any;
    }> = [];

    if (streak >= 7) {
      insights.push({
        type: 'positive',
        message: `Chuỗi ${streak} ngày tuyệt vời! Bạn đã tạo được thói quen tốt`,
        icon: Zap
      });
    }

    if (consistencyScore >= 80) {
      insights.push({
        type: 'positive',
        message: `Tỷ lệ hoàn thành ${consistencyScore}% - rất ấn tượng!`,
        icon: Target
      });
    }

    if (anomalies.length === 0 && habitStrength === 'excellent') {
      insights.push({
        type: 'positive',
        message: 'Thói quen hydration của bạn đã đạt đến mức tối ưu',
        icon: Lightbulb
      });
    }

    if (anomalies.length > 0) {
      insights.push({
        type: 'negative',
        message: `Phát hiện ${anomalies.length} vấn đề cần chú ý`,
        icon: AlertTriangle
      });
    }

    return {
      anomalies,
      consistencyScore,
      habitStrength,
      recommendations,
      insights
    };
  }, [weeklyChartData, waterGoal, waterIntake, streak]);

  const habitStrengthConfig = {
    excellent: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Xuất sắc' },
    strong: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'Mạnh' },
    developing: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Đang phát triển' },
    weak: { color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Yếu' },
    unknown: { color: 'text-slate-400', bgColor: 'bg-slate-500/10', label: 'Chưa xác định' }
  };

  const habitConfig = habitStrengthConfig[anomalyAnalysis.habitStrength];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${habitConfig.bgColor} border border-white/10 flex items-center justify-center`}>
              <Lightbulb size={16} className={habitConfig.color} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Pattern Insights
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Phân tích mẫu
          </h3>
        </div>

        <div className={`rounded-xl ${habitConfig.bgColor} border border-white/10 px-3 py-2 text-right shadow-lg`}>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-black">
            Habit Strength
          </p>
          <p className={`text-sm font-black ${habitConfig.color}`}>
            {habitConfig.label}
          </p>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400 font-medium">Điểm consistency</span>
          <span className="text-white font-black">{anomalyAnalysis.consistencyScore}%</span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${anomalyAnalysis.consistencyScore}%` }}
            transition={{ duration: 1, delay: 0.8 }}
            className={`h-full rounded-full ${habitConfig.color.replace('text-', 'bg-')}/60`}
          />
        </div>
      </div>

      {/* Anomalies */}
      {anomalyAnalysis.anomalies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" />
            Phát hiện bất thường
          </h4>
          <div className="space-y-2">
            {anomalyAnalysis.anomalies.map((anomaly, index) => {
              const Icon = anomaly.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className={`w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={12} className={anomaly.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white leading-tight">{anomaly.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{anomaly.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      {anomalyAnalysis.insights.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-cyan-400" />
            Insights
          </h4>
          <div className="space-y-2">
            {anomalyAnalysis.insights.map((insight, index) => {
              const Icon = insight.icon;
              const colorClass = insight.type === 'positive' ? 'text-emerald-400' :
                               insight.type === 'negative' ? 'text-red-400' : 'text-slate-400';
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center`}>
                    <Icon size={10} className={colorClass} />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{insight.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}