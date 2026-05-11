/**
 * habitEngine.ts — Contextual Nudge Engine
 *
 * Generates time-aware, progress-aware hydration nudges.
 * Self-contained, no external state dependency.
 */

export interface Nudge {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  tint: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}

function getTimeOfDay(hour: number): Nudge['tint'] {
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 13) return 'noon';
  if (hour >= 13 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
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
  const tint = getTimeOfDay(hour);
  const remaining = Math.max(0, waterGoal - waterIntake);

  // ── Morning: First open of the day ──
  if (isFirstOpen && hour >= 5 && hour < 10) {
    if (pct === 0) {
      return {
        emoji: '🌅',
        title: 'Chào buổi sáng!',
        message: `Một ngày mới bắt đầu. Hãy uống 250ml nước ngay sau khi thức dậy để đánh thức cơ thể!`,
        actionLabel: 'Uống ngay 250ml',
        tint: 'morning',
      };
    }
    return {
      emoji: '☀️',
      title: 'Ngày mới năng lượng!',
      message: `Bạn đã uống ${waterIntake}ml sáng nay. Tiếp tục duy trì nhé! Chuỗi ${streak} ngày rồi 🔥`,
      tint: 'morning',
    };
  }

  // ── Late morning / Pre-noon nudge ──
  if (hour >= 10 && hour < 12 && pct < 30) {
    return {
      emoji: '⏰',
      title: 'Sắp hết buổi sáng!',
      message: `Bạn mới uống ${Math.round(pct)}% mục tiêu. Buổi sáng là khung giờ vàng để nạp nước.`,
      actionLabel: `Uống 250ml`,
      tint: 'noon',
    };
  }

  // ── Noon nudge ──
  if (hour >= 11 && hour < 14 && pct < 50) {
    return {
      emoji: '☀️',
      title: 'Giữa trưa rồi!',
      message: `Trưa nay bạn uống được ${waterIntake}ml. Hãy uống thêm nước khi ăn trưa nhé!`,
      actionLabel: pct < 25 ? `Uống 300ml` : undefined,
      tint: 'noon',
    };
  }

  // ── Afternoon check ──
  if (hour >= 14 && hour < 17) {
    if (pct < 50) {
      return {
        emoji: '📉',
        title: 'Chiều rồi!',
        message: `Bạn mới đạt ${Math.round(pct)}% mục tiêu. Còn ${remaining}ml nữa — cố lên!`,
        actionLabel: `Uống 250ml`,
        tint: 'afternoon',
      };
    }
    if (pct < 80) {
      return {
        emoji: '💪',
        title: 'Đang đi đúng hướng!',
        message: `Đạt ${Math.round(pct)}% rồi. Chỉ còn ${remaining}ml nữa là hoàn thành mục tiêu hôm nay.`,
        tint: 'afternoon',
      };
    }
    return {
      emoji: '🌟',
      title: 'Gần xong rồi!',
      message: `Bạn chỉ còn ${remaining}ml nữa! Buổi chiều này thật tuyệt vời.`,
      tint: 'afternoon',
    };
  }

  // ── Evening ──
  if (hour >= 17 && hour < 21) {
    if (pct < 80) {
      return {
        emoji: '🌆',
        title: 'Buổi tối sắp đến',
        message: `Ngày sắp kết thúc. Còn ${remaining}ml nữa để chạm mốc ${waterGoal}ml. Cố thêm chút nữa!`,
        actionLabel: `Uống 200ml`,
        tint: 'evening',
      };
    }
    if (pct >= 100) {
      return {
        emoji: '🎉',
        title: 'Hoàn thành xuất sắc!',
        message: `Bạn đã đạt ${Math.round(pct)}% mục tiêu. Chuỗi ${streak} ngày — thật đáng tự hào!`,
        tint: 'evening',
      };
    }
    return {
      emoji: '🔥',
      title: 'Về đích!',
      message: `${Math.round(pct)}% — chỉ ${remaining}ml nữa thôi!`,
      actionLabel: `Uống ${Math.min(remaining, 250)}ml`,
      tint: 'evening',
    };
  }

  // ── Late night ──
  if (hour >= 21 || hour < 5) {
    if (pct >= 100) {
      return {
        emoji: '🌙',
        title: 'Chúc ngủ ngon!',
        message: `Ngày hôm nay thật tuyệt! ${waterIntake}ml, ${streak} ngày liên tiếp. Nghỉ ngơi tốt nhé.`,
        tint: 'night',
      };
    }
    return {
      emoji: '🌙',
      title: 'Khuya rồi!',
      message: `Đã ${hour}h, hãy ngủ sớm. Ngày mai hãy bắt đầu sớm hơn nhé!`,
      tint: 'night',
    };
  }

  // ── Default fallback ──
  return {
    emoji: '💧',
    title: 'Nhớ uống nước!',
    message: `Hôm nay bạn uống ${waterIntake}ml / ${waterGoal}ml.`,
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
    label: `Uống ${perSitting}ml`,
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