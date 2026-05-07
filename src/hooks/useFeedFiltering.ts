import { useMemo } from 'react';
import { sortPostsByLatest } from '../lib/feedUtils';
import { rankFeedPosts } from '../lib/feedAlgorithm';
import type { SocialFeedPost, Profile } from '../models';

export const useFeedFiltering = (
  posts: SocialFeedPost[] | undefined,
  feedMode: 'smart' | 'latest' | 'following',
  feedFilter: 'all' | 'milestones' | 'challenges',
  feedSearch: string,
  socialFollowingIds: string[],
  profile: Profile | null,
  accountabilityPodIds: string[]
) => {
  return useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const normalizedPosts: SocialFeedPost[] = posts
      .filter((p: any) => p.post_kind !== 'story')
      .map((p: any) => ({
        ...p,
        type: (() => {
          switch (p.post_kind) {
            case 'challenge':
              return 'challenge';
            case 'milestone':
              return 'milestone';
            case 'progress':
              return p.streak_snapshot > 0 ? 'milestone' : 'daily_goal';
            default:
              return 'status';
          }
        })(),
        value: p.hydration_ml || p.streak_snapshot || 0,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        temperature: p.temperature,
        heart_rate: p.heart_rate,
        drink_type: p.drink_type,
        pulse_count: p.pulse_count || 0,
      }));

    let ranked: SocialFeedPost[] =
      feedMode === 'latest'
        ? sortPostsByLatest(normalizedPosts)
        : (rankFeedPosts(normalizedPosts, socialFollowingIds, profile) as SocialFeedPost[]);

    if (accountabilityPodIds.length > 0) {
      const podRank = new Map(accountabilityPodIds.map((id, index) => [id, index]));
      ranked = [...ranked].sort((left, right) => {
        const leftRank = podRank.has(left.author_id) ? podRank.get(left.author_id)! : 99;
        const rightRank = podRank.has(right.author_id) ? podRank.get(right.author_id)! : 99;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return 0;
      });
    }

    if (feedMode === 'following') {
      ranked = ranked.filter(post => post.author_id === profile?.id || socialFollowingIds.includes(post.author_id));
    }

    if (feedFilter === 'milestones') {
      ranked = ranked.filter(p => p.type === 'milestone' || p.type === 'daily_goal');
    } else if (feedFilter === 'challenges') {
      ranked = ranked.filter(p => p.type === 'challenge');
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
  }, [posts, socialFollowingIds, feedFilter, feedMode, feedSearch, profile, accountabilityPodIds]);
};
