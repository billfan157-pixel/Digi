// src/utils/healthMath.ts

/**
 * 1. Tính mục tiêu nước dựa trên cân nặng
 */
export const calculateWaterGoal = (weightKg: number): number => {
  return weightKg ? Math.round(weightKg * 35) : 2000;
};

export interface WPFactors {
  logCount?: number;       // Số lần uống trong ngày
  currentTempC?: number;   // Nhiệt độ hiện tại
  exerciseMinutes?: number;// Số phút tập thể dục
  isFasting?: boolean;     // Đang trong chế độ nhịn ăn
  socialPosts?: number;    // Số bài đăng/chia sẻ trong ngày
  socialLikes?: number;    // Số lượt tương tác (thả tim, cụng ly)
}

/**
 * 2. Tính Water Points (WP) - Thuật toán Đa Tầng (Gamification)
 */
export const calculateWP = (
  intake: number = 0, 
  goal: number = 2000, 
  streak: number = 0,
  factors: WPFactors = {}
): number => {
  let wp = 0;
  const pct = goal > 0 ? (intake / goal) * 100 : 0;
  
  // 1. ĐIỂM HOÀN THÀNH CƠ BẢN
  if (pct >= 100) wp += 50;
  else wp += Math.floor((pct / 100) * 30); // Chưa đạt vẫn có điểm khích lệ
  
  // 2. BONUS VƯỢT CHỈ TIÊU (Giới hạn an toàn 150% tránh ngộ độc nước)
  if (pct > 100) {
    const over = Math.min(pct - 100, 50);
    wp += Math.floor(over * 0.5); 
  }
  
  // 3. THƯỞNG TẦN SUẤT UỐNG (Pacing Bonus) - Y khoa khuyên uống rải rác
  if (factors.logCount && factors.logCount >= 3) {
    wp += Math.min((factors.logCount - 2) * 3, 30); // Tối đa +30đ cho 12 lần uống
  }

  // 4. THƯỞNG THỜI TIẾT KHẮC NGHIỆT (Weather Challenge)
  if (factors.currentTempC && pct >= 60) {
    if (factors.currentTempC >= 32) wp += 15; // Nóng gắt (>32°C)
    else if (factors.currentTempC <= 15) wp += 10; // Quá lạnh lười uống (<15°C)
  }

  // 5. THƯỞNG VẬN ĐỘNG THỂ THAO (Active Lifestyle)
  if (factors.exerciseMinutes && factors.exerciseMinutes >= 30 && pct >= 80) {
    wp += 20; // Bù nước tốt trong ngày có tập luyện
  }

  // 6. THƯỞNG NHỊN ĂN (Fasting Challenge)
  if (factors.isFasting && pct >= 80) {
    wp += 15; // Vượt qua cơn đói bằng nước
  }
  
  // 7. THƯỞNG TƯƠNG TÁC CỘNG ĐỒNG (Social Gamification)
  if (factors.socialPosts && factors.socialPosts > 0) {
    wp += Math.min(factors.socialPosts * 10, 30); // +10đ/bài, tối đa 30đ/ngày để chống spam
  }
  if (factors.socialLikes && factors.socialLikes > 0) {
    wp += Math.min(factors.socialLikes * 2, 20); // +2đ/tương tác, tối đa 20đ/ngày
  }

  // 8. HỆ SỐ NHÂN CHUỖI (Streak Multiplier) - Tối đa x2.5 (Tương đương chuỗi 30 ngày)
  const streakMultiplier = 1 + Math.min(streak * 0.05, 1.5);
  
  return Math.floor(wp * streakMultiplier);
};

/**
 * 3. Lấy thông tin hạng (Rank) - Hệ thống E-Sports 8 bậc
 */
