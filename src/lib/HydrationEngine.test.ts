import { describe, expect, it } from 'vitest';
import { calculateWaterIntake, calculateWeatherBandAdjustment, type WaterIntakeInput, type HealthCondition, type Climate, type ActivityLevel } from '@/lib/HydrationEngine';

const baseInput: WaterIntakeInput = {
  weightKg: 60,
  heightCm: 170,
  ageYears: 25,
  gender: 'other',
  activityLevel: 'sedentary',
  climate: 'temperate',
  healthCondition: 'none',
  dietFactors: [],
};

describe('HydrationEngine weather adjustment', () => {
  it('keeps small weather changes in the same adjustment band', () => {
    expect(calculateWeatherBandAdjustment(30, 60)).toBe(250);
    expect(calculateWeatherBandAdjustment(34, 70)).toBe(250);

    const firstGoal = calculateWaterIntake({ ...baseInput, currentTempC: 30, currentHumidity: 60 }).goalMl;
    const laterGoal = calculateWaterIntake({ ...baseInput, currentTempC: 34, currentHumidity: 70 }).goalMl;
    expect(laterGoal).toBe(firstGoal);
  });

  it('caps hot or very humid weather adjustment at 500ml', () => {
    expect(calculateWeatherBandAdjustment(35, 60)).toBe(500);
    expect(calculateWeatherBandAdjustment(32, 76)).toBe(500);
    expect(calculateWeatherBandAdjustment(29, 85)).toBe(500);
  });

  it('rounds the final daily goal to stable 250ml steps', () => {
    const result = calculateWaterIntake({
      ...baseInput,
      currentTempC: 30,
      currentHumidity: 60,
    });

    expect(result.goalMl % 250).toBe(0);
  });
});

describe('calculateWeatherBandAdjustment', () => {
  it('returns 0 when both params are undefined', () => {
    expect(calculateWeatherBandAdjustment()).toBe(0);
  });

  it('returns 0 for cool temperatures with moderate humidity', () => {
    expect(calculateWeatherBandAdjustment(25, 50)).toBe(0);
  });

  it('returns 250 for borderline warm conditions', () => {
    expect(calculateWeatherBandAdjustment(28, 76)).toBe(250);
    expect(calculateWeatherBandAdjustment(30, 60)).toBe(250);
  });

  it('returns 500 for extreme heat', () => {
    expect(calculateWeatherBandAdjustment(35, 30)).toBe(500);
  });
});

describe('calculateWaterIntake — base calculation', () => {
  it('uses 35ml/kg for adults 18-64', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.breakdown.base).toBe(60 * 35);
    expect(result.goalMl).toBeGreaterThan(0);
  });

  it('uses 40ml/kg for children under 18', () => {
    const result = calculateWaterIntake({ ...baseInput, ageYears: 14 });
    expect(result.breakdown.base).toBe(60 * 40);
  });

  it('uses 30ml/kg for seniors 65+', () => {
    const result = calculateWaterIntake({ ...baseInput, ageYears: 70 });
    expect(result.breakdown.base).toBe(60 * 30);
  });
});

describe('calculateWaterIntake — age adjustment', () => {
  it('adds age adjustment note for children under 14', () => {
    const result = calculateWaterIntake({ ...baseInput, ageYears: 10 });
    expect(result.adjustmentNote.some((n: string) => n.includes('Trẻ em'))).toBe(true);
    expect(result.breakdown.ageAdj).toBe(-200);
  });

  it('adds age adjustment note for seniors 65+', () => {
    const result = calculateWaterIntake({ ...baseInput, ageYears: 70 });
    expect(result.adjustmentNote.some((n: string) => n.includes('Người cao tuổi'))).toBe(true);
    expect(result.breakdown.ageAdj).toBe(-150);
  });
});

describe('calculateWaterIntake — gender adjustment', () => {
  it('adds 300ml for male', () => {
    const result = calculateWaterIntake({ ...baseInput, gender: 'male' });
    expect(result.breakdown.genderAdj).toBe(300);
  });

  it('adds 0ml for female', () => {
    const result = calculateWaterIntake({ ...baseInput, gender: 'female' });
    expect(result.breakdown.genderAdj).toBe(0);
  });

  it('adds 0ml for other', () => {
    const result = calculateWaterIntake({ ...baseInput, gender: 'other' });
    expect(result.breakdown.genderAdj).toBe(0);
  });
});

