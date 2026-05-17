import { describe, it, expect } from 'vitest';
import { buildProgressShareText, isMissingSocialSchemaError } from './social';

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
