/**
 * habitEngine.ts — Contextual Nudge Engine
 *
 * Generates time-aware, progress-aware hydration nudges.
 * Self-contained, no external state dependency.
 */

import i18n from '@/i18n';

export interface Nudge {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  tint: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}

export function getTimeBasedNudge(params: {
  hour: number;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isFirstOpen?: boolean; // user just opened app for first time today
}): Nudge {
  const { hour, waterIntake, waterGoal, streak, isFirstOpen } = params;
  const pct = waterGoal > 0 ? Math.min((waterIntake / waterGoal) * 100, 100) : 0;
  const remaining = Math.max(0, waterGoal - waterIntake);

  // ── Morning: First open of the day ──
  if (isFirstOpen && hour >= 5 && hour < 10) {
    if (pct === 0) {
      return {
        emoji: '🌅',
        title: i18n.t('home.nudge.morning_title'),
        message: i18n.t('home.nudge.morning_msg'),
        actionLabel: i18n.t('home.nudge.drink_now', { amount: 250 }),
        tint: 'morning',
      };
    }
    return {
      emoji: '☀️',
      title: i18n.t('home.nudge.energy_title'),
      message: i18n.t('home.nudge.energy_msg', { waterIntake, streak }),
      tint: 'morning',
    };
  }

  // ── Late morning / Pre-noon nudge ──
  if (hour >= 10 && hour < 12 && pct < 30) {
    return {
      emoji: '⏰',
      title: i18n.t('home.nudge.mid_morning_title'),
      message: i18n.t('home.nudge.mid_morning_msg', { pct: Math.round(pct) }),
      actionLabel: i18n.t('home.nudge.drink', { amount: 250 }),
      tint: 'noon',
    };
  }

  // ── Noon nudge ──
  if (hour >= 11 && hour < 14 && pct < 50) {
    return {
      emoji: '☀️',
      title: i18n.t('home.nudge.noon_title'),
      message: i18n.t('home.nudge.noon_msg', { waterIntake }),
      actionLabel: pct < 25 ? i18n.t('home.nudge.drink', { amount: 300 }) : undefined,
      tint: 'noon',
    };
  }

  // ── Afternoon check ──
  if (hour >= 14 && hour < 17) {
    if (pct < 50) {
      return {
      emoji: '📉',
      title: i18n.t('home.nudge.afternoon_title'),
      message: i18n.t('home.nudge.afternoon_msg', { pct: Math.round(pct), remaining }),
      actionLabel: i18n.t('home.nudge.drink', { amount: 250 }),
        tint: 'afternoon',
      };
    }
    if (pct < 80) {
      return {
      emoji: '💪',
      title: i18n.t('home.nudge.on_track_title'),
      message: i18n.t('home.nudge.on_track_msg', { pct: Math.round(pct), remaining }),
      tint: 'afternoon',
      };
    }
    return {
      emoji: '🌟',
      title: i18n.t('home.nudge.near_done_title'),
      message: i18n.t('home.nudge.near_done_msg', { remaining }),
      tint: 'afternoon',
    };
  }

  // ── Evening ──
  if (hour >= 17 && hour < 21) {
    if (pct < 80) {
      return {
      emoji: '🌆',
      title: i18n.t('home.nudge.evening_title'),
      message: i18n.t('home.nudge.evening_msg', { remaining, waterGoal }),
      actionLabel: i18n.t('home.nudge.drink', { amount: 200 }),
        tint: 'evening',
      };
    }
    if (pct >= 100) {
      return {
      emoji: '🎉',
      title: i18n.t('home.nudge.excellent_title'),
      message: i18n.t('home.nudge.excellent_msg', { pct: Math.round(pct), streak }),
      tint: 'evening',
      };
    }
    return {
      emoji: '🔥',
      title: i18n.t('home.nudge.finish_title'),
      message: i18n.t('home.nudge.finish_msg', { pct: Math.round(pct), remaining }),
      actionLabel: i18n.t('home.nudge.drink', { amount: Math.min(remaining, 250) }),
      tint: 'evening',
    };
  }

  // ── Late night ──
  if (hour >= 21 || hour < 5) {
    if (pct >= 100) {
      return {
      emoji: '🌙',
      title: i18n.t('home.nudge.good_night_title'),
      message: i18n.t('home.nudge.good_night_msg', { waterIntake, streak }),
      tint: 'night',
      };
    }
    return {
      emoji: '🌙',
      title: i18n.t('home.nudge.late_title'),
      message: i18n.t('home.nudge.late_msg', { hour }),
      tint: 'night',
    };
  }

  // ── Default fallback ──
  return {
    emoji: '💧',
    title: i18n.t('home.nudge.remember_title'),
    message: i18n.t('home.nudge.remember_msg', { waterIntake, waterGoal }),
    tint: 'noon',
  };
}

/**
 * Generates a recommended next-drink time based on current progress.
 */
export function getNextRecommendedDrink(params: {
  waterIntake: number;
  waterGoal: number;
  hour: number;
}): {
  label: string;
  amount: number;
  urgency: 'low' | 'medium' | 'high';
} | null {
  const { waterGoal, hour } = params;
  const pct = params.waterGoal > 0 ? (params.waterIntake / params.waterGoal) : 0;

  // No recommendation if goal already met or it's too late
  if (pct >= 1 || hour >= 22) return null;

  // Calculate even pacing: goal ÷ (16 waking hours) per hour
  const hourlyTarget = waterGoal / 16;
  const hoursLeft = Math.max(1, 21 - hour);
  const remaining = waterGoal - params.waterIntake;
  const perSitting = Math.min(remaining, Math.max(200, Math.round(remaining / hoursLeft)));

  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (pct < 0.3 && hour >= 14) urgency = 'high';
  else if (pct < 0.5 && hour >= 16) urgency = 'high';
  else if (pct < 0.5) urgency = 'medium';
  else if (remaining > hourlyTarget * 3) urgency = 'medium';

  return {
    label: i18n.t('home.nudge.drink', { amount: perSitting }),
    amount: perSitting,
    urgency,
  };
}

export const TINT_STYLES: Record<Nudge['tint'], {
  gradient: string;
  border: string;
  iconBg: string;
  accent: string;
}> = {
  morning: {
    gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
    border: 'border-amber-400/30',
    iconBg: 'bg-amber-500/20',
    accent: 'text-amber-400',
  },
  noon: {
    gradient: 'from-cyan-500/15 via-sky-500/10 to-transparent',
    border: 'border-cyan-400/30',
    iconBg: 'bg-cyan-500/20',
    accent: 'text-cyan-400',
  },
  afternoon: {
    gradient: 'from-violet-500/15 via-purple-500/10 to-transparent',
    border: 'border-violet-400/30',
    iconBg: 'bg-violet-500/20',
    accent: 'text-violet-400',
  },
  evening: {
    gradient: 'from-rose-500/15 via-pink-500/10 to-transparent',
    border: 'border-rose-400/30',
    iconBg: 'bg-rose-500/20',
    accent: 'text-rose-400',
  },
  night: {
    gradient: 'from-indigo-500/15 via-slate-600/10 to-transparent',
    border: 'border-indigo-400/30',
    iconBg: 'bg-indigo-500/20',
    accent: 'text-indigo-400',
  },
};