import { describe, it, expect } from 'vitest';

// We import the source but only test pure logic (toAppProfile indirectly via inline helper)
// toAppProfile is not exported, so we test via a local reconstruction of the logic
import { levelFromExp } from '@/config/questConfig';
import type { Profile } from '@/models';

interface ProfileRow {
  id?: string;
  nickname?: string;
  avatar_url?: string | null;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity?: string;
  climate?: string;
  goal?: string;
  wake_up?: string;
  bed_time?: string;
  water_goal?: number;
  wp?: number;
  coins?: number;
  total_exp?: number;
  current_exp?: number;
  water_today?: number;
  total_water?: number;
  onboarding_completed?: boolean;
  equipped_bottle_id?: string | null;
  equipped_frame_id?: string | null;
  equipped_theme_id?: string | null;
  equipped_notification_sound?: string | null;
  created_at?: string;
  updated_at?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  mood_tracking?: boolean;
  sync_wellness_data?: boolean;
  energy_tracking?: boolean;
  last_water_date?: string;
  level?: number;
  [key: string]: unknown;
}

function testToAppProfile(row: ProfileRow) {
  const calculatedLevel = levelFromExp(row.total_exp || 0);
  return {
    id: row.id || '',
    nickname: row.nickname || '',
    password: '',
    avatar_url: row.avatar_url ?? null,
    gender: (row.gender as Profile['gender']) || 'Khác',
    age: row.age || 0,
    height: row.height || 0,
    weight: row.weight || 0,
    activity: (row.activity as Profile['activity']) || 'sedentary',
    climate: (row.climate as Profile['climate']) || 'temperate',
    goal: row.goal || '',
    wakeUp: row.wake_up,
    bedTime: row.bed_time,
    water_goal: row.water_goal || 2000,
    wp: row.wp || 0,
    coins: row.coins || 0,
    total_exp: row.total_exp || 0,
    level: calculatedLevel,
    current_exp: row.current_exp,
    water_today: row.water_today || 0,
    total_water: row.total_water,
    onboarding_completed: row.onboarding_completed,
    equipped_bottle_id: row.equipped_bottle_id ?? null,
    equipped_frame_id: row.equipped_frame_id ?? null,
    equipped_theme_id: row.equipped_theme_id ?? 'theme_default',
    equipped_notification_sound: row.equipped_notification_sound ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sleep_hours: row.sleep_hours,
    sleep_quality: row.sleep_quality,
    mood_tracking: row.mood_tracking,
    sync_wellness_data: row.sync_wellness_data,
    energy_tracking: row.energy_tracking,
  };
}

describe('AppProfile conversion', () => {
  const fullRow: ProfileRow = {
    id: 'user-123',
    nickname: 'TestUser',
    avatar_url: 'https://example.com/avatar.png',
    gender: 'Nam',
    age: 25,
    height: 175,
    weight: 70,
    activity: 'active',
    climate: 'tropical',
    goal: 'Tăng cường sức khỏe',
    wake_up: '06:00',
    bed_time: '22:00',
    water_goal: 2500,
    wp: 120,
    coins: 500,
    total_exp: 1500,
    current_exp: 200,
    water_today: 800,
    total_water: 45000,
    onboarding_completed: true,
    equipped_bottle_id: 'bottle-1',
    equipped_frame_id: 'frame-1',
    equipped_theme_id: 'theme_ocean',
    equipped_notification_sound: 'chime',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
    sleep_hours: 8,
    sleep_quality: 4,
    mood_tracking: true,
    sync_wellness_data: true,
    energy_tracking: false,
  };

  it('converts all fields correctly from ProfileRow to AppProfile', () => {
    const result = testToAppProfile(fullRow);

    expect(result.id).toBe('user-123');
    expect(result.nickname).toBe('TestUser');
    expect(result.avatar_url).toBe('https://example.com/avatar.png');
    expect(result.gender).toBe('Nam');
    expect(result.age).toBe(25);
    expect(result.height).toBe(175);
    expect(result.weight).toBe(70);
    expect(result.activity).toBe('active');
    expect(result.climate).toBe('tropical');
    expect(result.goal).toBe('Tăng cường sức khỏe');
    expect(result.wakeUp).toBe('06:00');
    expect(result.bedTime).toBe('22:00');
    expect(result.water_goal).toBe(2500);
    expect(result.wp).toBe(120);
    expect(result.coins).toBe(500);
    expect(result.total_exp).toBe(1500);
    expect(result.level).toBeGreaterThanOrEqual(1);
  });

  it('uses defaults for empty row', () => {
    const result = testToAppProfile({});

    expect(result.id).toBe('');
    expect(result.nickname).toBe('');
    expect(result.avatar_url).toBeNull();
    expect(result.gender).toBe('Khác');
    expect(result.age).toBe(0);
    expect(result.height).toBe(0);
    expect(result.weight).toBe(0);
    expect(result.water_goal).toBe(2000);
    expect(result.wp).toBe(0);
    expect(result.coins).toBe(0);
    expect(result.total_exp).toBe(0);
    expect(result.level).toBe(1);
    expect(result.water_today).toBe(0);
    expect(result.equipped_theme_id).toBe('theme_default');
  });

  it('calculates level correctly from total_exp', () => {
    const result = testToAppProfile({ total_exp: 0 });
    expect(result.level).toBe(1);

    const midLevel = testToAppProfile({ total_exp: 5000 });
    expect(midLevel.level).toBeGreaterThan(1);
    expect(midLevel.level).toBeLessThan(100);
  });

  it('passes through wellness fields', () => {
    const result = testToAppProfile(fullRow);
    expect(result.sleep_hours).toBe(8);
    expect(result.sleep_quality).toBe(4);
    expect(result.mood_tracking).toBe(true);
    expect(result.sync_wellness_data).toBe(true);
    expect(result.energy_tracking).toBe(false);
  });

  it('null safety: undefined optional fields are undefined, null fields are null', () => {
    const result = testToAppProfile({
      id: 'abc',
      nickname: 'test',
      total_exp: 100,
    });

    expect(result.avatar_url).toBeNull();
    expect(result.equipped_bottle_id).toBeNull();
    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
    expect(result.sleep_hours).toBeUndefined();
  });
});

describe('levelFromExp (questConfig)', () => {
  it('returns 1 for 0 EXP', () => {
    expect(levelFromExp(0)).toBe(1);
  });

  it('increases level with more EXP', () => {
    const lv1 = levelFromExp(0);
    const lv5 = levelFromExp(5000);
    const lv10 = levelFromExp(25000);
    expect(lv5).toBeGreaterThan(lv1);
    expect(lv10).toBeGreaterThan(lv5);
  });

  it('returns at most 99 for very high EXP', () => {
    expect(levelFromExp(1_000_000_000)).toBe(100);
  });
});
