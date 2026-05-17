import { describe, expect, it } from 'vitest';
import { calculateWaterIntake, calculateWeatherBandAdjustment, type WaterIntakeInput } from '@/lib/HydrationEngine';

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
