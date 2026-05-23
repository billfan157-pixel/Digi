/**
 * Sprint 13-14: AI Personalization Engine
 * Smart Reminder Banner — hiển thị reminder thông minh trên HomeTab
 * Tối ưu hóa không gian: Compact, Glassmorphism, Premium Cyberpunk HUD style.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Droplets, Clock, Zap, Thermometer, AlertTriangle, X } from 'lucide-react';
import type { SmartReminder } from '../../lib/smartReminderEngine';
import { glassCard } from '../../styles/glass';

interface SmartReminderBannerProps {
  reminder: SmartReminder | null;
  onDismiss: () => void;
  onSnooze: (minutes?: number) => void;
  onDrink: (amount: number) => void;
}

const REASON_ICONS: Record<string, React.ReactNode> = {
  blind_spot: <AlertTriangle size={12} />,
  weather_alert: <Thermometer size={12} />,
  post_event: <Zap size={12} />,
  interval: <Clock size={12} />,
  catch_up: <Droplets size={12} />,
};

const REASON_COLORS: Record<string, { border: string; accent: string; glow: string }> = {
  blind_spot: {
    border: 'border-amber-500/20 focus-within:border-amber-500/40',
    accent: 'text-amber-400',
    glow: 'from-amber-500 to-orange-500',
  },
  weather_alert: {
    border: 'border-rose-500/20 focus-within:border-rose-500/40',
    accent: 'text-rose-400',
    glow: 'from-rose-500 to-red-500',
  },
  post_event: {
    border: 'border-violet-500/20 focus-within:border-violet-500/40',
    accent: 'text-violet-400',
    glow: 'from-violet-500 to-purple-500',
  },
  interval: {
    border: 'border-cyan-500/20 focus-within:border-cyan-500/40',
    accent: 'text-cyan-400',
    glow: 'from-cyan-500 to-blue-500',
  },
  catch_up: {
    border: 'border-emerald-500/20 focus-within:border-emerald-500/40',
    accent: 'text-emerald-400',
    glow: 'from-emerald-500 to-green-500',
  },
};

const SmartReminderBanner = React.memo(function SmartReminderBanner({
  reminder,
  onDismiss,
  onSnooze,
  onDrink,
}: SmartReminderBannerProps) {
  if (!reminder) return null;

  const colors = REASON_COLORS[reminder.reason] || {
    border: 'border-white/10',
    accent: 'text-cyan-400',
    glow: 'from-slate-500 to-slate-400',
  };

  return (
    <>
      {reminder && (
        <motion.div
          key={reminder.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`${glassCard} relative overflow-hidden rounded-[1.25rem] border ${colors.border} p-3.5 mx-5 flex flex-col gap-2.5`}
        >
          {/* Ambient left glow indicator */}
          <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${colors.glow}`} />

          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`${colors.accent} shrink-0`}>
                {REASON_ICONS[reminder.reason] || <Bell size={12} />}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${colors.accent}`}>
                {reminder.reason === 'blind_spot' && 'Tránh giờ quên'}
                {reminder.reason === 'weather_alert' && 'Cảnh báo thời tiết'}
                {reminder.reason === 'post_event' && 'Hồi phục hoạt động'}
                {reminder.reason === 'interval' && 'Nhắc nhở định kỳ'}
                {reminder.reason === 'catch_up' && 'Bắt kịp mục tiêu'}
              </span>
              {reminder.priority === 'high' && (
                <span className="text-[7px] font-black bg-rose-500/10 border border-rose-500/25 text-rose-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                  Gấp
                </span>
              )}
            </div>
            <button
              onClick={onDismiss}
              title="Bỏ qua"
              className="w-5 h-5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all active:scale-90"
            >
              <X size={12} />
            </button>
          </div>

          {/* Message Body */}
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed pr-2">
            {reminder.message}
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/[0.03]">
            {/* Snooze Button */}
            <button
              onClick={() => onSnooze(15)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-bold text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all active:scale-95"
            >
              <Clock size={11} className="text-slate-500" />
              <span>Nhắc lại sau 15p</span>
            </button>

            {/* Drink Button */}
            <button
              onClick={() => onDrink(reminder.suggestedAmount)}
              className={`h-7 px-3 rounded-lg bg-gradient-to-r ${colors.glow} text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]`}
            >
              <Droplets size={11} className="text-slate-950" />
              <span>Uống {reminder.suggestedAmount}ml</span>
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
});

export default SmartReminderBanner;