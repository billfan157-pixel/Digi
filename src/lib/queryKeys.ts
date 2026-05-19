export const appQueryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  shop: (userId?: string) => ['shop', userId] as const,
  settings: (userId?: string) => ['settings', userId] as const,
  waterLogs: (userId?: string, day?: string) => ['waterLogs', userId, day] as const,
  feed: (userId?: string, friendIds?: string[]) =>
    ['feed', userId, ...(friendIds?.sort() ?? [])] as unknown as readonly string[],
  socialCloseCircle: (userId?: string) => ['social', 'closeCircle', userId] as const,
  socialFeedPosts: (userId?: string, friendIds?: string[]) =>
    ['social', 'feedPosts', userId, ...(friendIds?.sort() ?? [])] as unknown as readonly string[],
  socialProfileStats: (userId?: string) => ['social', 'profileStats', userId] as const,
  socialFollowingIds: (userId?: string) => ['social', 'followingIds', userId] as const,
  weather: () => ['weather'] as const,
  wellness: (userId?: string) => ['wellness', userId] as const,
};