export const getRankInfo = (wp: number) => {
  if (wp >= 50000) return { name: 'Thách Đấu', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-400/80', glow: 'shadow-[0_0_20px_rgba(225,29,72,0.8)]' };
  if (wp >= 25000) return { name: 'Đại Cao Thủ', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/60', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.5)]' };
  if (wp >= 15000) return { name: 'Cao Thủ', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_15px_rgba(232,121,249,0.5)]' };
  if (wp >= 10000) return { name: 'Kim Cương', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', glow: 'shadow-[0_0_10px_rgba(96,165,250,0.4)]' };
  if (wp >= 6000) return { name: 'Bạch Kim', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/40', glow: 'shadow-none' };
  if (wp >= 3000) return { name: 'Vàng', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', glow: 'shadow-none' };
  if (wp >= 1000) return { name: 'Bạc', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/40', glow: 'shadow-none' };
  
  return { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-900/10', border: 'border-amber-900/40', glow: 'shadow-none' };
};

/**
 * 4. Tính phần trăm hoàn thành
 */
export const calculateProgress = (current: number, goal: number): number => {
  if (!goal || goal === 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
};

/**
 * 5. Format dung tích (ml -> L)
 */
export const formatVolume = (ml: number): string => {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
};

/**
 * 6. Streak Tier System — Retention Layer
 */
export interface StreakTier {
  name: string;
  emoji: string;
  minStreak: number;
  maxStreak: number | null; // null = infinite
  color: string;
  bg: string;
  border: string;
  xpMultiplier: number;
  description: string;
}

export const STREAK_TIERS: StreakTier[] = [
  { name: 'Giọt', emoji: '💧', minStreak: 0, maxStreak: 6, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', xpMultiplier: 1.0, description: 'Khởi đầu' },
  { name: 'Suối', emoji: '🏞️', minStreak: 7, maxStreak: 13, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', xpMultiplier: 1.1, description: 'Kiên trì' },
  { name: 'Sông', emoji: '🌊', minStreak: 14, maxStreak: 29, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50', xpMultiplier: 1.25, description: 'Kỷ luật' },
  { name: 'Biển', emoji: '🌊', minStreak: 30, maxStreak: 59, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', xpMultiplier: 1.5, description: 'Tinh thần thép' },
  { name: 'Đại Dương', emoji: '🌎', minStreak: 60, maxStreak: null, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/50', xpMultiplier: 2.0, description: 'Bất tử' },
];

export function getStreakTier(streak: number): StreakTier {
  for (const tier of STREAK_TIERS) {
    if (tier.maxStreak === null && streak >= tier.minStreak) return tier;
    if (streak >= tier.minStreak && streak <= (tier.maxStreak ?? Infinity)) return tier;
  }
  return STREAK_TIERS[0];
}

export function getNextStreakTier(streak: number): StreakTier | null {
  for (let i = 0; i < STREAK_TIERS.length - 1; i++) {
    if (streak < STREAK_TIERS[i + 1].minStreak) {
      return STREAK_TIERS[i + 1];
    }
  }
  return null;
}

/**
 * 7. Variable Rewards — Habit Reinforcement
 */
const REWARD_MESSAGES_VN = [
  '💧 Ngon lành! Cơ thể bạn đang cảm ơn bạn đấy.',
  '⚡ Nạp năng lượng thành công!',
  '🌊 Một ngụm nữa gần hơn với mục tiêu!',
  '✨ Uống nước ngon không? Cơ thể bạn cần đó!',
  '🔥 Lửa hydration đang cháy! Đừng dừng lại!',
  '🎯 Bạn đang đi đúng hướng!',
  '🌟 Mỗi giọt nước là một bước đến sức khỏe tốt hơn.',
  '💪 Mạnh mẽ hơn từng ngày!',
  '🌈 Giữ nhịp tốt lắm!',
  '🏆 Bạn xứng đáng với chiến thắng hôm nay!',
];

const REWARD_MESSAGES_MILESTONE = [
  '🎉 Bùng nổ! Bạn đang làm rất tốt!',
  '🚀 Phi thường! Keep it up!',
  '💎 Đẳng cấp! Cơ thể bạn đang ở trạng thái tối ưu!',
  '👑 Huyền thoại! Ngày hôm nay thuộc về bạn!',
];

export function getRandomRewardMessage(streak: number): string {
  const messages = streak >= 7 ? REWARD_MESSAGES_MILESTONE : REWARD_MESSAGES_VN;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 8. Evening Summary Generator
 */
export function generateEveningSummary(params: {
  waterIntake: number;
  waterGoal: number;
  streak: number;
  isGoalReached: boolean;
}): {
  emoji: string;
  title: string;
  message: string;
  tomorrowTip: string;
} {
  const pct = Math.min((params.waterIntake / (params.waterGoal || 1)) * 100, 100);

  if (params.isGoalReached) {
    if (params.streak >= 30) {
      return {
        emoji: '👑',
        title: 'Ngày hoàn hảo!',
        message: `Bạn đã đạt mục tiêu ${pct.toFixed(0)}%. Chuỗi ${params.streak} ngày — ĐẲNG CẤP!`,
        tomorrowTip: 'Duy trì phong độ nhé. Ngày mai lại chinh phục!',
      };
    }
    if (params.streak >= 7) {
      return {
        emoji: '🔥',
        title: 'Xuất sắc!',
        message: `Hoàn thành mục tiêu với ${pct.toFixed(0)}%. Chuỗi ${params.streak} ngày rực lửa!`,
        tomorrowTip: 'Giữ vững đà này, bạn đang xây dựng thói quen bền vững.',
      };
    }
    return {
      emoji: '🎯',
      title: 'Mục tiêu hoàn thành!',
      message: `Bạn đã uống ${params.waterIntake}ml hôm nay. Cơ thể đang ở trạng thái tốt!`,
      tomorrowTip: 'Tiếp tục duy trì để thói quen trở thành bản năng.',
    };
  }

  if (pct >= 70) {
    return {
      emoji: '💪',
      title: 'Gần lắm rồi!',
      message: `Bạn đã đạt ${pct.toFixed(0)}% mục tiêu. Chỉ còn thiếu ${Math.max(0, params.waterGoal - params.waterIntake)}ml.`,
      tomorrowTip: `Hãy uống 250ml ngay bây giờ và hoàn thành ngày hôm nay!`,
    };
  }

  return {
    emoji: '🌱',
    title: 'Ngày mai sẽ tốt hơn!',
    message: `Hôm nay bạn uống được ${params.waterIntake}ml. Mỗi ngày là một cơ hội mới.`,
    tomorrowTip: 'Hãy đặt mục tiêu nhỏ hơn nếu cần. Quan trọng là bắt đầu!',
  };
}
