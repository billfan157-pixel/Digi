import { describe, it, expect } from 'vitest';
import { getOfflineAdvice, type ExpertContext } from './offlineExpertSystem';

describe('Offline Expert System', () => {
  const baseContext: ExpertContext = {
    waterToday: 1000,
    waterGoal: 2000,
    streak: 3,
    hour: 12,
    dayOfWeek: 4, // Thursday
  };

  it('should trigger crit_afternoon_deficit when afternoon and intake is low', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 15,
      waterToday: 500, // 25% of goal (under 30%)
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('critical');
    expect(advice.category).toBe('hydration');
    expect(advice.text).toContain('Đã chiều rồi mà đệ mới đạt 25% mục tiêu');
    expect(advice.suggestedAmount).toBe(350);
  });

  it('should trigger crit_evening_deficit when evening and intake is low', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 19,
      waterToday: 900, // 45% of goal (under 50%)
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('critical');
    expect(advice.category).toBe('hydration');
    expect(advice.text).toContain('Tối muộn rồi nhưng đệ mới đạt 45% mục tiêu nước');
    expect(advice.suggestedAmount).toBe(300);
  });

  it('should trigger crit_severe_dehydration when half day passed with zero intake', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 10,
      waterToday: 0,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('critical');
    expect(advice.category).toBe('hydration');
    expect(advice.text).toContain('Đã nửa ngày trôi qua mà đệ chưa hớp ngụm nước nào');
    expect(advice.suggestedAmount).toBe(400);
  });

  it('should trigger weather_extreme_heat during very hot weather', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      weather: { temp: 37, humidity: 60 },
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('weather');
    expect(advice.text).toContain('Nhiệt độ ngoài trời rất cao (37°C)');
    expect(advice.suggestedAmount).toBe(250);
  });

  it('should trigger activity_very_active for active users', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      activityLevel: 'very_active',
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('activity');
    expect(advice.text).toContain('Đệ vận động nhiều hôm nay');
    expect(advice.suggestedAmount).toBe(250);
  });

  it('should trigger motivation_streak_high when streak is high and goal not yet met in the evening', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      streak: 8,
      hour: 17,
      waterToday: 1200, // 60% of goal
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('motivation');
    expect(advice.text).toContain('Đệ đang có chuỗi giữ kỷ lục 8 ngày xuất sắc');
    expect(advice.suggestedAmount).toBe(250);
  });

  it('should trigger motivation_near_goal when close to target', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      waterToday: 1800, // 90% of goal
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('motivation');
    expect(advice.text).toContain('Đệ chỉ còn thiếu 200ml nữa');
    expect(advice.suggestedAmount).toBe(200);
  });

  it('should trigger motivation_goal_achieved when goal is met', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      waterToday: 2100, // > goal
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('motivation');
    expect(advice.text).toContain('Quá xuất sắc! Đệ đã đạt 100% mục tiêu');
    expect(advice.suggestedAmount).toBeUndefined();
  });

  it('should fallback to default_under_goal when no special conditions are met', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      waterToday: 1000,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('low');
    expect(advice.category).toBe('hydration');
    expect(advice.text).toContain('Hãy uống từng ngụm nước lọc nhỏ đều đặn');
  });

  it('should trigger weather_heat_humidity when hot and humid', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      weather: { temp: 33, humidity: 80 },
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('weather');
    expect(advice.text).toContain('nắng nóng oi bức');
    expect(advice.suggestedAmount).toBe(200);
  });

  it('should trigger weather_cold_dry when temp is low', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      weather: { temp: 15, humidity: 40 },
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('weather');
    expect(advice.text).toContain('Trời lạnh làm giảm cảm giác khát');
    expect(advice.suggestedAmount).toBe(250);
  });

  it('should trigger sleep_deficit_morning when user slept <6h', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 8,
      sleepHours: 5,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('hydration');
    expect(advice.text).toContain('Đêm qua đệ ngủ hơi ít');
    expect(advice.suggestedAmount).toBe(300);
  });

  it('should trigger timing_long_time_no_drink when 3+ hours since last drink', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 14,
      minutesSinceLastDrink: 200,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('high');
    expect(advice.category).toBe('timing');
    expect(advice.text).toContain('hơn 3 tiếng đệ chưa ghi nhận uống nước');
    expect(advice.suggestedAmount).toBe(250);
  });

  it('should trigger timing_morning_routine early in the day with low intake', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 7,
      waterToday: 100,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('timing');
    expect(advice.text).toContain('Chào buổi sáng đệ');
    expect(advice.suggestedAmount).toBe(200);
  });

  it('should trigger timing_before_sleep when near bedtime and almost at goal', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 22,
      waterToday: 1800,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('timing');
    expect(advice.text).toContain('Sắp đến giờ ngủ rồi đệ');
    expect(advice.suggestedAmount).toBe(100);
  });

  it('should trigger activity_sedentary_warning when sedentary and long gap', () => {
    const ctx: ExpertContext = {
      ...baseContext,
      hour: 14,
      activityLevel: 'sedentary',
      minutesSinceLastDrink: 160,
      waterToday: 1500,
    };
    const advice = getOfflineAdvice(ctx);
    expect(advice.priority).toBe('medium');
    expect(advice.category).toBe('activity');
    expect(advice.text).toContain('Ngồi làm việc lâu một chỗ');
    expect(advice.suggestedAmount).toBe(200);
  });
});
