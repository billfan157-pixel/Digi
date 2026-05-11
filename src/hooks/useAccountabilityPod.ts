import { useMemo } from 'react';
import { stableRange } from '../lib/feedUtils';
import type { SocialFeedPost, Profile } from '../models';

interface AccountabilityMember {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  progress: number;
  remainingMl: number;
  score: number;
  latestPostId?: string;
  latestAt: number;
}

export const useAccountabilityPod = (
  posts: SocialFeedPost[] | undefined,
  socialFollowingIds: string[],
  profile: Profile | null,
  /** Giờ tham chiếu (epoch ms); cập nhật định kỳ để điểm recency không gọi Date.now trong render purity. */
  referenceNowMs: number
) => {
  const accountabilityPod = useMemo(() => {
    const sourcePosts = posts || [];
    const followingSet = new Set(socialFollowingIds || []);
    const candidates = new Map<string, AccountabilityMember>();

    sourcePosts.forEach((post: any) => {
      const authorId = post.author_id || post.author?.id;
      if (!authorId || authorId === profile?.id) return;
      if (followingSet.size > 0 && !followingSet.has(authorId)) return;

      const author = post.author || {};
      const waterGoal = Math.max(author.water_goal || 0, 0);
      const waterToday = Math.max(author.water_today || 0, 0);
      const progress =
        waterGoal > 0
          ? Math.min(100, Math.round((waterToday / waterGoal) * 100))
          : stableRange(`${authorId}:pod-progress`, 35, 92);
      const remainingMl =
        waterGoal > 0 ? Math.max(waterGoal - waterToday, 0) : stableRange(`${authorId}:pod-remaining`, 200, 700);
      const createdAt = new Date(post.created_at).getTime();
      const latestAt = Number.isFinite(createdAt) ? createdAt : 0;
      const recencyScore =
        latestAt > 0
          ? Math.max(0, 24 - Math.min(24, (referenceNowMs - latestAt) / (60 * 60 * 1000)))
          : 0;
      const pressureScore = progress >= 100 ? 12 : remainingMl <= 500 ? 10 : 4;
      const current = candidates.get(authorId);

      const nextScore = (current?.score || 0) + 6 + recencyScore + pressureScore + (followingSet.has(authorId) ? 10 : 0);
      candidates.set(authorId, {
        id: authorId,
        nickname: author.nickname || 'Đối thủ',
        avatarUrl: author.avatar_url,
        progress: current ? Math.max(current.progress, progress) : progress,
        remainingMl: current ? Math.min(current.remainingMl, remainingMl) : remainingMl,
        score: nextScore,
        latestPostId: !current || latestAt > current.latestAt ? post.id : current.latestPostId,
        latestAt: Math.max(current?.latestAt || 0, latestAt),
      });
    });

    return Array.from(candidates.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);
  }, [posts, profile?.id, referenceNowMs, socialFollowingIds]);

  const accountabilityPodIds = useMemo(() => accountabilityPod.map(member => member.id), [accountabilityPod]);
  const primaryPartner = accountabilityPod[0];

  return { accountabilityPod, accountabilityPodIds, primaryPartner };
};
