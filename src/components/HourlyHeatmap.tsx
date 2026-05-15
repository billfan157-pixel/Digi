import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, TrendingUp, Award, Sun, Cloud, Moon, MoonStar,
  TrendingDown, Minus, Trophy, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HourlyHeatmapProps {
  userId?: string;
  className?: string;
}

// Design system compliant time blocks with lucide-react icons
const BLOCKS = [
  { 
    name: 'Sáng', 
    range: '06:00 - 11:59', 
    Icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  { 
    name: 'Chiều', 
    range: '12:00 - 17:59', 
    Icon: Cloud,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20'
  },
  { 
    name: 'Tối', 
    range: '18:00 - 23:59', 
    Icon: Moon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20'
  },
  { 
    name: 'Đêm', 
    range: '00:00 - 05:59', 
    Icon: MoonStar,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20'
  },
];

interface Forecast {
  predicted: number;
  trend: 'Tăng' | 'Giảm' | 'Ổn định';
  confidence: number;
  change: number;
}

// Loading skeleton component
function HeatmapSkeleton() {
  return (
    <div className="glass-card p-6 min-h-[420px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-14 h-8 bg-white/5 rounded animate-pulse" />
            <div className="flex-1 grid grid-cols-7 gap-1.5">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[420px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 mx-auto">
          <Grid size={32} className="text-cyan-400 opacity-50" />
        </div>
        <p className="text-lg font-black text-white mb-2">Chưa có dữ liệu</p>
        <p className="text-sm text-slate-400 max-w-xs">
          Hãy uống ngụm nước đầu tiên để bắt đầu theo dõi thói quen của bạn!
        </p>
      </motion.div>
    </div>
  );
}

export default function HourlyHeatmapUltimate({ userId, className = '' }: HourlyHeatmapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<{ amount?: number; created_at: string; day?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{x: number; y: number} | null>(null);

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
      } catch (err: unknown) {
        console.error(err);
        if (mounted) setError('Không thể tải dữ liệu heatmap');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [userId, last7Days]);

  // Process data
  const { grid, maxVal, insight, totalIntake, bestBlock, worstBlock } = useMemo(() => {
    const g = Array(7).fill(0).map(() => Array(4).fill(0));
    const blockTotals = [0, 0, 0, 0];

    logs.forEach((log) => {
      const dateStr = log.day || new Date(log.created_at).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(d => d.dateStr === dateStr);
      if (dayIndex === -1) return;

      const hour = new Date(log.created_at).getHours();
      let blockIndex = 3;
      if (hour >= 6 && hour < 12) blockIndex = 0;
      else if (hour >= 12 && hour < 18) blockIndex = 1;
      else if (hour >= 18 && hour <= 23) blockIndex = 2;

      const amount = log.amount || 0;
      g[dayIndex][blockIndex] += amount;
      blockTotals[blockIndex] += amount;
    });

    const max = Math.max(1, ...g.flat());
    const totalIntake = blockTotals.reduce((a, b) => a + b, 0);

    // Find best and worst performing blocks
    const daytimeTotals = blockTotals.slice(0, 3);
    const maxBlockIndex = daytimeTotals.indexOf(Math.max(...daytimeTotals));
    const minBlockIndex = daytimeTotals.indexOf(Math.min(...daytimeTotals));

    let insightMsg = "Thói quen uống nước của bạn khá đều trong ngày.";
    if (totalIntake > 0) {
      const maxBlock = BLOCKS[maxBlockIndex];
      const minBlock = BLOCKS[minBlockIndex];
      insightMsg = `Bạn uống nhiều nhất vào buổi ${maxBlock.name} (${blockTotals[maxBlockIndex].toLocaleString('vi-VN')}ml) và ít nhất vào buổi ${minBlock.name}.`;
    }

    return { 
      grid: g, 
      maxVal: max, 
      insight: insightMsg,
      totalIntake,
      blockTotals,
      bestBlock: maxBlockIndex,
      worstBlock: minBlockIndex
    };
  }, [logs, last7Days]);

  // Enhanced forecast with trend analysis
  const forecast = useMemo<Forecast>(() => {
    const dayTotals = last7Days.map(day => {
      const logsInDay = logs.filter(log => log.day === day.dateStr);
      return logsInDay.reduce((sum, log) => sum + (log.amount || 0), 0);
    });

    const recentAvg = dayTotals.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = dayTotals.slice(0, 4).reduce((a, b) => a + b, 0) / 4 || recentAvg;

    const diff = recentAvg - olderAvg;
    const predicted = Math.round(recentAvg + diff * 0.6);
    const confidence = Math.min(90, Math.max(45, 65 + Math.abs(diff) * 0.08));
    const changePercent = olderAvg > 0 ? Math.round((diff / olderAvg) * 100) : 0;

    return {
      predicted: Math.max(0, predicted),
      trend: diff > 100 ? 'Tăng' : diff < -100 ? 'Giảm' : 'Ổn định',
      confidence: Math.round(confidence),
      change: changePercent
    };
  }, [logs, last7Days]);

  // Design system compliant cell styling
  const getCellStyle = (val: number, max: number) => {
    if (val === 0) {
      return {
        bg: 'bg-white/[0.03]',
        border: 'border-white/5',
        shadow: '',
      };
    }
    
    const ratio = val / max;
    
    // Using design system surface levels and cyan accent
    if (ratio < 0.25) {
      return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        shadow: '',
      };
    }
    if (ratio < 0.5) {
      return {
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/30',
        shadow: 'shadow-sm',
      };
    }
    if (ratio < 0.75) {
      return {
        bg: 'bg-cyan-500/40',
        border: 'border-cyan-500/50',
        shadow: 'shadow-md shadow-cyan-500/20',
      };
    }
    
    // Max intensity with design system compliant glow
    return {
      bg: 'bg-cyan-400',
      border: 'border-cyan-300',
      shadow: 'shadow-[0_0_16px_rgba(34,211,238,0.5)]',
    };
  };

  if (isLoading) return <HeatmapSkeleton />;
  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-rose-400 font-medium">{error}</p>
      </div>
    );
  }
  if (logs.length === 0) return <EmptyState />;

  const TrendIcon = forecast.trend === 'Tăng' ? TrendingUp : 
                    forecast.trend === 'Giảm' ? TrendingDown : Minus;

  return (
    <div className={`glass-card p-5 relative overflow-hidden group ${className}`}>
      {/* Ambient glow - design system compliant */}
      <div 
        className="absolute -top-20 -right-20 w-64 h-64 blur-[120px] rounded-full pointer-events-none opacity-40 transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Grid size={20} className="text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Phân bổ theo giờ</h3>
            <p className="text-xs text-slate-400 font-medium">7 ngày qua • Heatmap</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">
            {totalIntake.toLocaleString('vi-VN')}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            ml tổng
          </p>
        </div>
      </div>

      {/* Day labels */}
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-14 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-7 gap-1.5">
          {last7Days.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] font-bold text-slate-400">
                {day.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-2.5 relative z-10">
        {BLOCKS.map((block, y) => {
          const BlockIcon = block.Icon;
          const isHighlighted = y === bestBlock || y === worstBlock;
          
          return (
            <motion.div
              key={y}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: y * 0.05 }}
              className="flex items-center gap-3"
            >
              {/* Time block label */}
              <div className={`w-14 flex-shrink-0 ${isHighlighted ? 'opacity-100' : 'opacity-80'}`}>
                <div className={`text-xs font-bold flex items-center gap-1.5 ${block.color}`}>
                  <BlockIcon size={14} aria-hidden="true" />
                  <span>{block.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {block.range}
                </div>
              </div>

              {/* Cells */}
              <div 
                className="flex-1 grid grid-cols-7 gap-1.5"
                role="group"
                aria-label={`${block.name} hydration data`}
              >
                {last7Days.map((day, x) => {
                  const val = grid[x][y];
                  const style = getCellStyle(val, maxVal);
                  const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                  
                  return (
                    <motion.div
                      key={`${x}-${y}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (y * 7 + x) * 0.01 }}
                      whileHover={{ scale: 1.08, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      onHoverStart={() => setHoveredCell({ x, y })}
                      onHoverEnd={() => setHoveredCell(null)}
                      className="relative aspect-square cursor-pointer group/cell"
                      role="button"
                      tabIndex={0}
                      aria-label={`${day.label}, ${block.name}: ${val} milliliters`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setHoveredCell({ x, y });
                        }
                      }}
                    >
                      <div 
                        className={`w-full h-full rounded-2xl border transition-all duration-200 ${style.bg} ${style.border} ${style.shadow}`}
                      />
                      
                      {/* Value display for larger values */}
                      {val >= 300 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white drop-shadow-sm">
                            {(val / 1000).toFixed(1)}L
                          </span>
                        </div>
                      )}

                      {/* Tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
                          >
                            <div className="glass-card-strong px-3 py-2 text-xs shadow-2xl whitespace-nowrap">
                              <p className="text-white font-bold mb-0.5">
                                {day.label} • {block.name}
                              </p>
                              <p className="text-cyan-400 font-black">
                                {val.toLocaleString('vi-VN')} ml
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Block performance badges */}
      <div className="mt-5 flex gap-2 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-stat px-3 py-2 flex items-center gap-2 border-emerald-500/20"
        >
          <Trophy size={14} className="text-emerald-400" aria-hidden="true" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Tốt nhất
            </p>
            <p className="text-sm font-black text-emerald-400">
              {BLOCKS[bestBlock].name}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-stat px-3 py-2 flex items-center gap-2 border-orange-500/20"
        >
          <Target size={14} className="text-orange-400" aria-hidden="true" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Cải thiện
            </p>
            <p className="text-sm font-black text-orange-400">
              {BLOCKS[worstBlock].name}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Insights & Forecast */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        {/* Insight card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Award size={16} className="text-cyan-400" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Phát hiện
            </p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {insight}
          </p>
        </motion.div>

        {/* Forecast card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4 rounded-2xl border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <TrendIcon size={16} className={
                forecast.trend === 'Tăng' ? 'text-emerald-400' :
                forecast.trend === 'Giảm' ? 'text-orange-400' :
                'text-slate-400'
              } aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                Dự báo mai
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">
              ~{forecast.confidence}%
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">
              {forecast.predicted.toLocaleString('vi-VN')}
            </span>
            <span className="text-sm text-slate-400 font-medium">ml</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-bold ${
              forecast.trend === 'Tăng' ? 'text-emerald-400' :
              forecast.trend === 'Giảm' ? 'text-orange-400' :
              'text-slate-400'
            }`}>
              {forecast.trend}
            </p>
            {forecast.change !== 0 && (
              <span className="text-xs text-slate-400">
                ({forecast.change > 0 ? '+' : ''}{forecast.change}%)
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}