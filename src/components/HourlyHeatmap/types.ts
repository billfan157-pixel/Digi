import { type LucideIcon, Sun, Cloud, Moon, MoonStar } from 'lucide-react';

export interface HourlyHeatmapProps {
  userId?: string;
  className?: string;
}

export interface DayInfo {
  dateStr: string;
  label: string;
  fullDate: Date;
}

export interface TimeBlock {
  name: string;
  range: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface ForecastInfo {
  predicted: number;
  trend: 'Tăng' | 'Giảm' | 'Ổn định';
  confidence: number;
  change: number;
}

export const BLOCKS: TimeBlock[] = [
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
