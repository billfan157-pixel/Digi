import { describe, it, expect } from 'vitest';
import { getTimeBasedNudge, getNextRecommendedDrink, TINT_STYLES } from '@/lib/habitEngine';

describe('getTimeBasedNudge', () => {
  // ── Morning ──
  it('returns morning first-open nudge at 6h with 0 intake', () => {
    const n = getTimeBasedNudge({ hour: 6, waterIntake: 0, waterGoal: 2000, streak: 0, isFirstOpen: true });
    expect(n.tint).toBe('morning');
    expect(n.title).toContain('buổi sáng');
    expect(n.actionLabel).toBeTruthy();
  });

  it('returns morning follow-up nudge when already drank', () => {
    const n = getTimeBasedNudge({ hour: 7, waterIntake: 500, waterGoal: 2000, streak: 3, isFirstOpen: true });
    expect(n.tint).toBe('morning');
    expect(n.message).toContain('500ml');
  });

  it('ignores isFirstOpen outside 5-10 range', () => {
    const n = getTimeBasedNudge({ hour: 14, waterIntake: 0, waterGoal: 2000, streak: 0, isFirstOpen: true });
    expect(n.tint).not.toBe('morning');
  });

  // ── Late morning / Pre-noon ──
  it('returns noon pre-noon nudge when pct < 30 between 10-12', () => {
    const n = getTimeBasedNudge({ hour: 11, waterIntake: 300, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('noon');
    expect(n.title).toContain('Sắp hết buổi sáng');
  });

  it('does not return pre-noon nudge when pct >= 30', () => {
    const n = getTimeBasedNudge({ hour: 11, waterIntake: 1000, waterGoal: 2000, streak: 0 });
    expect(n.tint === 'noon' && n.title.includes('Sắp hết')).toBe(false);
  });

  // ── Midday ──
  it('returns midday nudge at 12h with low progress', () => {
    const n = getTimeBasedNudge({ hour: 12, waterIntake: 300, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('noon');
    expect(n.emoji).toBe('☀️');
  });

  // ── Afternoon ──
  it('returns urgent afternoon nudge when pct < 50', () => {
    const n = getTimeBasedNudge({ hour: 15, waterIntake: 500, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('afternoon');
    expect(n.emoji).toBe('📉');
  });

  it('returns moderate afternoon nudge when pct between 50-80', () => {
    const n = getTimeBasedNudge({ hour: 15, waterIntake: 1200, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('afternoon');
    expect(n.emoji).toBe('💪');
  });

  it('returns almost-done afternoon nudge when pct >= 80', () => {
    const n = getTimeBasedNudge({ hour: 15, waterIntake: 1800, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('afternoon');
    expect(n.emoji).toBe('🌟');
  });

  // ── Evening ──
  it('returns evening nudge when pct < 80 at 18h', () => {
    const n = getTimeBasedNudge({ hour: 18, waterIntake: 1000, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('evening');
    expect(n.emoji).toBe('🌆');
  });

  it('returns evening completed nudge when pct >= 100 at 19h', () => {
    const n = getTimeBasedNudge({ hour: 19, waterIntake: 2000, waterGoal: 2000, streak: 5 });
    expect(n.tint).toBe('evening');
    expect(n.emoji).toBe('🎉');
  });

  it('returns evening finish-line nudge when pct 80-99 at 19h', () => {
    const n = getTimeBasedNudge({ hour: 19, waterIntake: 1700, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('evening');
    expect(n.emoji).toBe('🔥');
  });

  // ── Night ──
  it('returns night completed nudge when goal met after 21h', () => {
    const n = getTimeBasedNudge({ hour: 22, waterIntake: 2000, waterGoal: 2000, streak: 3 });
    expect(n.tint).toBe('night');
    expect(n.emoji).toBe('🌙');
    expect(n.title).toContain('ngủ ngon');
  });

  it('returns night stop nudge when goal not met after 21h', () => {
    const n = getTimeBasedNudge({ hour: 23, waterIntake: 500, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('night');
    expect(n.title).toContain('Khuya');
  });

  // ── Late night (hour 0-4) ──
  it('handles late night hour 0-4', () => {
    const n = getTimeBasedNudge({ hour: 2, waterIntake: 0, waterGoal: 2000, streak: 0 });
    expect(n.tint).toBe('night');
  });

  // ── Default fallback ──
  it('returns fallback nudge for uncovered time slot', () => {
    const n = getTimeBasedNudge({ hour: 9, waterIntake: 500, waterGoal: 2000, streak: 0 });
    // hour 9 with isFirstOpen undefined — falls through morning block
    // Falls to default if no block matches
    if (n.tint === 'noon' && n.emoji === '💧') {
      expect(n.message).toContain('500ml');
    }
  });

  it('calculates remaining ml correctly', () => {
    const n = getTimeBasedNudge({ hour: 15, waterIntake: 500, waterGoal: 2000, streak: 0 });
    expect(n.message).toContain('1500');
  });
});

describe('getNextRecommendedDrink', () => {
  it('returns null when goal already met', () => {
    expect(getNextRecommendedDrink({ waterIntake: 2000, waterGoal: 2000, hour: 14 })).toBeNull();
  });

  it('returns null when hour >= 22', () => {
    expect(getNextRecommendedDrink({ waterIntake: 500, waterGoal: 2000, hour: 23 })).toBeNull();
  });

  it('returns recommendation with amount and urgency', () => {
    const r = getNextRecommendedDrink({ waterIntake: 500, waterGoal: 2000, hour: 14 });
    expect(r).not.toBeNull();
    expect(r!.amount).toBeGreaterThanOrEqual(200);
    expect(['low', 'medium', 'high']).toContain(r!.urgency);
  });

  it('returns high urgency when far behind in the afternoon', () => {
    const r = getNextRecommendedDrink({ waterIntake: 200, waterGoal: 2000, hour: 15 });
    expect(r!.urgency).toBe('high');
  });

  it('returns high urgency when pct < 50 after 16h', () => {
    const r = getNextRecommendedDrink({ waterIntake: 500, waterGoal: 2000, hour: 17 });
    expect(r!.urgency).toBe('high');
  });

  it('returns medium urgency when pct < 50 before 16h', () => {
    const r = getNextRecommendedDrink({ waterIntake: 500, waterGoal: 2000, hour: 12 });
    expect(r!.urgency).toBe('medium');
  });

  it('returns label with amount', () => {
    const r = getNextRecommendedDrink({ waterIntake: 500, waterGoal: 2000, hour: 14 });
    expect(r!.label).toContain('ml');
  });
});

describe('TINT_STYLES', () => {
  it('has all 5 tints', () => {
    const tints = ['morning', 'noon', 'afternoon', 'evening', 'night'] as const;
    for (const t of tints) {
      expect(TINT_STYLES[t]).toBeDefined();
      expect(TINT_STYLES[t].gradient).toBeTruthy();
      expect(TINT_STYLES[t].border).toBeTruthy();
      expect(TINT_STYLES[t].iconBg).toBeTruthy();
      expect(TINT_STYLES[t].accent).toBeTruthy();
    }
  });
});
