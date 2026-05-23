// ============================================================
// DigiWell — Premium Feature Config (Upgraded to 3-Tier Model)
// ============================================================

export type PremiumTier = 'free' | 'plus' | 'pro';

// ── Giới hạn sử dụng mỗi ngày ─────────────────────────────

export const DAILY_LIMITS = {
  free: {
    aiMessages:   5,   
    aiAdvice:     3,   
    aiScans:      2,
    historyDays:  7,   
  },
  plus: {
    aiMessages:   15,
    aiAdvice:     5,
    aiScans:      10,
    historyDays:  30,
  },
  pro: {
    aiMessages:   Infinity,
    aiAdvice:     Infinity,
    aiScans:      Infinity,
    historyDays:  365,
  },
} as const;

// ── Feature flags theo tier ────────────────────────────────

export const FEATURES = {
  // AI Features
  aiChat:               { free: true,  plus: true,  pro: true  },
  aiUnlimitedChat:      { free: false, plus: false, pro: true  },
  aiWeeklyReport:       { free: false, plus: true,  pro: true  },
  aiMonthlyReport:      { free: false, plus: false, pro: true  },

  aiHydrationCoach:     { free: false, plus: false, pro: true  },
  premiumHealthScore:   { free: false, plus: false, pro: true  },

  // Analytics & Specialized
  basicStats:           { free: true,  plus: true,  pro: true  },
  weeklyChart:          { free: false, plus: true,  pro: true  },
  monthlyChart:         { free: false, plus: false, pro: true  },
  exportReport:         { free: false, plus: false, pro: true  },
  streakCalendar:       { free: true,  plus: true,  pro: true  },
  advancedInsights:     { free: false, plus: false, pro: true  },

  // Device Integration
  weatherSync:          { free: true,  plus: true,  pro: true  },
  calendarSync:         { free: false, plus: false, pro: true  },
  smartwatchSync:       { free: false, plus: false, pro: true  },

  // Smart Reminder Engine
  smartReminders:       { free: false, plus: false, pro: true  },

  // Streak Freeze
  streakFreeze:         { free: false, plus: true,  pro: true  },
  // Redemption Quest
  redemptionQuest:      { free: false, plus: false, pro: true  },
  // Advanced Drink System
  advancedDrinkSystem:  { free: false, plus: true,  pro: true  },

  // Customization & UX
  customReminders:      { free: false, plus: true,  pro: true  },
  customGoals:          { free: true,  plus: true,  pro: true  },
  themes:               { free: false, plus: true,  pro: true  },

  // Premium Profile Frame
  premiumProfileFrame:  { free: false, plus: true,  pro: true  },
  // VIP Club Tools
  vipClubTools:         { free: false, plus: false, pro: true  },

  // Gỡ quảng cáo
  ads:                  { free: true,  plus: false, pro: false },
} as const;

export type FeatureKey = keyof typeof FEATURES;

// ── Pricing ────────────────────────────────────────────────

export const PRICING = {
  plus: {
    monthly: {
      vnd: 49_000,
      label: '49.000₫/tháng',
    },
    yearly: {
      vnd: 399_000,
      label: '399.000₫/năm',
      perMonth: '33.250₫/tháng',
      discount: 'Tiết kiệm 32%',
    },
  },
  pro: {
    monthly: {
      vnd: 99_000,
      label: '99.000₫/tháng',
    },
    yearly: {
      vnd: 799_000,
      label: '799.000₫/năm',
      perMonth: '66.580₫/tháng',
      discount: 'Tiết kiệm 33%',
    },
  },
} as const;

// ── Danh sách tính năng hiển thị ────────

export const PREMIUM_HIGHLIGHTS = [
  {
    icon: '🧠',
    title: 'AI Hydration Coach thông minh',
    description: 'AI tự động điều chỉnh mục tiêu nước theo thời tiết, vận động, giấc ngủ và cafe',
    free: 'Mục tiêu cố định',
    plus: 'Mục tiêu cố định',
    pro: 'AI tự động điều chỉnh',
  },
  {
    icon: '💎',
    title: 'Premium Health Score',
    description: 'Dashboard điểm số Hydration, Recovery, Energy, Consistency',
    free: '—',
    plus: '—',
    pro: '4 điểm số chi tiết',
  },
  {
    icon: '🔔',
    title: 'Smart Reminder Engine',
    description: 'AI biết bạn đang ngủ, họp, lái xe và tự động điều chỉnh nhắc nhở',
    free: 'Nhắc cố định',
    plus: 'Nhắc cố định',
    pro: 'AI context-aware',
  },
  {
    icon: '🛡️',
    title: 'Streak Freeze',
    description: 'Bảo vệ streak hàng tháng, không mất tiến độ nếu quên uống',
    free: '—',
    plus: '1 ngày/tháng',
    pro: '3 ngày/tháng',
  },
  {
    icon: '🔄',
    title: 'Redemption Quest',
    description: 'Nếu gãy streak, AI cho nhiệm vụ cứu để khôi phục lại',
    free: '—',
    plus: '—',
    pro: 'Nhiệm vụ cứu streak',
  },
  {
    icon: '🍹',
    title: 'Advanced Drink System',
    description: 'Hệ số nước cho từng loại đồ uống (Water=1.0, Coffee=-0.2, Alcohol=-0.5)',
    free: '—',
    plus: 'Hệ số cơ bản',
    pro: 'Hệ số chi tiết',
  },
  {
    icon: '⌚',
    title: 'Smartwatch & Health Sync',
    description: 'Kết nối Apple Watch, Wear OS, Apple Health, Google Fit',
    free: '—',
    plus: '—',
    pro: 'Tất cả thiết bị',
  },
  {
    icon: '👑',
    title: 'Premium Profile Frame',
    description: 'Viền avatar động, tên vàng, hiệu ứng log nước, danh hiệu hiếm',
    free: '—',
    plus: 'Khung viền bạc',
    pro: 'Khung viền vàng động',
  },
  {
    icon: '⚔️',
    title: 'VIP Club Tools',
    description: 'Tạo bang lớn, logo riêng, quest club, thông báo VIP, xếp hạng nâng cao',
    free: '—',
    plus: '—',
    pro: 'Công cụ VIP',
  },
  {
    icon: '🚫',
    title: 'Không quảng cáo',
    description: 'Trải nghiệm app mượt mà, sạch sẽ, không bị làm phiền bởi quảng cáo',
    free: 'Có Ads',
    plus: '100% Sạch',
    pro: '100% Sạch',
  },
] as const;

export type BillingPlan = 'monthly' | 'yearly';

