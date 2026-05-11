import React, { useMemo } from 'react';
import { Activity, CloudSun, Moon, Droplets, Zap, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface HydrationContextCardProps {
  profile: any;
  waterIntake: number;
  waterGoal: number;
  isWatchConnected: boolean;
  isWeatherSynced: boolean;
  isCalendarSynced: boolean;
  weeklyChartData: any[];
}

export default function HydrationContextCard({
  profile,
  waterIntake,
  waterGoal,
  isWatchConnected,
  isWeatherSynced,
  isCalendarSynced,
  weeklyChartData
}: HydrationContextCardProps) {

  const contextAnalysis = useMemo(() => {
    // Activity level impact
    const activityMultiplier = {
      'sedentary': 1.0,
      'lightly_active': 1.1,
      'moderately_active': 1.2,
      'very_active': 1.3,
      'extremely_active': 1.4
    };

    const baseGoal = waterGoal || 2000;
    const activityLevel = profile?.activity_level || 'moderately_active';
    const activityAdjusted = Math.round(baseGoal * (activityMultiplier[activityLevel as keyof typeof activityMultiplier] || 1.2));

    // Weather impact (simulated - in real app would come from WeatherKit)
    const weatherImpact = {
      'hot': 1.2, // +20% in hot weather
      'warm': 1.1,
      'moderate': 1.0,
      'cool': 0.95,
      'cold': 0.9
    };

    const climate = profile?.climate || 'moderate';
    const weatherAdjusted = Math.round(activityAdjusted * (weatherImpact[climate as keyof typeof weatherImpact] || 1.0));

    // Sleep quality impact (simulated - would come from HealthKit)
    const sleepQuality = Math.random() > 0.7 ? 'poor' : Math.random() > 0.4 ? 'fair' : 'good';
    const sleepMultiplier = {
      'poor': 0.9, // -10% if poor sleep
      'fair': 0.95,
      'good': 1.0
    };
    const sleepAdjusted = Math.round(weatherAdjusted * sleepMultiplier[sleepQuality as keyof typeof sleepMultiplier]);

    // Current hydration state
    const currentPercent = (waterIntake / waterGoal) * 100;
    const adjustedPercent = (waterIntake / sleepAdjusted) * 100;

    let hydrationState: 'optimal' | 'good' | 'moderate' | 'low' | 'critical';
    let stateMessage: string;
    let stateColor: string;

    if (adjustedPercent >= 100) {
      hydrationState = 'optimal';
      stateMessage = 'Trạng thái hydration tối ưu';
      stateColor = 'text-emerald-400';
    } else if (adjustedPercent >= 80) {
      hydrationState = 'good';
      stateMessage = 'Hydration tốt, tiếp tục duy trì';
      stateColor = 'text-cyan-400';
    } else if (adjustedPercent >= 60) {
      hydrationState = 'moderate';
      stateMessage = 'Cần bổ sung thêm nước';
      stateColor = 'text-amber-400';
    } else if (adjustedPercent >= 30) {
      hydrationState = 'low';
      stateMessage = 'Thiếu hụt nước đáng kể';
      stateColor = 'text-orange-400';
    } else {
      hydrationState = 'critical';
      stateMessage = 'Cảnh báo mất nước';
      stateColor = 'text-red-400';
    }

    // Context factors
    const factors = [
      {
        icon: Activity,
        label: 'Hoạt động',
        value: activityLevel.replace('_', ' '),
        impact: activityAdjusted > baseGoal ? '+' + (activityAdjusted - baseGoal) : '0',
        color: 'text-blue-400'
      },
      {
        icon: CloudSun,
        label: 'Thời tiết',
        value: climate,
        impact: weatherAdjusted > activityAdjusted ? '+' + (weatherAdjusted - activityAdjusted) : '0',
        color: 'text-yellow-400'
      },
      {
        icon: Moon,
        label: 'Giấc ngủ',
        value: sleepQuality,
        impact: sleepAdjusted < weatherAdjusted ? (sleepAdjusted - weatherAdjusted) + '' : '0',
        color: 'text-purple-400'
      }
    ];

    return {
      baseGoal,
      activityAdjusted,
      weatherAdjusted,
      sleepAdjusted,
      hydrationState,
      stateMessage,
      stateColor,
      factors,
      currentPercent,
      adjustedPercent
    };
  }, [profile, waterIntake, waterGoal, weeklyChartData]);

  const stateConfig = {
    optimal: {
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20'
    },
    good: {
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      glowColor: 'shadow-cyan-500/20'
    },
    moderate: {
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      glowColor: 'shadow-amber-500/20'
    },
    low: {
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      glowColor: 'shadow-orange-500/20'
    },
    critical: {
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      glowColor: 'shadow-red-500/20'
    }
  };

  const config = stateConfig[contextAnalysis.hydrationState];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
              <Droplets size={16} className={contextAnalysis.stateColor} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Health Context
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Trạng thái sức khỏe
          </h3>
        </div>

        <div className={`rounded-xl ${config.bgColor} border ${config.borderColor} px-3 py-2 text-right shadow-lg ${config.glowColor}`}>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 font-black">
            Adjusted Goal
          </p>
          <p className={`text-lg font-black ${contextAnalysis.stateColor}`}>
            {contextAnalysis.sleepAdjusted}
          </p>
          <p className="text-[9px] text-slate-500">ml</p>
        </div>
      </div>

      <p className={`text-sm font-medium leading-relaxed mb-4 ${contextAnalysis.stateColor}`}>
        {contextAnalysis.stateMessage}
      </p>

      <div className="space-y-3 mb-4">
        {contextAnalysis.factors.map((factor, index) => {
          const Icon = factor.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full bg-slate-800/50 flex items-center justify-center`}>
                  <Icon size={12} className={factor.color} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{factor.label}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{factor.value}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-black ${factor.impact.startsWith('+') ? 'text-emerald-400' : factor.impact.startsWith('-') ? 'text-red-400' : 'text-slate-400'}`}>
                  {factor.impact} ml
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Tiến độ hiện tại</span>
          <span className="text-white font-bold">
            {Math.round(contextAnalysis.adjustedPercent)}%
          </span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, contextAnalysis.adjustedPercent)}%` }}
            transition={{ duration: 1, delay: 0.7 }}
            className={`h-full rounded-full ${contextAnalysis.stateColor.replace('text-', 'bg-')}/60`}
          />
        </div>
      </div>
    </motion.div>
  );
}