describe('calculateWaterIntake — activity adjustment', () => {
  it('returns correct values for each activity level', () => {
    const levels: Array<{ level: ActivityLevel; expected: number }> = [
      { level: 'sedentary', expected: 0 },
      { level: 'light', expected: 200 },
      { level: 'moderate', expected: 450 },
      { level: 'high', expected: 800 },
      { level: 'athlete', expected: 1200 },
    ];
    for (const { level, expected } of levels) {
      const result = calculateWaterIntake({ ...baseInput, activityLevel: level });
      expect(result.breakdown.activityAdj).toBe(expected);
    }
  });

  it('falls back to moderate for invalid activity level', () => {
    const result = calculateWaterIntake({ ...baseInput, activityLevel: 'invalid' as ActivityLevel });
    expect(result.breakdown.activityAdj).toBe(450);
  });
});

describe('calculateWaterIntake — climate adjustment', () => {
  it('uses weather data when temp/humidity provided', () => {
    const result = calculateWaterIntake({ ...baseInput, currentTempC: 32, currentHumidity: 76 });
    expect(result.breakdown.climateAdj).toBe(500);
  });

  it('uses climate enum when weather data absent', () => {
    const climates: Array<{ climate: Climate; expected: number }> = [
      { climate: 'cold', expected: -100 },
      { climate: 'temperate', expected: 0 },
      { climate: 'warm', expected: 300 },
      { climate: 'hot', expected: 600 },
      { climate: 'tropical', expected: 900 },
    ];
    for (const { climate, expected } of climates) {
      const result = calculateWaterIntake({ ...baseInput, currentTempC: undefined, currentHumidity: undefined, climate });
      expect(result.breakdown.climateAdj).toBe(expected);
    }
  });

  it('falls back to temperate for invalid climate', () => {
    const result = calculateWaterIntake({ ...baseInput, climate: 'unknown' as Climate, currentTempC: undefined, currentHumidity: undefined });
    expect(result.breakdown.climateAdj).toBe(0);
  });
});

