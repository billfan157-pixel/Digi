import i18n from '@/i18n';

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
      label: i18n.t('pricing.plus_monthly'),
    },
    yearly: {
      vnd: 399_000,
      label: i18n.t('pricing.plus_yearly'),
      perMonth: i18n.t('pricing.plus_per_month'),
      discount: i18n.t('pricing.plus_discount'),
    },
  },
  pro: {
    monthly: {
      vnd: 99_000,
      label: i18n.t('pricing.pro_monthly'),
    },
    yearly: {
      vnd: 799_000,
      label: i18n.t('pricing.pro_yearly'),
      perMonth: i18n.t('pricing.pro_per_month'),
      discount: i18n.t('pricing.pro_discount'),
    },
  },
} as const;

// ── Danh sách tính năng hiển thị ────────

export const PREMIUM_HIGHLIGHTS = [
  {
    icon: '🧠',
    title: i18n.t('premium_highlights.0.title'),
    description: i18n.t('premium_highlights.0.description'),
    free: i18n.t('premium_highlights.0.free'),
    plus: i18n.t('premium_highlights.0.plus'),
    pro: i18n.t('premium_highlights.0.pro'),
  },
  {
    icon: '💎',
    title: i18n.t('premium_highlights.1.title'),
    description: i18n.t('premium_highlights.1.description'),
    free: i18n.t('premium_highlights.1.free'),
    plus: i18n.t('premium_highlights.1.plus'),
    pro: i18n.t('premium_highlights.1.pro'),
  },
  {
    icon: '🔔',
    title: i18n.t('premium_highlights.2.title'),
    description: i18n.t('premium_highlights.2.description'),
    free: i18n.t('premium_highlights.2.free'),
    plus: i18n.t('premium_highlights.2.plus'),
    pro: i18n.t('premium_highlights.2.pro'),
  },
  {
    icon: '🛡️',
    title: i18n.t('premium_highlights.3.title'),
    description: i18n.t('premium_highlights.3.description'),
    free: i18n.t('premium_highlights.3.free'),
    plus: i18n.t('premium_highlights.3.plus'),
    pro: i18n.t('premium_highlights.3.pro'),
  },
  {
    icon: '🔄',
    title: i18n.t('premium_highlights.4.title'),
    description: i18n.t('premium_highlights.4.description'),
    free: i18n.t('premium_highlights.4.free'),
    plus: i18n.t('premium_highlights.4.plus'),
    pro: i18n.t('premium_highlights.4.pro'),
  },
  {
    icon: '🍹',
    title: i18n.t('premium_highlights.5.title'),
    description: i18n.t('premium_highlights.5.description'),
    free: i18n.t('premium_highlights.5.free'),
    plus: i18n.t('premium_highlights.5.plus'),
    pro: i18n.t('premium_highlights.5.pro'),
  },
  {
    icon: '⌚',
    title: i18n.t('premium_highlights.6.title'),
    description: i18n.t('premium_highlights.6.description'),
    free: i18n.t('premium_highlights.6.free'),
    plus: i18n.t('premium_highlights.6.plus'),
    pro: i18n.t('premium_highlights.6.pro'),
  },
  {
    icon: '👑',
    title: i18n.t('premium_highlights.7.title'),
    description: i18n.t('premium_highlights.7.description'),
    free: i18n.t('premium_highlights.7.free'),
    plus: i18n.t('premium_highlights.7.plus'),
    pro: i18n.t('premium_highlights.7.pro'),
  },
  {
    icon: '⚔️',
    title: i18n.t('premium_highlights.8.title'),
    description: i18n.t('premium_highlights.8.description'),
    free: i18n.t('premium_highlights.8.free'),
    plus: i18n.t('premium_highlights.8.plus'),
    pro: i18n.t('premium_highlights.8.pro'),
  },
  {
    icon: '🚫',
    title: i18n.t('premium_highlights.9.title'),
    description: i18n.t('premium_highlights.9.description'),
    free: i18n.t('premium_highlights.9.free'),
    plus: i18n.t('premium_highlights.9.plus'),
    pro: i18n.t('premium_highlights.9.pro'),
  },
] as const;

export type BillingPlan = 'monthly' | 'yearly';

