type ReadonlyStringArray = readonly string[];

// Allow optional parts (userId/day) to keep runtime behavior unchanged,
// while preserving the existing "readonly string[]" typing expectation.
const asReadonlyStringArray = (value: readonly (string | undefined)[]) =>
  value as ReadonlyStringArray;

export const appQueryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  shop: (userId?: string) => ['shop', userId] as const,
  settings: (userId?: string) => ['settings', userId] as const,
  waterLogs: (userId?: string, day?: string) => ['waterLogs', userId, day] as const,
  feed: (userId?: string, friendIds?: string[]) =>
    asReadonlyStringArray(['feed', userId, ...(friendIds?.sort() ?? [])]),
  socialCloseCircle: (userId?: string) => ['social', 'closeCircle', userId] as const,
  socialFeedPosts: (userId?: string, friendIds?: string[]) =>
    asReadonlyStringArray(['social', 'feedPosts', userId, ...(friendIds?.sort() ?? [])]),
  socialProfileStats: (userId?: string) => ['social', 'profileStats', userId] as const,
  socialFollowingIds: (userId?: string) => ['social', 'followingIds', userId] as const,
  notifications: (userId?: string) => ['notifications', userId] as const,
  weather: () => ['weather'] as const,
  wellness: (userId?: string) => ['wellness', userId] as const,
};
