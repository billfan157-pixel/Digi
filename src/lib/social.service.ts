import { supabase } from '@/lib/supabase';
import type { CloseCircleMember, SocialDiscoverProfile, SocialFeedPost, SocialProfileStats } from '@/lib/social';

export async function fetchCloseCircle(userId: string): Promise<CloseCircleMember[]> {
  const { data: rows, error } = await supabase!
    .from('social_follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const partnerIds = (rows || []).map((row: { following_id: string }) => row.following_id).filter(Boolean);
  if (partnerIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase!
    .from('public_profiles')
    .select('id, nickname, avatar_url, level, water_today, water_goal')
    .in('id', partnerIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles || []).map((row: { id: string; nickname: string; avatar_url?: string | null; level?: number | null; water_today?: number | null; water_goal?: number | null }) => [row.id, row]));

  return (rows || []).map((row: { following_id: string }, index: number) => {
    const partner = profileMap.get(row.following_id);
    return {
      id: row.following_id,
      nickname: partner?.nickname || 'Bạn DigiWell',
      avatar_url: partner?.avatar_url ?? null,
      level: partner?.level ?? null,
      water_today: partner?.water_today ?? null,
      water_goal: partner?.water_goal ?? null,
      priority: index + 1,
      is_pinned: false,
    } satisfies CloseCircleMember;
  });
}

export async function fetchSocialFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase!
    .from('social_follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data || []).map((row: { following_id: string }) => row.following_id);
}

export async function fetchSocialProfileStats(userId: string): Promise<SocialProfileStats> {
  const { data, error } = await supabase!
    .rpc('get_profile_stats', { p_user_id: userId });
  if (error) throw error;
  const stats = data || { follower_count: 0, following_count: 0, post_count: 0 };
  return { followers: stats.follower_count, following: stats.following_count, posts: stats.post_count };
}

export async function fetchSocialFeed(
  userId: string,
  friendIds: string[],
): Promise<{ posts: SocialFeedPost[]; stories: SocialFeedPost[] }> {
  const feedAuthorIds = Array.from(new Set([userId, ...friendIds]));
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
      ? supabase!.from('post_cheers').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (likesRes.error) throw likesRes.error;

  const profileMap = new Map((profilesRes.data || []).map((row: { id: string; nickname: string; avatar_url?: string | null; level?: number | null; water_today?: number | null; water_goal?: number | null }) => [row.id, {
    id: row.id, nickname: row.nickname || 'Người dùng DigiWell', avatar_url: row.avatar_url ?? null,
    level: row.level ?? null, water_today: row.water_today ?? null, water_goal: row.water_goal ?? null,
  }]));
  const likedPostIds = new Set((likesRes.data || []).map((row: { post_id: string }) => row.post_id));

  const mappedPosts: SocialFeedPost[] = validRows.map((row: Record<string, unknown>, index: number) => {
    const rowId = String(row.id || `post-fallback-${index}`);
    const authorId = String(row.author_id || '');
    return {
      id: rowId, author_id: authorId,
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
      author: profileMap.get(authorId) || { id: authorId, nickname: 'Người dùng DigiWell' },
      likedByMe: likedPostIds.has(rowId),
    };
  });

  const storyMap = new Map<string, SocialFeedPost>();
  const latestStories = mappedPosts
    .filter(post => post.post_kind === 'story')
    .reduce<SocialFeedPost[]>((acc, post) => {
      if (storyMap.has(post.author_id)) return acc;
      storyMap.set(post.author_id, post);
      acc.push(post);
      return acc;
    }, []);

  return { posts: mappedPosts.filter(post => post.post_kind !== 'story'), stories: latestStories };
}

export async function searchSocialProfiles(userId: string, query: string, circleIds: string[], followingIds: string[]): Promise<SocialDiscoverProfile[]> {
  const keyword = query.trim();
  let request = supabase!
    .from('public_profiles')
    .select('id, nickname, avatar_url, level, water_today, water_goal')
    .neq('id', userId);

  if (keyword) {
    const escaped = keyword.replace(/[%_\\]/g, '\\$&');
    request = request.filter('nickname', 'ilike', `%${escaped}%`);
  } else {
    request = request.order('nickname', { ascending: true });
  }

  const { data, error } = await request.limit(8);
  if (error) throw error;

  const circleSet = new Set(circleIds);
  return (data || []).map((user: { id: string; nickname: string; avatar_url?: string | null; level?: number | null; water_today?: number | null; water_goal?: number | null }, index: number) => ({
    id: user.id || `search-user-fallback-${index}`,
    nickname: user.nickname || 'Người dùng DigiWell',
    isFollowing: followingIds.includes(user.id),
    isInCircle: circleSet.has(user.id),
    avatar_url: user.avatar_url ?? null,
    level: user.level ?? null,
    water_today: user.water_today ?? null,
    water_goal: user.water_goal ?? null,
  }));
}

export async function addFollow(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase!
    .from('social_follows')
    .upsert(
      { follower_id: followerId, following_id: followingId },
      { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeFollow(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase!
    .from('social_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function addLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase!.from('social_post_likes').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function removeLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase!.from('social_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
  if (error) throw error;
}
