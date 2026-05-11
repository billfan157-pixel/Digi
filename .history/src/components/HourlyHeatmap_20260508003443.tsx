import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid, Activity, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HourlyHeatmapProps {
  userId?: string;
}

const BLOCKS = [
  { name: 'Sáng', range: '06:00 - 11:59' },
  { name: 'Chiều', range: '12:00 - 17:59' },
  { name: 'Tối', range: '18:00 - 23:59' },
  { name: 'Đêm', range: '00:00 - 05:59' }
];

export default function HourlyHeatmap({ userId }: HourlyHeatmapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  // Lấy 7 ngày qua
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: i === 0 ? 'Nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      });
    }
    return days;
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const startDate = last7Days[0].dateStr;
        const { data, error } = await supabase
          .from('water_logs')
          .select('amount, created_at')
          .eq('user_id', userId)
          .gte('created_at', `${startDate}T00:00:00.000Z`);

        if (error) throw error;
        if (mounted) setLogs(data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu heatmap:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [userId, last7Days]);

  // Xử lý dữ liệu vào Grid: grid[dayIndex][blockIndex] = totalMl
  const { grid, maxVal, insight } = useMemo(() => {
    const g = Array(7).fill(0).map(() => Array(4).fill(0));
    const blockTotals = [0, 0, 0, 0];

    logs.forEach(log => {
      const dateObj = new Date(log.created_at);
      const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      const dayIndex = last7Days.findIndex(d => d.dateStr === localDateStr);
      if (dayIndex !== -1) {
        const hour = dateObj.getHours();
        let b = 0;
        if (hour >= 6 && hour < 12) b = 0;
        else if (hour >= 12 && hour < 18) b = 1;
        else if (hour >= 18 && hour <= 23) b = 2;
        else b = 3;
        
        g[dayIndex][b] += (log.amount || 0);
        blockTotals[b] += (log.amount || 0);
      }
    });

    let max = 1; // Tránh chia 0
    g.forEach(day => day.forEach(val => { if (val > max) max = val; }));

    // Tìm block uống nhiều nhất và ít nhất (bỏ qua Đêm để Insight tự nhiên hơn)
    const daytimeTotals = blockTotals.slice(0, 3); 
    const maxBlockIdx = daytimeTotals.indexOf(Math.max(...daytimeTotals));
    const minBlockIdx = daytimeTotals.indexOf(Math.min(...daytimeTotals));

    let msg = "Bạn đang phân bổ lượng nước khá đều đặn.";
    if (blockTotals.reduce((a, b) => a + b, 0) > 0) {
      msg = `Cơ thể bạn thường nạp nhiều nước nhất vào buổi ${BLOCKS[maxBlockIdx].name} và hay quên uống vào buổi ${BLOCKS[minBlockIdx].name}.`;
    }

    return { grid: g, maxVal: max, insight: msg };
  }, [logs, last7Days]);

  const getCellClass = (val: number, max: number) => {
    if (val === 0) return 'bg-slate-800/40 border-slate-700/30';
    const ratio = val / max;
    if (ratio < 0.3) return 'bg-cyan-900/60 border-cyan-800/50';
    if (ratio < 0.7) return 'bg-cyan-600/80 border-cyan-500/50';
    return 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)]';
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 size={24} className="text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Đang vẽ bản đồ nhiệt...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
      {/* BG Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Grid size={16} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider">Phân bổ theo giờ</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7 ngày qua</span>
      </div>

      {/* Heatmap Grid */}
      <div className="relative z-10 flex flex-col gap-2.5">
        {/* Top Labels (Days) */}
        <div className="flex items-center ml-12 gap-1.5">
          {last7Days.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] font-bold text-slate-500 uppercase">
              {d.label}
            </div>
          ))}
        </div>

        {/* Rows (Blocks) */}
        {BLOCKS.map((block, y) => (
          <div key={block.name} className="flex items-center gap-2">
            <div className="w-10 shrink-0 text-right">
              <p className="text-[10px] font-black text-slate-300">{block.name}</p>
            </div>
            
            <div className="flex-1 flex gap-1.5">
              {last7Days.map((_, x) => {
                const val = grid[x][y];
                return (
                  <motion.div
                    key={`${x}-${y}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (x * 0.05) + (y * 0.05), type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative flex-1 aspect-square group/cell"
                  >
                    <div className={`w-full h-full rounded-md border transition-colors duration-300 ${getCellClass(val, maxVal)}`} />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity z-20">
                      <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/10">
                        {val > 0 ? `${val.toLocaleString('vi-VN')} ml` : 'Không có'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-end gap-1.5 relative z-10">
        <span className="text-[9px] font-bold text-slate-500 uppercase mr-1">Ít</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/40 border border-slate-700/30" />
        <div className="w-2.5 h-2.5 rounded-sm bg-cyan-900/60 border border-cyan-800/50" />
        <div className="w-2.5 h-2.5 rounded-sm bg-cyan-600/80 border border-cyan-500/50" />
        <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 border border-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.4)]" />
        <span className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nhiều</span>
      </div>

      {/* Insight Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-5 pt-4 border-t border-white/5"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
            <Activity size={10} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-0.5">
              Phát hiện thói quen
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {insight}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}