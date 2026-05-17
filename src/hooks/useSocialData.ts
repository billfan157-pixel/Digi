import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_SOCIAL_PROFILE_STATS,
  isMissingSocialSchemaError,
  type CloseCircleMember,
  type SocialDiscoverProfile,
  type SocialFeedPost,
  type SocialProfileStats,
} from '../lib/social';
import { useSocialComposer } from './useSocialComposer';
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

export function useSocialData({ profile, setActiveTab, waterIntake, waterGoal, streak, activeTab: _activeTab }: UseSocialDataProps) {
  const [showDiscoverPeople, setShowDiscoverPeople] = useState(false);
  const [showSocialProfile, setShowSocialProfile] = useState(false);
  const [socialPosts, setSocialPosts] = useState<SocialFeedPost[]>([]);
  const [socialStories, setSocialStories] = useState<SocialFeedPost[]>([]);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialSearchResults, setSocialSearchResults] = useState<SocialDiscoverProfile[]>([]);
  const [socialFollowingIds, setSocialFollowingIds] = useState<string[]>([]);
  const [closeCircleMembers, setCloseCircleMembers] = useState<CloseCircleMember[]>([]);
  const [isCloseCircleLoading, setIsCloseCircleLoading] = useState(false);
  const [socialProfileStats, setSocialProfileStats] = useState<SocialProfileStats>(DEFAULT_SOCIAL_PROFILE_STATS);
  const [socialError, setSocialError] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isSocialSearching, setIsSocialSearching] = useState(false);

  const composer = useSocialComposer({
    profile,
    setActiveTab,
    waterIntake,
    waterGoal,
    streak,
    onPostPublished: () => { void refreshSocialFeed({ silent: true }); },
  });

  useEffect(() => {
    if (!profile?.id) {
      setShowDiscoverPeople(false);
      setShowSocialProfile(false);
      setSocialPosts([]);
      setSocialStories([]);
      setSocialSearchResults([]);
      setSocialFollowingIds([]);
      setCloseCircleMembers([]);
      setSocialProfileStats(DEFAULT_SOCIAL_PROFILE_STATS);
      setSocialError('');
      composer.resetSocialComposer();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (_activeTab === 'feed' && profile?.id) {
      void refreshSocialFeed();
    }
  }, [_activeTab, profile?.id]);

  useEffect(() => {
    if (showDiscoverPeople && profile?.id) {
      void loadSocialDirectory(socialSearchQuery);
    }
  }, [showDiscoverPeople, profile?.id]);

  const getSocialErrorMessage = (message?: string) => {
    if (!message) return 'Không thể tải tính năng cộng đồng lúc này.';
    if (isMissingSocialSchemaError(message)) {
      return 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.';
    }
    return message;
  };

  const closeCircleIds = useMemo(() => closeCircleMembers.map(member => member.id), [closeCircleMembers]);

  const loadCloseCircle = async (options?: { silent?: boolean }): Promise<CloseCircleMember[]> => {
    if (!profile?.id) return [];

    if (!options?.silent) setIsCloseCircleLoading(true);
    try {
      const { data: rows, error } = await supabase!
        .from('social_follows')
        .select('following_id, created_at')
        .eq('follower_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const partnerRows = rows || [];
      const partnerIds = partnerRows.map((row: { following_id: string }) => row.following_id).filter(Boolean);
      if (partnerIds.length === 0) {
        setCloseCircleMembers([]);
        setSocialFollowingIds([]);
        return [];
      }

      const { data: profiles, error: profilesError } = await supabase!
        .from('public_profiles')
        .select('id, nickname, avatar_url, level, water_today, water_goal')
        .in('id', partnerIds);
      if (profilesError) throw profilesError;
      const profileMap = new Map((profiles || []).map((row: { id: string; nickname: string; avatar_url?: string | null; level: number | null; water_today: number | null; water_goal: number | null }) => [row.id, row]));

      const members = partnerRows.map((row: { following_id: string; priority?: number }, index: number) => {
        const partner = profileMap.get(row.following_id);
        return {
          id: row.following_id,
          nickname: partner?.nickname || 'Bạn DigiWell',
          avatar_url: partner?.avatar_url ?? null,
          level: partner?.level ?? null,
          water_today: partner?.water_today ?? null,
          water_goal: partner?.water_goal ?? null,
          priority: row.priority ?? index + 1,
          is_pinned: false,
        } satisfies CloseCircleMember;
      });

      setCloseCircleMembers(members);
      setSocialFollowingIds(members.map(member => member.id));
      return members;
    } catch (err: unknown) {
      const friendlyMessage = getSocialErrorMessage(err instanceof Error ? err.message : String(err));
      setSocialError(friendlyMessage);
      if (!options?.silent) toast.error(friendlyMessage);
      return [];
    } finally {
      setIsCloseCircleLoading(false);
    }
  };

  const loadSocialDirectory = async (query: string) => {
    if (!profile?.id) return;

    setIsSocialSearching(true);
    try {
      const keyword = query.trim();
      let request = supabase!
        .from('public_profiles')
        .select('id, nickname, avatar_url, level, water_today, water_goal')
        .neq('id', profile.id);

      if (keyword) {
        const escaped = keyword.replace(/[%_\\]/g, '\\$&');
        request = request.filter('nickname', 'ilike', `%${escaped}%`);
      } else {
        request = request.order('nickname', { ascending: true });
      }

      const { data, error } = await request.limit(8);
      if (error) throw error;

      const circleSet = new Set(closeCircleIds);
      setSocialError('');
      setSocialSearchResults((data || []).map((user: { id: string; nickname: string; avatar_url?: string | null; level?: number | null; water_today?: number | null; water_goal?: number | null }, index: number) => ({
        id: user.id || `search-user-fallback-${index}`,
        nickname: user.nickname || 'Người dùng DigiWell',
        isFollowing: socialFollowingIds.includes(user.id),
        isInCircle: circleSet.has(user.id),
        avatar_url: user.avatar_url ?? null,
        level: user.level ?? null,
        water_today: user.water_today ?? null,
        water_goal: user.water_goal ?? null,
      })));
    } catch (err: unknown) {
      const friendlyMessage = getSocialErrorMessage(err instanceof Error ? err.message : String(err));
      setSocialError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsSocialSearching(false);
    }
  };

  const refreshSocialFeed = async (options?: { silent?: boolean }) => {
    if (!profile?.id) return;

    if (!options?.silent) {
      setIsSocialLoading(true);
    }

    try {
      const circleMembers = await loadCloseCircle({ silent: true });
      const circleIds = circleMembers.map(member => member.id);

      const [
        followingRes,
        profileStatsRes,
      ] = await Promise.all([
        supabase!.from('social_follows').select('following_id').eq('follower_id', profile.id),
        supabase!.rpc('get_profile_stats', { p_user_id: profile.id })
      ]);

      if (followingRes.error) throw followingRes.error;
      if (profileStatsRes.error) throw profileStatsRes.error;

      const stats = profileStatsRes.data || { follower_count: 0, following_count: 0, post_count: 0 };
      const followingIds = circleIds;
      setSocialFollowingIds(followingIds);
      setSocialProfileStats({
        followers: stats.follower_count,
        following: stats.following_count,
        posts: stats.post_count,
      });

      const feedAuthorIds = Array.from(new Set([profile.id, ...followingIds]));
      const { data: postRows, error: postsError } = await supabase!
        .from('social_posts')
        .select('id, author_id, content, image_url, post_kind, visibility, hydration_ml, streak_snapshot, like_count, created_at, expires_at')
        .in('author_id', feedAuthorIds)
        .order('created_at', { ascending: false })
        .range(0, 19);

      if (postsError) throw postsError;

      const validRows = (postRows || []).filter((row: { post_kind: string; expires_at: string | null }) => {
        if (row.post_kind !== 'story') return true;
        if (!row.expires_at) return false;
        return new Date(row.expires_at).getTime() > Date.now();
      });

      const authorIds = Array.from(new Set(validRows.map((row: { author_id: string }) => row.author_id)));
      const postIds = validRows.map((row: { id: string }) => row.id);

      const [profilesRes, likesRes] = await Promise.all([
        authorIds.length > 0
          ? supabase!.from('public_profiles').select('id, nickname, avatar_url, level, water_today, water_goal').in('id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase!.from('post_cheers').select('post_id').eq('user_id', profile.id).in('post_id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (likesRes.error) throw likesRes.error;

      const profileMap = new Map((profilesRes.data || []).map((row: { id: string; nickname: string; avatar_url?: string | null; level?: number | null; water_today?: number | null; water_goal?: number | null }) => [row.id, {
        id: row.id,
        nickname: row.nickname || 'Người dùng DigiWell',
        avatar_url: row.avatar_url ?? null,
        level: row.level ?? null,
        water_today: row.water_today ?? null,
        water_goal: row.water_goal ?? null,
      }]));
      const likedPostIds = new Set((likesRes.data || []).map((row: { post_id: string }) => row.post_id));

      const mappedPosts: SocialFeedPost[] = validRows.map((row: Record<string, unknown>, index: number) => {
        const rowId = String(row.id || `post-fallback-${index}`);
        const authorId = String(row.author_id || '');
        return {
          id: rowId,
          author_id: authorId,
          content: String(row.content || ''),
          image_url: (row.image_url as string | null) ?? null,
          post_kind: (row.post_kind as SocialFeedPost['post_kind']) || 'status',
          visibility: (row.visibility as SocialFeedPost['visibility']) || 'public',
          hydration_ml: (row.hydration_ml as number | null) ?? null,
          streak_snapshot: (row.streak_snapshot as number | null) ?? null,
          like_count: Number(row.like_count || 0),
          created_at: String(row.created_at || ''),
          expires_at: (row.expires_at as string | null) ?? null,
          event_type: (row.event_type as string | null) ?? null,
          reference_id: (row.reference_id as string | null) ?? null,
          is_squad_highlight: Boolean(row.is_squad_highlight),
          author: profileMap.get(authorId) || {
            id: authorId,
            nickname: authorId === profile?.id ? String(profile.nickname || 'Bạn') : 'Người dùng DigiWell',
          },
          likedByMe: likedPostIds.has(rowId),
        };
      });

      const storyMap = new Map<string, SocialFeedPost>();
      const latestStories = mappedPosts
        .filter(post => post.post_kind === 'story')
        .reduce<SocialFeedPost[]>((acc: SocialFeedPost[], post: SocialFeedPost) => {
          if (storyMap.has(post.author_id)) return acc;
          storyMap.set(post.author_id, post);
          acc.push(post);
          return acc;
        }, []);

      setSocialStories(latestStories);
      setSocialPosts(mappedPosts.filter(post => post.post_kind !== 'story'));
      setSocialError('');
    } catch (err: unknown) {
      const friendlyMessage = getSocialErrorMessage(err instanceof Error ? err.message : String(err));
      setSocialError(friendlyMessage);
      setSocialPosts([]);
      setSocialStories([]);
      if (!options?.silent) {
        toast.error(friendlyMessage);
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSearchSocialUsers = async (query: string) => {
    setSocialSearchQuery(query);
    await loadSocialDirectory(query);
  };

  const handleAddCircleMember = async (targetUserId: string, nickname: string) => {
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
      const { error } = await supabase!
        .from('social_follows')
        .upsert(
          { follower_id: profile.id, following_id: targetUserId },
          { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
        );
      if (error) throw error;

      setSocialFollowingIds((prev: string[]) => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
      setSocialSearchResults((prev: SocialDiscoverProfile[]) => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: true, isInCircle: true } : user));
      setSocialProfileStats((prev: SocialProfileStats) => ({ ...prev, following: prev.following + 1 }));
      toast.success(`Đã thêm ${nickname} vào bạn bè.`, { id: toastId });
      await loadCloseCircle({ silent: true });
      await refreshSocialFeed({ silent: true });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const handleRemoveCircleMember = async (targetUserId: string, nickname: string) => {
    if (!profile?.id) return;

    const toastId = toast.loading(`Đang gỡ ${nickname} khỏi bạn bè...`);
    try {
      const { error } = await supabase!
        .from('social_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', targetUserId);
      if (error) throw error;

      setSocialFollowingIds((prev: string[]) => prev.filter(id => id !== targetUserId));
      setSocialSearchResults((prev: SocialDiscoverProfile[]) => prev.map(user => user.id === targetUserId ? { ...user, isFollowing: false, isInCircle: false } : user));
      setSocialProfileStats((prev: SocialProfileStats) => ({ ...prev, following: Math.max(prev.following - 1, 0) }));
      toast.success(`Đã gỡ ${nickname} khỏi bạn bè.`, { id: toastId });
      await loadCloseCircle({ silent: true });
      await refreshSocialFeed({ silent: true });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const handleFollowUser = handleAddCircleMember;
  const handleUnfollowUser = handleRemoveCircleMember;

  const handleToggleLikePost = async (post: SocialFeedPost) => {
    if (!profile?.id) return;

    const nextLiked = !post.likedByMe;
    const likeDelta = nextLiked ? 1 : -1;
    setSocialPosts((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));
    setSocialStories((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? {
      ...item,
      likedByMe: nextLiked,
      like_count: Math.max((item.like_count || 0) + likeDelta, 0),
    } : item));

    try {
      if (nextLiked) {
        const { error } = await supabase!.from('social_post_likes').insert({
          post_id: post.id,
          user_id: profile.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.from('social_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', profile.id);
        if (error) throw error;
      }
    } catch (err: unknown) {
      setSocialPosts((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? post : item));
      setSocialStories((prev: SocialFeedPost[]) => prev.map(item => item.id === post.id ? post : item));
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)));
    }
  };

  return {
    showDiscoverPeople, setShowDiscoverPeople,
    showSocialProfile, setShowSocialProfile,
    socialPosts, setSocialPosts,
    socialStories, setSocialStories,
    socialSearchQuery, setSocialSearchQuery,
    socialSearchResults, setSocialSearchResults,
    socialFollowingIds, setSocialFollowingIds,
    closeCircleMembers, setCloseCircleMembers,
    closeCircleIds,
    isCloseCircleLoading,
    socialProfileStats, setSocialProfileStats,
    socialError, setSocialError,
    isSocialLoading, setIsSocialLoading,
    isSocialSearching, setIsSocialSearching,
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
