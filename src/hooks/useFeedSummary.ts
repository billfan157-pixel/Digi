import { useMemo } from 'react';
import type { SocialFeedPost, Profile } from '../models';

export const useFeedSummary = (
  posts: SocialFeedPost[] | undefined,
  socialStories: SocialFeedPost[],
  profile: Profile | null,
  currentTimestamp: number
) => {
  const feedSummary = useMemo(() => {
    const sourcePosts = posts || [];
    const challengeCount = sourcePosts.filter((post: any) => post.post_kind === 'challenge').length;
    const progressCount = sourcePosts.filter((post: any) => post.post_kind === 'progress' || post.post_kind === 'milestone').length;
    const storyCount = socialStories.length;

    return {
      postsToday: sourcePosts.filter((post: any) => {
        const createdAt = new Date(post.created_at).getTime();
        return Number.isFinite(createdAt) && currentTimestamp - createdAt < 24 * 60 * 60 * 1000;
      }).length,
      challengeCount,
      progressCount,
      storyCount,
    };
  }, [currentTimestamp, posts, socialStories]);

  const missionSummary = useMemo(() => {
    const waterGoal = profile?.water_goal || 1;
    const waterToday = profile?.water_today || 0;
    const waterPercent = Math.min(100, Math.round((waterToday / Math.max(waterGoal, 1)) * 100));
    const remainingWater = Math.max(waterGoal - waterToday, 0);

    return {
      waterPercent,
      remainingWater,
      waterToday,
      waterGoal,
    };
  }, [profile?.water_goal, profile?.water_today]);

  return { feedSummary, missionSummary };
};
