import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { buildProgressShareText, isMissingSocialSchemaError, getRelativeTimeLabel, DEFAULT_SOCIAL_COMPOSER, DEFAULT_SOCIAL_PROFILE_STATS } from './social';

describe('buildProgressShareText', () => {
  it('uses nickname when provided', () => {
    const text = buildProgressShareText({
      nickname: 'An',
      waterIntake: 1500,
      waterGoal: 2000,
      streak: 5,
    });
    expect(text).toContain('An');
    expect(text).toContain('1500/2000ml');
    expect(text).toContain('75%');
    expect(text).toContain('5 ngày');
  });

  it('uses "Mình" when no nickname', () => {
    const text = buildProgressShareText({
      waterIntake: 500,
      waterGoal: 2000,
      streak: 0,
    });
    expect(text).toContain('Mình');
  });

  it('shows 100% when intake exceeds goal', () => {
    const text = buildProgressShareText({
      nickname: 'Test',
      waterIntake: 3000,
      waterGoal: 2000,
      streak: 10,
    });
    expect(text).toContain('100%');
  });

  it('handles zero goal gracefully', () => {
    const text = buildProgressShareText({
      nickname: 'Test',
      waterIntake: 500,
      waterGoal: 0,
      streak: 1,
    });
    expect(text).toContain('Test');
    expect(text).toContain('500/0ml');
  });
});

describe('isMissingSocialSchemaError', () => {
  it('detects social_posts error', () => {
    expect(isMissingSocialSchemaError('relation "social_posts" does not exist')).toBe(true);
  });

  it('detects social_follows error', () => {
    expect(isMissingSocialSchemaError('relation "social_follows" does not exist')).toBe(true);
  });

  it('detects social_post_likes error', () => {
    expect(isMissingSocialSchemaError('relation "social_post_likes" does not exist')).toBe(true);
  });

  it('detects widget_partners error', () => {
    expect(isMissingSocialSchemaError('relation "widget_partners" does not exist')).toBe(true);
  });

  it('detects nudges error', () => {
    expect(isMissingSocialSchemaError('relation "nudges" does not exist')).toBe(true);
  });

  it('detects bucket error', () => {
    expect(isMissingSocialSchemaError('The bucket "social-media" does not exist')).toBe(true);
  });

  it('detects social-media error', () => {
    expect(isMissingSocialSchemaError('relation "social-media" does not exist')).toBe(true);
  });

  it('detects "does not exist" fallback', () => {
    expect(isMissingSocialSchemaError('relation "some_table" does not exist')).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isMissingSocialSchemaError('Network error')).toBe(false);
    expect(isMissingSocialSchemaError('User not found')).toBe(false);
    expect(isMissingSocialSchemaError('')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isMissingSocialSchemaError('SOCIAL_POSTS')).toBe(true);
    expect(isMissingSocialSchemaError('SOCIAL-MEDIA')).toBe(true);
  });
});

describe('getRelativeTimeLabel', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns "Vừa xong" for null/undefined', () => {
    expect(getRelativeTimeLabel(null)).toBe('Vừa xong');
    expect(getRelativeTimeLabel(undefined)).toBe('Vừa xong');
  });

  it('returns "Vừa xong" for less than 60 seconds', () => {
    const now = new Date('2026-05-18T12:00:00Z');
    vi.setSystemTime(now);
    const recent = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(getRelativeTimeLabel(recent)).toBe('Vừa xong');
  });

  it('returns minutes ago for < 60 minutes', () => {
    const now = new Date('2026-05-18T12:00:00Z');
    vi.setSystemTime(now);
    const past = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(getRelativeTimeLabel(past)).toBe('5 phút trước');
  });

  it('returns hours ago for < 24 hours', () => {
    const now = new Date('2026-05-18T12:00:00Z');
    vi.setSystemTime(now);
    const past = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTimeLabel(past)).toBe('3 giờ trước');
  });

  it('returns days ago for < 7 days', () => {
    const now = new Date('2026-05-18T12:00:00Z');
    vi.setSystemTime(now);
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTimeLabel(past)).toBe('2 ngày trước');
  });

  it('returns formatted date for >= 7 days', () => {
    const now = new Date('2026-05-18T12:00:00Z');
    vi.setSystemTime(now);
    const past = new Date('2026-05-01T12:00:00Z').toISOString();
    const result = getRelativeTimeLabel(past);
    expect(result).toMatch(/0[15]\/0[15]\/2026/);
  });
});

describe('DEFAULT constants', () => {
  it('DEFAULT_SOCIAL_COMPOSER has correct shape', () => {
    expect(DEFAULT_SOCIAL_COMPOSER.content).toBe('');
    expect(DEFAULT_SOCIAL_COMPOSER.imageUrl).toBe('');
    expect(DEFAULT_SOCIAL_COMPOSER.postKind).toBe('status');
    expect(DEFAULT_SOCIAL_COMPOSER.visibility).toBe('followers');
    expect(DEFAULT_SOCIAL_COMPOSER.eventType).toBeUndefined();
    expect(DEFAULT_SOCIAL_COMPOSER.referenceId).toBeUndefined();
  });

  it('DEFAULT_SOCIAL_PROFILE_STATS starts at 0', () => {
    expect(DEFAULT_SOCIAL_PROFILE_STATS).toEqual({
      followers: 0, following: 0, posts: 0,
    });
  });
});
