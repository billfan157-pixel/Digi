import { useMemo } from 'react';
import { sortPostsByLatest } from '../lib/feedUtils';
import { rankFeedPosts } from '../lib/feedAlgorithm';
import type { SocialFeedPost, Profile } from '../models';

export const useFeedFiltering = (
  posts: SocialFeedPost[] | undefined,
  feedMode: 'smart' | 'latest' | 'following',
  feedFilter: 'all' | 'checkins' | 'milestones' | 'challenges' | 'photos',
  feedSearch: string,
  socialFollowingIds: string[],
  profile: Profile | null,
  accountabilityPodIds: string[]
) => {
  return useMemo(() => {
    if (!posts || posts.length === 0) return [];

    // rankFeedPosts expects hydration_ml?: number (not number | null),
    // so normalize null -> undefined to satisfy type without changing runtime behavior.
    const normalizedPosts: SocialFeedPost[] = posts
      .filter((p: SocialFeedPost) => p.post_kind !== 'story')
      .map((p: SocialFeedPost) => ({
        ...p,
        likes: p.like_count || 0,
      }));

    type RankedPost = SocialFeedPost & { _score?: number };

    // rankFeedPosts() chấp nhận FeedPostLike/FeedUserLike với value?: number, hydration_ml?: number
    // trong khi SocialFeedPost có value?: number | string và hydration_ml: number | null.
    // Map đầu vào cho rankFeedPosts, không đổi logic ranking.
    const rankInput = normalizedPosts.map((p) => ({
      ...p,
      hydration_ml: p.hydration_ml ?? undefined,
      value: typeof p.value === 'number' ? p.value : undefined,
    }));

    let ranked: RankedPost[] =
      feedMode === 'latest'
        ? (sortPostsByLatest(normalizedPosts) as RankedPost[])
        : (rankFeedPosts(
            rankInput,
            socialFollowingIds,
            profile ? profile as unknown as Parameters<typeof rankFeedPosts>[2] : undefined,
          ) as unknown as RankedPost[]);

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

    if (feedFilter === 'checkins') {
      ranked = ranked.filter(p => p.post_kind === 'status' || p.post_kind === 'progress');
    } else if (feedFilter === 'milestones') {
      ranked = ranked.filter(p => p.post_kind === 'milestone');
    } else if (feedFilter === 'challenges') {
      ranked = ranked.filter(p => p.post_kind === 'challenge');
    } else if (feedFilter === 'photos') {
      ranked = ranked.filter(p => !!p.image_url);
    }

    const search = feedSearch.trim().toLowerCase();
    if (search) {
      ranked = ranked.filter(post => {
        const author = post.author?.nickname?.toLowerCase() || '';
        const content = post.content?.toLowerCase() || '';
        return author.includes(search) || content.includes(search);
      });
    }

    return ranked;
  }, [posts, socialFollowingIds, feedFilter, feedMode, feedSearch, profile, accountabilityPodIds]);
};
