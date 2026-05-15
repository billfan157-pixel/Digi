import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../store/useUIStore';
import {
  buildProgressShareText,
  DEFAULT_SOCIAL_COMPOSER,
  DEFAULT_SOCIAL_PROFILE_STATS,
  isMissingSocialSchemaError,
  type SocialComposerState,
  type CloseCircleMember,
  type SocialDiscoverProfile,
  type SocialFeedPost,
  type SocialProfileStats,
} from '../lib/social';

interface UseSocialDataProps {
  profile: Record<string, unknown> | null;
  tab?: string;
  setActiveTab?: (tab: string) => void;
  waterIntake?: number;
  waterGoal?: number;
  streak?: number;
  activeTab?: string;
}

export function useSocialData({ profile, tab, setActiveTab, waterIntake, waterGoal, streak, activeTab: _activeTab }: UseSocialDataProps) {
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [showDiscoverPeople, setShowDiscoverPeople] = useState(false);
  const [showSocialProfile, setShowSocialProfile] = useState(false);
  const [socialComposer, setSocialComposer] = useState<SocialComposerState>({ ...DEFAULT_SOCIAL_COMPOSER });
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
  const [isPublishingSocialPost, setIsPublishingSocialPost] = useState(false);
  const [isSocialSearching, setIsSocialSearching] = useState(false);
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [socialImagePreview, setSocialImagePreview] = useState('');
  const socialImageInputRef = useRef<HTMLInputElement>(null);
  const [showQuickDropCamera, setShowQuickDropCamera] = useState(false);
  const [isPublishingQuickDrop, setIsPublishingQuickDrop] = useState(false);

  useEffect(() => {
    if (!profile?.id) {
      setShowSocialComposer(false);
      setShowQuickDropCamera(false);
      setShowDiscoverPeople(false);
      setShowSocialProfile(false);
      setSocialPosts([]);
      setSocialStories([]);
      setSocialSearchResults([]);
      setSocialFollowingIds([]);
      setCloseCircleMembers([]);
      setSocialProfileStats(DEFAULT_SOCIAL_PROFILE_STATS);
      setSocialError('');
      resetSocialComposer();
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

  useEffect(() => () => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
  }, [socialImagePreview]);

  const getSocialErrorMessage = (message?: string) => {
    if (!message) return 'Không thể tải tính năng cộng đồng lúc này.';
    if (isMissingSocialSchemaError(message)) {
      return 'Social chưa được bật trên Supabase. Hãy chạy file supabase/social_lite.sql rồi mở lại app.';
    }
    return message;
  };

  const closeCircleIds = useMemo(() => closeCircleMembers.map(member => member.id), [closeCircleMembers]);

  const resetSocialComposer = useCallback(() => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
    setSocialComposer({ ...DEFAULT_SOCIAL_COMPOSER });
    setSocialImageFile(null);
    setSocialImagePreview('');
  }, [socialImagePreview]);

  const closeSocialComposer = () => {
    resetSocialComposer();
    setShowSocialComposer(false);
    useUIStore.getState().setShowSocialComposer(false);
  };

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

  const openSocialComposer = (kind: SocialComposerState['postKind'] = 'status') => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng bài.');
      return;
    }

    if (kind === 'story') {
      setActiveTab?.('feed');
      setShowQuickDropCamera(true);
      return;
    }

    const content = kind === 'progress'
      ? buildProgressShareText({
        nickname: profile?.nickname as string | undefined,
        waterIntake: waterIntake ?? 0,
        waterGoal: waterGoal ?? 2000,
        streak: streak ?? 0,
      })
      : '';

    resetSocialComposer();
    setSocialComposer({
      content,
      imageUrl: '',
      postKind: kind === 'progress' ? 'status' : kind,
      visibility: 'followers',
    });
    setActiveTab?.('feed');
    setShowSocialComposer(true);
    useUIStore.getState().setShowSocialComposer(true);
  };

  const uploadSocialImage = async (file: File) => {
    if (!profile?.id) throw new Error('Vui lòng đăng nhập lại.');

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg';
    const safeExtension = extension || 'jpg';
    const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
    const { error } = await supabase!.storage.from('social-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return supabase!.storage.from('social-media').getPublicUrl(filePath).data.publicUrl;
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
        request = request.filter('nickname', 'ilike', `%${keyword}%`);
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

  const handleSocialImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB để upload nhanh hơn.');
      event.target.value = '';
      return;
    }

    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSocialImageFile(file);
    setSocialImagePreview(previewUrl);
    setSocialComposer((prev: SocialComposerState) => ({ ...prev, imageUrl: '' }));
    event.target.value = '';
  };

  const openQuickDropCamera = () => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng Drop.');
      return;
    }

    setActiveTab?.('feed');
    setShowQuickDropCamera(true);
  };

  const closeQuickDropCamera = () => {
    setShowQuickDropCamera(false);
  };

  const handleQuickDropCapture = async (blob: Blob) => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng Drop.');
      return;
    }

    const file = new File([blob], `drop-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    setIsPublishingQuickDrop(true);
    const toastId = toast.loading('Đang đăng Drop...');
    try {
      const imageUrl = await uploadSocialImage(file);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: '',
        image_url: imageUrl,
        post_kind: 'story',
        visibility: 'followers',
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      }).select('id').single();
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được Drop vừa tạo.');

      toast.success('Drop đã lên sóng.', { id: toastId });
      setShowQuickDropCamera(false);
      await refreshSocialFeed({ silent: true });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      setIsPublishingQuickDrop(false);
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

  const handlePublishSocialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const trimmedContent = socialComposer.content.trim();
    const trimmedImageUrl = socialComposer.imageUrl.trim();

    if (socialComposer.postKind === 'story' && !trimmedImageUrl && !socialImageFile) {
      toast.error('Drop cần ảnh chụp nhanh trước khi đăng.');
      return;
    }

    if (socialComposer.postKind !== 'story' && !trimmedContent && !trimmedImageUrl && !socialImageFile) {
      toast.error('Viết gì đó hoặc thêm ảnh trước khi đăng.');
      return;
    }

    setIsPublishingSocialPost(true);
    const toastId = toast.loading(socialComposer.postKind === 'story' ? 'Đang đăng story...' : 'Đang đăng bài...');

    try {
      let imageUrl = trimmedImageUrl || null;
      if (socialImageFile) {
        imageUrl = await uploadSocialImage(socialImageFile);
      }

      const expiresAt = socialComposer.postKind === 'story'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const persistedPostKind = socialComposer.postKind === 'progress' ? 'status' : socialComposer.postKind;
      const { data, error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: socialComposer.postKind === 'story' ? '' : trimmedContent,
        image_url: imageUrl,
        post_kind: persistedPostKind,
        visibility: socialComposer.visibility,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      }).select('id').single();
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được bài viết vừa tạo.');

      const successMessage = socialComposer.postKind === 'story'
        ? 'Drop đã lên sóng.'
        : socialComposer.postKind === 'challenge'
          ? 'Duel đã lên feed.'
          : 'Pulse đã xuất hiện trên feed.';
      toast.success(successMessage, { id: toastId });
      closeSocialComposer();
      await refreshSocialFeed({ silent: true });
    } catch (err: unknown) {
      toast.error(getSocialErrorMessage(err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      setIsPublishingSocialPost(false);
    }
  };

  return {
    showSocialComposer, setShowSocialComposer,
    showDiscoverPeople, setShowDiscoverPeople,
    showSocialProfile, setShowSocialProfile,
    socialComposer, setSocialComposer,
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
    isPublishingSocialPost, setIsPublishingSocialPost,
    showQuickDropCamera, setShowQuickDropCamera,
    isPublishingQuickDrop,
    isSocialSearching, setIsSocialSearching,
    socialImageFile, setSocialImageFile,
    socialImagePreview, setSocialImagePreview,
    socialImageInputRef,
    closeSocialComposer,
    openSocialComposer,
    openQuickDropCamera,
    closeQuickDropCamera,
    loadCloseCircle,
    handleSocialImagePicked,
    handleQuickDropCapture,
    handleSearchSocialUsers,
    handleAddCircleMember,
    handleRemoveCircleMember,
    handleFollowUser,
    handleUnfollowUser,
    handleToggleLikePost,
    handlePublishSocialPost
  };
}
