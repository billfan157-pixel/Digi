import { describe, it, expect } from 'vitest';
import { appQueryKeys } from './queryKeys';

describe('appQueryKeys', () => {
  it('profile key includes userId', () => {
    expect(appQueryKeys.profile('u1')).toEqual(['profile', 'u1']);
  });

  it('profile key works without userId', () => {
    expect(appQueryKeys.profile()).toEqual(['profile', undefined]);
  });

  it('waterLogs key includes userId and day', () => {
    expect(appQueryKeys.waterLogs('u1', '2026-01-15')).toEqual(['waterLogs', 'u1', '2026-01-15']);
  });

  it('feed key sorts friendIds', () => {
    const key = appQueryKeys.feed('u1', ['c', 'a', 'b']);
    expect(key).toEqual(['feed', 'u1', 'a', 'b', 'c']);
  });

  it('feed key works without friendIds', () => {
    expect(appQueryKeys.feed('u1')).toEqual(['feed', 'u1']);
  });

  it('socialCloseCircle key', () => {
    expect(appQueryKeys.socialCloseCircle('u1')).toEqual(['social', 'closeCircle', 'u1']);
  });

  it('socialFeedPosts key sorts friendIds', () => {
    const key = appQueryKeys.socialFeedPosts('u1', ['z', 'x']);
    expect(key).toEqual(['social', 'feedPosts', 'u1', 'x', 'z']);
  });

  it('socialProfileStats key', () => {
    expect(appQueryKeys.socialProfileStats('u1')).toEqual(['social', 'profileStats', 'u1']);
  });

  it('socialFollowingIds key', () => {
    expect(appQueryKeys.socialFollowingIds('u1')).toEqual(['social', 'followingIds', 'u1']);
  });

  it('notifications key', () => {
    expect(appQueryKeys.notifications('u1')).toEqual(['notifications', 'u1']);
  });

  it('weather key is static', () => {
    expect(appQueryKeys.weather()).toEqual(['weather']);
  });

  it('wellness key includes userId', () => {
    expect(appQueryKeys.wellness('u1')).toEqual(['wellness', 'u1']);
  });
});
