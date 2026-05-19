import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appQueryKeys } from '@/lib/queryKeys';
import {
  DEFAULT_SOCIAL_PROFILE_STATS,
  isMissingSocialSchemaError,
  type CloseCircleMember,
  type SocialFeedPost,
} from '../lib/social';
import { useSocialComposer } from './useSocialComposer';
import {
  useCloseCircleQuery,
  useSocialFollowingIdsQuery,
  useSocialProfileStatsQuery,
  useSocialFeedQuery,
  useSocialSearchQuery,
} from './useSocialQueries';
import { useFollowMutation, useLikeMutation } from './useSocialMutations';
import type { AppProfile } from '@/services/profile.service';

interface UseSocialDataProps {
  profile: AppProfile | null;
  tab?: string;
  setActiveTab?: (tab: string) => void;
  waterIntake?: number;
  waterGoal?: number;
  streak?: number;
  activeTab?: string;
}

function getSocialErrorMessage(message?: string) {
  if (!message) return 'Không thể tải tính năng cộng đồng lúc này.';
  if (isMissingSocialSchemaError(message)) {
    return 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.';
  }
  return message;
}

export function useSocialData({ profile, setActiveTab, waterIntake, waterGoal, streak }: UseSocialDataProps) {
  const queryClient = useQueryClient();

  const [showDiscoverPeople, setShowDiscoverPeople] = useState(false);
  const [showSocialProfile, setShowSocialProfile] = useState(false);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');

  // ── React Query hooks ───────────────────────────────────
  const closeCircleQuery = useCloseCircleQuery(profile?.id);
  const followingIdsQuery = useSocialFollowingIdsQuery(profile?.id);
  const statsQuery = useSocialProfileStatsQuery(profile?.id);

  const closeCircleMembers = useMemo(() => closeCircleQuery.data ?? [], [closeCircleQuery.data]);
  const closeCircleIds = useMemo(() => closeCircleMembers.map(m => m.id), [closeCircleMembers]);
  const socialFollowingIds = followingIdsQuery.data ?? closeCircleIds;

  const feedQuery = useSocialFeedQuery(profile?.id, socialFollowingIds);
  const socialPosts: SocialFeedPost[] = feedQuery.data?.posts ?? [];
  const socialStories: SocialFeedPost[] = feedQuery.data?.stories ?? [];

  const searchQuery = useSocialSearchQuery(profile?.id, socialSearchQuery, closeCircleIds, socialFollowingIds);
  const socialSearchResults = searchQuery.data ?? [];

  const socialProfileStats = statsQuery.data ?? DEFAULT_SOCIAL_PROFILE_STATS;

  const followMuts = useFollowMutation(profile?.id);
  const likeMutation = useLikeMutation();

  const isCloseCircleLoading = closeCircleQuery.isLoading;
  const isSocialLoading = feedQuery.isLoading;
  const isSocialSearching = searchQuery.isLoading;

  const socialError = useMemo(() => {
    const errors = [
      closeCircleQuery.error,
      followingIdsQuery.error,
      statsQuery.error,
      feedQuery.error,
    ].filter(Boolean);
    if (errors.length === 0) return '';
    const msg = errors[0] instanceof Error ? errors[0].message : String(errors[0]);
    return getSocialErrorMessage(msg);
  }, [closeCircleQuery.error, followingIdsQuery.error, statsQuery.error, feedQuery.error]);

  const composer = useSocialComposer({
    profile,
    setActiveTab,
    waterIntake,
    waterGoal,
    streak,
    onPostPublished: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKeys.socialFeedPosts(profile?.id, socialFollowingIds) });
    },
  });

  // ── Orchestrating functions ──────────────────────────────

  const loadCloseCircle = useCallback(async (): Promise<CloseCircleMember[]> => {
    if (!profile?.id) return [];
    const [circleResult] = await Promise.all([
      closeCircleQuery.refetch(),
      followingIdsQuery.refetch(),
    ]);
    return circleResult.data ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleSearchSocialUsers = useCallback(async (query: string) => {
    setSocialSearchQuery(query);
  }, []);

  const handleAddCircleMember = useCallback(async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;
    if (targetUserId === profile.id) {
      toast.error('Không thể thêm chính bạn vào bạn bè.');
      return;
    }
    if (closeCircleIds.includes(targetUserId)) {
      toast.info(`${nickname} đã là bạn bè.`);
      return;
    }
    const toastId = toast.loading(`Đang thêm ${nickname} vào bạn bè...`);
    try {
      await followMuts.addFollow.mutateAsync(targetUserId);
      toast.success(`Đã thêm ${nickname} vào bạn bè.`, { id: toastId });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  }, [profile?.id, closeCircleIds, followMuts.addFollow]);

  const handleRemoveCircleMember = useCallback(async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;
    const toastId = toast.loading(`Đang gỡ ${nickname} khỏi bạn bè...`);
    try {
      await followMuts.removeFollow.mutateAsync(targetUserId);
      toast.success(`Đã gỡ ${nickname} khỏi bạn bè.`, { id: toastId });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  }, [profile?.id, followMuts.removeFollow]);

  const handleFollowUser = handleAddCircleMember;
  const handleUnfollowUser = handleRemoveCircleMember;

  const handleToggleLikePost = useCallback(async (post: SocialFeedPost) => {
    if (!profile?.id) return;
    const nextLiked = !post.likedByMe;
    likeMutation.mutate({ postId: post.id, liked: nextLiked, userId: profile.id });
  }, [profile?.id, likeMutation]);

  return {
    showDiscoverPeople, setShowDiscoverPeople,
    showSocialProfile, setShowSocialProfile,
    socialPosts,
    socialStories,
    socialSearchQuery, setSocialSearchQuery,
    socialSearchResults,
    socialFollowingIds,
    closeCircleMembers,
    closeCircleIds,
    isCloseCircleLoading,
    socialProfileStats,
    socialError,
    isSocialLoading,
    isSocialSearching,
    loadCloseCircle,
    handleSearchSocialUsers,
    handleAddCircleMember,
    handleRemoveCircleMember,
    handleFollowUser,
    handleUnfollowUser,
    handleToggleLikePost,
    ...composer,
  };
}
