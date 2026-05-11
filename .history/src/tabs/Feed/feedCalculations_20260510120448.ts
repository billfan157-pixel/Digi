import { useMemo } from 'react';
import { rankFeedPosts } from '../../lib/feedAlgorithm';
import { sortPostsByLatest } from '../../lib/feedUtils';
import type { Profile, SocialFeedPost } from '../../models';
import type { FeedFilter, FeedMode, FeedSummary } from './types';

export const getOnlineFriendsCount = (socialFollowingIds: string[]) =>
  socialFollowingIds?.length || 0;

export const useFeedSummary = (
  posts: SocialFeedPost[] | undefined,
  socialStories: SocialFeedPost[],
  currentTimestamp: number
): FeedSummary => useMemo(() => {
  const sourcePosts = posts || [];
  const challengeCount = sourcePosts.filter((post: any) => post.post_kind === 'challenge').length;
  const progressCount = sourcePosts.filter((post: any) => post.post_kind === 'progress').length;
  const tipCount = sourcePosts.filter((post: any) => post.post_kind === 'tip').length;
  const pollCount = sourcePosts.filter((post: any) => post.post_kind === 'poll').length;

  return {
    postsToday: sourcePosts.filter((post: any) => {
      const createdAt = new Date(post.created_at).getTime();
      return Number.isFinite(createdAt) && currentTimestamp - createdAt < 24 * 60 * 60 * 1000;
    }).length,
    challengeCount,
    progressCount,
    storyCount: socialStories.length,
    tipCount,
    pollCount,
  };
}, [currentTimestamp, posts, socialStories]);
import { useMemo } from 'react';
import { rankFeedPosts } from '../../lib/feedAlgorithm';
import { sortPostsByLatest } from '../../lib/feedUtils';
import type { Profile, SocialFeedPost } from '../../models';
import type { FeedFilter, FeedMode, FeedSummary } from './types';

export const getOnlineFriendsCount = (socialFollowingIds: string[]) =>
  socialFollowingIds?.length || 0;


export const useRankedFeed = (
  posts: SocialFeedPost[] | undefined,
  feedMode: FeedMode,
  feedFilter: FeedFilter,
  feedSearch: string,
  socialFollowingIds: string[],
  profile: Profile | null
) => useMemo(() => {
  if (!posts || posts.length === 0) return [];

  const normalizedPosts: SocialFeedPost[] = posts.map((post) => ({
    ...post,
    type: (() => {
      switch (post.post_kind) {
        case 'challenge':
          return 'challenge';
        case 'progress':
          return (post.streak_snapshot ?? 0) > 0 ? 'milestone' : 'daily_goal';
        case 'tip':
          return 'tip';
        case 'poll':
          return 'poll';
        case 'photo':
          return 'photo';
        default:
          return 'status';
      }
    })() as SocialFeedPost['type'],

export const useRankedFeed = (
  posts: SocialFeedPost[] | undefined,
  feedMode: FeedMode,
  feedFilter: FeedFilter,
  feedSearch: string,
  socialFollowingIds: string[],
  profile: Profile | null
) => useMemo(() => {
  if (!posts || posts.length === 0) return [];

  const normalizedPosts: SocialFeedPost[] = posts.map((post) => ({
    ...post,

  return ranked;
}, [posts, socialFollowingIds, feedFilter, feedMode, feedSearch, profile]);
