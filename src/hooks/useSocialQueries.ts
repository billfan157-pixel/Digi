import { useQuery } from '@tanstack/react-query';
import { appQueryKeys } from '@/lib/queryKeys';
import {
  fetchCloseCircle,
  fetchSocialFollowingIds,
  fetchSocialProfileStats,
  fetchSocialFeed,
  searchSocialProfiles,
} from '@/lib/social.service';

export function useCloseCircleQuery(userId: string | undefined) {
  return useQuery({
    queryKey: appQueryKeys.socialCloseCircle(userId),
    queryFn: () => fetchCloseCircle(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSocialFollowingIdsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: appQueryKeys.socialFollowingIds(userId),
    queryFn: () => fetchSocialFollowingIds(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSocialProfileStatsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: appQueryKeys.socialProfileStats(userId),
    queryFn: () => fetchSocialProfileStats(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSocialFeedQuery(userId: string | undefined, friendIds: string[]) {
  return useQuery({
    queryKey: appQueryKeys.socialFeedPosts(userId, friendIds),
    queryFn: () => fetchSocialFeed(userId!, friendIds),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useSocialSearchQuery(
  userId: string | undefined,
  query: string,
  circleIds: string[],
  followingIds: string[],
) {
  return useQuery({
    queryKey: ['social', 'search', userId, query] as const,
    queryFn: () => searchSocialProfiles(userId!, query, circleIds, followingIds),
    enabled: !!userId && query.length >= 2,
    staleTime: 10_000,
  });
}