describe('calculateWaterIntake — health conditions', () => {
  const cases: Array<{ condition: HealthCondition; healthAdj: number; hasCap?: number }> = [
    { condition: 'pregnant', healthAdj: 300 },
    { condition: 'breastfeeding', healthAdj: 700 },
    { condition: 'kidney_stone', healthAdj: 500 },
    { condition: 'kidney_disease', healthAdj: -400, hasCap: 1500 },
    { condition: 'heart_failure', healthAdj: -600, hasCap: 1200 },
    { condition: 'fever', healthAdj: 500 },
    { condition: 'diarrhea', healthAdj: 800 },
    { condition: 'none', healthAdj: 0 },
  ];

  for (const { condition, healthAdj, hasCap } of cases) {
    it(`adjusts ${healthAdj}ml for ${condition}${hasCap ? ` (cap at ${hasCap})` : ''}`, () => {
      const input = condition === 'heart_failure' ? { ...baseInput, weightKg: 35 } : baseInput;
      const result = calculateWaterIntake({ ...input, healthCondition: condition });
      expect(result.breakdown.healthAdj).toBe(healthAdj);
      if (hasCap) {
        expect(result.goalMl).toBeLessThanOrEqual(hasCap);
        expect(result.riskFlags.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('calculateWaterIntake — diet factors', () => {
  it('combines multiple diet factors', () => {
    const result = calculateWaterIntake({ ...baseInput, dietFactors: ['high_protein', 'high_sodium', 'high_fiber'] });
    expect(result.breakdown.dietAdj).toBe(300 + 200 + 150);
  });

  it('applies plant_based reduction', () => {
    const result = calculateWaterIntake({ ...baseInput, dietFactors: ['plant_based'] });
    expect(result.breakdown.dietAdj).toBe(-200);
  });

  it('adds risk flag for high alcohol', () => {
    const result = calculateWaterIntake({ ...baseInput, dietFactors: ['high_alcohol'] });
    expect(result.riskFlags.some((r: string) => r.includes('Rượu bia'))).toBe(true);
  });
});

describe('calculateWaterIntake — exercise', () => {
  it('adds exercise adjustment when minutes provided', () => {
    const result = calculateWaterIntake({ ...baseInput, exerciseMinutes: 30 });
    expect(result.breakdown.exerciseAdj).toBeGreaterThan(0);
  });

  it('uses higher intensity factor for athletes', () => {
    const athlete = calculateWaterIntake({ ...baseInput, activityLevel: 'athlete', exerciseMinutes: 30 });
    const moderate = calculateWaterIntake({ ...baseInput, activityLevel: 'moderate', exerciseMinutes: 30 });
    expect(athlete.breakdown.exerciseAdj).toBeGreaterThan(moderate.breakdown.exerciseAdj);
  });

  it('has 0 exerciseAdj when no exercise', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.breakdown.exerciseAdj).toBe(0);
  });
});

describe('calculateWaterIntake — fasting', () => {
  it('adds food water offset when fasting', () => {
    const fasting = calculateWaterIntake({ ...baseInput, isFasting: true });
    const normal = calculateWaterIntake({ ...baseInput, isFasting: false });
    expect(fasting.breakdown.foodWaterAdj).toBeGreaterThan(0);
    expect(normal.breakdown.foodWaterAdj).toBe(0);
  });
});

describe('calculateWaterIntake — heart rate', () => {
  it('adds heart rate adjustment when avg > 90', () => {
    const result = calculateWaterIntake({ ...baseInput, avgHeartRate: 100 });
    expect(result.breakdown.heartRateAdj).toBeGreaterThan(0);
  });

  it('has no adjustment when heart rate is normal', () => {
    const result = calculateWaterIntake({ ...baseInput, avgHeartRate: 70 });
    expect(result.breakdown.heartRateAdj).toBe(0);
  });
});

describe('calculateWaterIntake — confidence', () => {
  it('returns low for kidney disease', () => {
    const result = calculateWaterIntake({ ...baseInput, healthCondition: 'kidney_disease' });
    expect(result.confidence).toBe('low');
  });

  it('returns low for heart failure', () => {
    const result = calculateWaterIntake({ ...baseInput, healthCondition: 'heart_failure' });
    expect(result.confidence).toBe('low');
  });

  it('returns high with height and exercise', () => {
    const result = calculateWaterIntake({ ...baseInput, heightCm: 170, exerciseMinutes: 30 });
    expect(result.confidence).toBe('high');
  });

  it('returns medium otherwise', () => {
    const result = calculateWaterIntake({ ...baseInput, heightCm: undefined, exerciseMinutes: 0 });
    expect(result.confidence).toBe('medium');
  });
});

describe('calculateWaterIntake — schedule', () => {
  it('generates schedule with correct length', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.schedule.length).toBeGreaterThanOrEqual(7);
  });

  it('includes pre-sleep drink', () => {
    const result = calculateWaterIntake(baseInput);
    const lastItem = result.schedule[result.schedule.length - 1];
    expect(lastItem.note).toContain('ngủ');
  });

  it('includes exercise slot when minutes provided', () => {
    const result = calculateWaterIntake({ ...baseInput, exerciseMinutes: 45 });
    const exerciseSlot = result.schedule.find((s) => s.note.includes('tập'));
    expect(exerciseSlot).toBeDefined();
  });
});

describe('calculateWaterIntake — output formatting', () => {
  it('formats goalL correctly', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.goalL).toMatch(/^\d\.\d lít$/);
  });

  it('calculates glasses correctly', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.glasses).toBe(Math.round(result.goalMl / 250));
  });

  it('goalMl is multiple of 250', () => {
    const result = calculateWaterIntake(baseInput);
    expect(result.goalMl % 250).toBe(0);
  });
});

describe('calculateWaterIntake — edge cases', () => {
  it('handles minimum weight', () => {
    const result = calculateWaterIntake({ ...baseInput, weightKg: 30 });
    expect(result.goalMl).toBeGreaterThanOrEqual(1000);
  });

  it('handles maximum weight', () => {
    const result = calculateWaterIntake({ ...baseInput, weightKg: 150, heightCm: undefined });
    expect(result.goalMl).toBeLessThanOrEqual(5000);
  });

  it('handles all factors combined', () => {
    const result = calculateWaterIntake({
      ...baseInput,
      gender: 'male',
      activityLevel: 'athlete',
      climate: 'tropical',
      healthCondition: 'pregnant',
      dietFactors: ['high_protein', 'high_caffeine'],
      exerciseMinutes: 60,
      isFasting: true,
      avgHeartRate: 95,
    });
    expect(result.breakdown.base).toBeGreaterThan(0);
    expect(result.goalMl).toBeGreaterThan(0);
    expect(result.adjustmentNote.length).toBeGreaterThan(3);
  });
});
