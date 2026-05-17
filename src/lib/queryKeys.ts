export const appQueryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  shop: (userId?: string) => ['shop', userId] as const,
  settings: (userId?: string) => ['settings', userId] as const,
  waterLogs: (userId?: string, day?: string) => ['waterLogs', userId, day] as const,
};
