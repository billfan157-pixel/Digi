export interface ExpertContext {
  waterToday: number;
  waterGoal: number;
  streak: number;
  hour: number;
  dayOfWeek: number;
  weather?: { temp: number; humidity: number };
  sleepHours?: number;
  activityLevel?: string; // 'sedentary' | 'moderate' | 'active' | 'very_active'
  weeklyAvgCompletion?: number; // 0-1 (e.g. 0.85)
  minutesSinceLastDrink?: number; // minutes since last water log
}

export interface ExpertAdvice {
  text: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'hydration' | 'timing' | 'weather' | 'activity' | 'motivation';
  suggestedAmount?: number; // suggested next intake in ml
}

interface Rule {
  id: string;
  category: ExpertAdvice['category'];
  priority: ExpertAdvice['priority'];
  condition: (ctx: ExpertContext) => boolean;
  getAdvice: (ctx: ExpertContext) => { text: string; suggestedAmount?: number };
}

const RULES: Rule[] = [
  // --- CRITICAL HYDRATION RULES ---
  {
    id: 'crit_afternoon_deficit',
    category: 'hydration',
    priority: 'critical',
    condition: (ctx) => ctx.hour >= 14 && ctx.hour < 18 && ctx.waterToday < ctx.waterGoal * 0.3,
    getAdvice: (ctx) => {
      const pct = Math.round((ctx.waterToday / ctx.waterGoal) * 100);
      return {
        text: `Đã chiều rồi mà đệ mới đạt ${pct}% mục tiêu. Uống ngay một ly 350ml để bù nước và lấy lại tỉnh táo nào!`,
        suggestedAmount: 350,
      };
    },
  },
  {
    id: 'crit_evening_deficit',
    category: 'hydration',
    priority: 'critical',
    condition: (ctx) => ctx.hour >= 18 && ctx.waterToday < ctx.waterGoal * 0.5,
    getAdvice: (ctx) => {
      const pct = Math.round((ctx.waterToday / ctx.waterGoal) * 100);
      return {
        text: `Tối muộn rồi nhưng đệ mới đạt ${pct}% mục tiêu nước. Hãy chia nhỏ lượng uống, làm ngay 300ml nước ấm nhé.`,
        suggestedAmount: 300,
      };
    },
  },
  {
    id: 'crit_severe_dehydration',
    category: 'hydration',
    priority: 'critical',
    condition: (ctx) => ctx.hour >= 10 && ctx.waterToday === 0,
    getAdvice: () => ({
      text: 'Đã nửa ngày trôi qua mà đệ chưa hớp ngụm nước nào! Hãy rót ngay một cốc nước lọc lớn (400ml) uống đi nhé.',
      suggestedAmount: 400,
    }),
  },

  // --- WEATHER ADVICE RULES ---
  {
    id: 'weather_extreme_heat',
    category: 'weather',
    priority: 'high',
    condition: (ctx) => !!ctx.weather && ctx.weather.temp >= 35,
    getAdvice: (ctx) => ({
      text: `Nhiệt độ ngoài trời rất cao (${ctx.weather!.temp}°C). Cơ thể mất nước qua mồ hôi cực nhanh, đệ nên uống thêm 250ml nước mát nhé.`,
      suggestedAmount: 250,
    }),
  },
  {
    id: 'weather_heat_humidity',
    category: 'weather',
    priority: 'high',
    condition: (ctx) => !!ctx.weather && ctx.weather.temp >= 32 && ctx.weather.humidity >= 75,
    getAdvice: () => ({
      text: 'Thời tiết nắng nóng oi bức và độ ẩm cao. Hãy chuẩn bị sẵn một bình nước bên cạnh để nhấp từng ngụm nhỏ liên tục.',
      suggestedAmount: 200,
    }),
  },
  {
    id: 'weather_cold_dry',
    category: 'weather',
    priority: 'medium',
    condition: (ctx) => !!ctx.weather && ctx.weather.temp <= 18,
    getAdvice: () => ({
      text: 'Trời lạnh làm giảm cảm giác khát nhưng cơ thể vẫn cần nước để trao đổi chất. Uống một cốc nước ấm nhẹ nhé.',
      suggestedAmount: 250,
    }),
  },

  // --- ACTIVITY BASED RULES ---
  {
    id: 'activity_very_active',
    category: 'activity',
    priority: 'high',
    condition: (ctx) => ctx.activityLevel === 'very_active' || ctx.activityLevel === 'active',
    getAdvice: () => ({
      text: 'Đệ vận động nhiều hôm nay. Đừng đợi khát mới uống, hãy uống 250ml nước trước và sau khi tập để tránh mỏi cơ nhé.',
      suggestedAmount: 250,
    }),
  },
  {
    id: 'activity_sedentary_warning',
    category: 'activity',
    priority: 'medium',
    condition: (ctx) => ctx.activityLevel === 'sedentary' && ctx.hour >= 11 && ctx.minutesSinceLastDrink !== undefined && ctx.minutesSinceLastDrink > 150,
    getAdvice: () => ({
      text: 'Ngồi làm việc lâu một chỗ dễ quên uống nước. Đứng dậy đi lại một chút và rót cốc nước 200ml thư giãn nào.',
      suggestedAmount: 200,
    }),
  },

  // --- SLEEP INFLUENCE RULES ---
  {
    id: 'sleep_deficit_morning',
    category: 'hydration',
    priority: 'high',
    condition: (ctx) => ctx.hour < 11 && !!ctx.sleepHours && ctx.sleepHours < 6,
    getAdvice: () => ({
      text: 'Đêm qua đệ ngủ hơi ít. Thiếu ngủ làm mất cân bằng điện giải, hãy uống một ly nước lọc lớn sáng nay để tỉnh táo hơn.',
      suggestedAmount: 300,
    }),
  },

  // --- TIMING / INTERVAL RULES ---
  {
    id: 'timing_long_time_no_drink',
    category: 'timing',
    priority: 'high',
    condition: (ctx) => ctx.minutesSinceLastDrink !== undefined && ctx.minutesSinceLastDrink >= 180 && ctx.hour >= 7 && ctx.hour < 22,
    getAdvice: (ctx) => ({
      text: `Đã hơn ${Math.round(ctx.minutesSinceLastDrink! / 60)} tiếng đệ chưa ghi nhận uống nước. Hãy bổ sung ngay 250ml để giữ ẩm da và cơ thể.`,
      suggestedAmount: 250,
    }),
  },
  {
    id: 'timing_morning_routine',
    category: 'timing',
    priority: 'medium',
    condition: (ctx) => ctx.hour >= 6 && ctx.hour < 9 && ctx.waterToday < ctx.waterGoal * 0.1,
    getAdvice: () => ({
      text: 'Chào buổi sáng đệ! Rót ngay một ly nước ấm khoảng 200ml uống lúc bụng đói để kích hoạt hệ tiêu hóa nhé.',
      suggestedAmount: 200,
    }),
  },
  {
    id: 'timing_before_sleep',
    category: 'timing',
    priority: 'medium',
    condition: (ctx) => ctx.hour >= 21 && ctx.hour < 23 && ctx.waterToday >= ctx.waterGoal * 0.8,
    getAdvice: () => ({
      text: 'Sắp đến giờ ngủ rồi đệ. Chỉ nên nhấp vài ngụm nước nhỏ (khoảng 100ml) để tránh khô họng mà không bị thức giấc ban đêm.',
      suggestedAmount: 100,
    }),
  },

  // --- MOTIVATION & STREAK RULES ---
  {
    id: 'motivation_streak_high',
    category: 'motivation',
    priority: 'high',
    condition: (ctx) => ctx.streak >= 7 && ctx.waterToday < ctx.waterGoal * 0.7 && ctx.hour >= 16,
    getAdvice: (ctx) => ({
      text: `Đệ đang có chuỗi giữ kỷ lục ${ctx.streak} ngày xuất sắc! Đừng để đứt chuỗi hôm nay nhé, bổ sung thêm nước nào.`,
      suggestedAmount: 250,
    }),
  },
  {
    id: 'motivation_near_goal',
    category: 'motivation',
    priority: 'medium',
    condition: (ctx) => ctx.waterToday >= ctx.waterGoal * 0.85 && ctx.waterToday < ctx.waterGoal,
    getAdvice: (ctx) => {
      const remaining = ctx.waterGoal - ctx.waterToday;
      return {
        text: `Đệ chỉ còn thiếu ${remaining}ml nữa là hoàn thành mục tiêu ngày rồi. Cố gắng lên đệ ơi, sắp cán đích rồi!`,
        suggestedAmount: remaining,
      };
    },
  },
  {
    id: 'motivation_goal_achieved',
    category: 'motivation',
    priority: 'medium',
    condition: (ctx) => ctx.waterToday >= ctx.waterGoal,
    getAdvice: () => ({
      text: 'Quá xuất sắc! Đệ đã đạt 100% mục tiêu uống nước hôm nay rồi. Hãy tiếp tục duy trì thói quen kỷ luật này nhé!',
    }),
  },

  // --- DEFAULT FALLBACK RULES ---
  {
    id: 'default_under_goal',
    category: 'hydration',
    priority: 'low',
    condition: (ctx) => ctx.waterToday < ctx.waterGoal,
    getAdvice: () => ({
      text: 'Hãy uống từng ngụm nước lọc nhỏ đều đặn mỗi 1-2 tiếng để duy trì năng lượng và thanh lọc cơ thể nhé.',
      suggestedAmount: 200,
    }),
  },
  {
    id: 'default_general',
    category: 'hydration',
    priority: 'low',
    condition: () => true,
    getAdvice: () => ({
      text: 'Hãy lắng nghe cơ thể và bổ sung nước lọc bất cứ khi nào cảm thấy khô miệng hay mệt mỏi nhé đệ.',
      suggestedAmount: 200,
    }),
  },
];

/**
 * Evaluates the given hydration context and returns the highest priority advice match.
 */
export function getOfflineAdvice(ctx: ExpertContext): ExpertAdvice {
  // Find all matching rules
  const matches = RULES.filter((rule) => rule.condition(ctx));

  // Priorities weight
  const priorityWeight = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Sort by priority descending
  matches.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  // Fallback to general default rule if none matches (should not happen as default_general is condition: () => true)
  const bestRule = matches[0] || RULES[RULES.length - 1];
  const adviceDetails = bestRule.getAdvice(ctx);

  return {
    text: adviceDetails.text,
    priority: bestRule.priority,
    category: bestRule.category,
    suggestedAmount: adviceDetails.suggestedAmount,
  };
}
