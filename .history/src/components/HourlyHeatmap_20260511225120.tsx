import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, TrendingUp, Calendar, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HourlyHeatmapProps {
  userId?: string;
  className?: string;
}

const BLOCKS = [
  { name: 'Sáng', range: '06:00 - 11:59', icon: '☀️' },
  { name: 'Chiều', range: '12:00 - 17:59', icon: '🌤️' },
  { name: 'Tối', range: '18:00 - 23:59', icon: '🌙' },
  { name: 'Đêm', range: '00:00 - 05:59', icon: '🌑' },
];

interface Forecast {
  predicted: number;
  trend: 'Tăng' | 'Giảm' | 'Ổn định';
  confidence: number;
}

export default function HourlyHeatmap({ userId, className = '' }: HourlyHeatmapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 7 ngày qua
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }),
        fullDate: d,
      });
    }
    return days;
  }, []);

  // Fetch data
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: supabaseError } = await supabase
          .from('water_logs')
          .select('amount, created_at, day')
          .eq('user_id', userId)
          .gte('day', last7Days[0].dateStr)
          .lte('day', last7Days[6].dateStr)
          .order('created_at', { ascending: true });

        if (supabaseError) throw supabaseError;
        if (mounted) setLogs(data || []);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError('Không thể tải dữ liệu heatmap');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [userId, last7Days]);

  // Xử lý dữ liệu heatmap + Insight
  const { grid, maxVal, insight, totalIntake, blockTotals } = useMemo(() => {
    const g = Array(7).fill(0).map(() => Array(4).fill(0));
    const blockTotals = [0, 0, 0, 0];

    logs.forEach((log) => {
      const dateStr = log.day || new Date(log.created_at).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(d => d.dateStr === dateStr);
      if (dayIndex === -1) return;

      const hour = new Date(log.created_at).getHours();
      let blockIndex = 3; // Đêm mặc định
      if (hour >= 6 && hour < 12) blockIndex = 0;
      else if (hour >= 12 && hour < 18) blockIndex = 1;
      else if (hour >= 18 && hour <= 23) blockIndex = 2;

      const amount = log.amount || 0;
      g[dayIndex][blockIndex] += amount;
      blockTotals[blockIndex] += amount;
    });

    const max = Math.max(1, ...g.flat());
    const totalIntake = blockTotals.reduce((a, b) => a + b, 0);

    // Insight
    const daytimeTotals = blockTotals.slice(0, 3);
    const maxBlock = BLOCKS[daytimeTotals.indexOf(Math.max(...daytimeTotals))];
    const minBlock = BLOCKS[daytimeTotals.indexOf(Math.min(...daytimeTotals))];

    let insightMsg = "Thói quen uống nước của bạn khá đều trong ngày.";
    if (totalIntake > 0) {
      insightMsg = `Bạn uống nhiều nhất vào buổi ${maxBlock.name} và ít hơn vào buổi ${minBlock.name}.`;
    }

    return { 
      grid: g, 
      maxVal: max, 
      insight: insightMsg,
      totalIntake,
      blockTotals 
    };
  }, [logs, last7Days]);

  // Forecast
  const forecast = useMemo<Forecast>(() => {
    const dayTotals = last7Days.map(day => {
      const logsInDay = logs.filter(log => log.day === day.dateStr);
      const total = logsInDay.reduce((sum, log) => sum + (log.amount || 0), 0);
      return total;
    });

    const recentAvg = dayTotals.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = dayTotals.slice(0, 4).reduce((a, b) => a + b, 0) / 4 || recentAvg;

    const diff = recentAvg - olderAvg;
    const predicted = Math.round(recentAvg + diff * 0.6);
    const confidence = Math.min(85, Math.max(40, 60 + Math.abs(diff) * 8));

    return {
      predicted: Math.max(0, predicted),
      trend: diff > 50 ? 'Tăng' : diff < -50 ? 'Giảm' : 'Ổn định',
      confidence
    };
  }, [logs, last7Days]);

  const getCellClass = (val: number, max: number) => {
    if (val === 0) return 'bg-slate-950/50 border-slate-800/50';
    const ratio = val / max;
    if (ratio < 0.25) return 'bg-cyan-950/70 border-cyan-900/50';
    if (ratio < 0.5) return 'bg-cyan-800/80 border-cyan-700/60';
    if (ratio < 0.75) return 'bg-cyan-600/90 border-cyan-500/70';
    return 'bg-cyan-400 border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.5)] scale-[1.02]';
  };

  if (isLoading) {
    return (
      <div className={`bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[320px] ${className}`}>
        <Loader2 size={32} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400">Đang phân tích thói quen uống nước...</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 overflow-hidden group ${className}`}>
      {/* Ambient Glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-2xl">
            <Grid className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Phân bổ theo giờ</h3>
            <p className="text-xs text-slate-500">7 ngày qua • Heatmap</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{totalIntake.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-slate-500 -mt-1">ml tổng cộng</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-3">
        {BLOCKS.map((block, y) => (
          <div key={y} className="flex items-center gap-3">
            <div className="w-14 flex-shrink-0">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                {block.icon} {block.name}
              </div>
              <div className="text-[10px] text-slate-500">{block.range}</div>
            </div>

            <div className="flex-1 grid grid-cols-7 gap-1.5">
              {last7Days.map((day, x) => {
                const val = grid[x][y];
                return (
                  <motion.div
                    key={`${x}-${y}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative aspect-square group/cell cursor-pointer"
                  >
                    <div className={`w-full h-full rounded-2xl border transition-all duration-300 ${getCellClass(val, maxVal)}`} />
                    
                    <AnimatePresence>
                      {val > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 drop-shadow-sm"
                        >
                          {val >= 300 ? Math.round(val / 100) / 10 : ''}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 scale-0 group-hover/cell:scale-100 transition-all duration-200 origin-bottom z-50 pointer-events-none">
                      <div className="bg-slate-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap">
                        {day.label} • {block.name}<br />
                        <span className="text-cyan-400 font-bold">{val.toLocaleString('vi-VN')} ml</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Insight + Forecast */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Phát hiện</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
        </motion.div>

        {/* Forecast */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 rounded-2xl border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Dự báo mai</p>
            </div>
            <span className="text-[10px] text-emerald-400/80">~{forecast.confidence}%</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {forecast.predicted.toLocaleString('vi-VN')}
            </span>
            <span className="text-slate-400">ml</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${forecast.trend === 'Tăng' ? 'text-emerald-400' : forecast.trend === 'Giảm' ? 'text-rose-400' : 'text-slate-400'}`}>
            {forecast.trend} so với tuần trước
          </p>
        </motion.div>
      </div>
    </div>
  );
}