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
  const progressCount = sourcePosts.filter((post: any) => post.post_kind === 'progress' || post.post_kind === 'milestone').length;

  return {
    postsToday: sourcePosts.filter((post: any) => {
      const createdAt = new Date(post.created_at).getTime();
      return Number.isFinite(createdAt) && currentTimestamp - createdAt < 24 * 60 * 60 * 1000;
    }).length,
    challengeCount,
    progressCount,
    storyCount: socialStories.length,
  };
}, [currentTimestamp, posts, socialStories]);

export const useRankedFeed = (
   posts: SocialFeedPost[] | undefined,
   feedMode: FeedMode,
   feedFilter: FeedFilter,
   feedSearch: string,
   socialFollowingIds: string[],
   profile: Profile | null
  ) => useMemo(() => {
   if (!posts || posts.length === 0) return [];

   // Stories (drops) are excluded from main feed - they only appear in stories section
   const normalizedPosts: SocialFeedPost[] = posts
     .map((post) => ({
       ...post,
       type: (() => {
         switch (post.post_kind) {
           case 'checkin':
             return 'daily_goal';
           case 'challenge':
             return 'challenge';
           case 'milestone':
           case 'progress':
             return (post.streak_snapshot ?? 0) > 0 ? 'milestone' : 'daily_goal';
           case 'story':
             return 'status'; // Stories are only shown in stories section, not main feed
           case 'tip':
             return 'tip';
           case 'poll':
             return 'poll';
           case 'photo':
             return 'daily_goal';
           default:
             return 'status';
         }
       })() as SocialFeedPost['type'],
       value: post.hydration_ml ?? post.streak_snapshot ?? 0,
       likes: post.likes_count ?? 0,
       comments: post.comments_count ?? 0,
       temperature: post.temperature,
       heart_rate: post.heart_rate,
       drink_type: post.drink_type,
       pulse_count: post.pulse_count ?? 0,
     }));

   let ranked: SocialFeedPost[] = feedMode === 'latest'
     ? sortPostsByLatest(normalizedPosts)
     : (rankFeedPosts(normalizedPosts, socialFollowingIds, profile) as SocialFeedPost[]);

   if (feedMode === 'following') {
     ranked = ranked.filter(post => post.author_id === profile?.id || socialFollowingIds.includes(post.author_id));
   }

   if (feedFilter === 'checkins') {
     ranked = ranked.filter(post => post.type === 'daily_goal' || post.type === 'status' || post.post_kind === 'photo');
   } else if (feedFilter === 'drops') {
     ranked = ranked.filter(post => post.post_kind === 'story');
   } else if (feedFilter === 'milestones') {
     ranked = ranked.filter(post => post.type === 'milestone');
   } else if (feedFilter === 'challenges') {
     ranked = ranked.filter(post => post.type === 'challenge');
   } else if (feedFilter === 'photos') {
     ranked = ranked.filter(post => !!post.image_url);
   } else {
     ranked = ranked.filter(post => post.post_kind !== 'story');
   }

   const search = feedSearch.trim().toLowerCase();
   if (search) {
     ranked = ranked.filter(post => {
       const author = post.author?.nickname?.toLowerCase() || '';
       const content = post.content?.toLowerCase() || '';
       const drink = post.drink_type?.toLowerCase() || '';
       return author.includes(search) || content.includes(search) || drink.includes(search);
     });
   }

   return ranked;
 }, [posts, socialFollowingIds, feedFilter, feedMode, feedSearch, profile]);
