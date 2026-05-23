import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readFeedCache, writeFeedCache } from '@/lib/sessionSecurity';
import type { SocialFeedPost } from '@/models';
import { appQueryKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 10;

async function ensurePublicProfile(userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('public_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, level, water_today, water_goal')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;

    if (profile) {
      const { error: upsertError } = await supabase.from('public_profiles').upsert({
        id: profile.id,
        nickname: profile.nickname || 'Người dùng DigiWell',
        avatar_url: profile.avatar_url,
        level: profile.level || 1,
        water_today: profile.water_today || 0,
        water_goal: profile.water_goal || 2000,
      }, { ignoreDuplicates: true });
      if (upsertError) throw upsertError;
    }
  }
}

type SocialFeedPostRow = SocialFeedPost & {
  social_post_likes?: Array<{ user_id: string }>;
};

async function fetchFeedPage(
  currentUserId: string,
  friendIdSet: Set<string>,
  offset: number,
): Promise<SocialFeedPost[]> {
  const { data, error } = await supabase
    .from('social_posts')
    .select(`
      *,
      author:profiles!social_posts_author_id_fkey (id, nickname, avatar_url, level, water_today, water_goal),
      social_post_likes (user_id)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const visibleRows = (data || []).filter((post: SocialFeedPostRow) => {
    if (post.author_id === currentUserId) return true;
    if (post.post_kind === 'challenge') return friendIdSet.has(post.author_id);
    return post.visibility === 'public' || friendIdSet.has(post.author_id);
  });

  return visibleRows.map((post) => ({
    ...post,
    cheeredByMe:
      post.social_post_likes?.some((l: { user_id: string }) => l.user_id === currentUserId) ?? false,
  }));
}

export function useFeed(currentUserId: string | undefined, friendIds: string[] = []) {
  const [mergedPending, setMergedPending] = useState<SocialFeedPost[]>([]);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<SocialFeedPost[]>([]);
  const initialUserId = useRef(currentUserId);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  // Reset local state when userId changes
  useEffect(() => {
    initialUserId.current = currentUserId;
    /* eslint-disable react-hooks/set-state-in-effect */
    setMergedPending([]);
    setPendingPosts([]);
    setNewPostsCount(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId && currentUserId !== 'undefined') {
      void ensurePublicProfile(currentUserId).catch(error => {
        console.error('Lỗi đồng bộ public profile:', error);
      });
    }
  }, [currentUserId]);

  const feedQuery = useInfiniteQuery({
    queryKey: appQueryKeys.feed(currentUserId, friendIds),
    queryFn: async ({ pageParam = 0 }) => {
      if (!currentUserId || currentUserId === 'undefined') return [];
      return fetchFeedPage(currentUserId, friendIdSet, pageParam);
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!currentUserId && currentUserId !== 'undefined',
    staleTime: 30_000,
    placeholderData: () => {
      if (!currentUserId) return undefined;
      const cached = readFeedCache<SocialFeedPost[]>(currentUserId);
      if (!cached?.length) return undefined;
      return { pages: [cached], pageParams: [0] };
    },
  });

  useEffect(() => {
    if (feedQuery.data && currentUserId) {
      writeFeedCache(currentUserId, feedQuery.data.pages.flat());
    }
  }, [feedQuery.data, currentUserId]);

  useEffect(() => {
    if (!currentUserId || currentUserId === 'undefined') return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelId = `feed-${currentUserId}-${Date.now()}`;
    const channel = supabase.channel(channelId);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'social_posts' },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newPost = payload.new as { id: string;[key: string]: unknown };
          const { data } = await supabase
            .from('social_posts')
            .select('*, author:profiles!social_posts_author_id_fkey (id, nickname, avatar_url, level, water_today, water_goal)')
            .eq('id', newPost.id)
            .single();

          if (data) {
            setPendingPosts(prev => [data, ...prev]);
            setNewPostsCount(prev => prev + 1);
          }
        }
      );

    const subTimeout = setTimeout(() => {
      if (channelRef.current === channel) {
        channel.subscribe();
      }
    }, 50);

    return () => {
      clearTimeout(subTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  const posts = useMemo(() => {
    const base = feedQuery.data?.pages.flat() ?? [];
    const baseIds = new Set(base.map(p => p.id));
    const extra = mergedPending.filter(p => !baseIds.has(p.id));
    return [...extra, ...base];
  }, [mergedPending, feedQuery.data]);

  const loadMore = useCallback(() => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      feedQuery.fetchNextPage();
    }
  }, [feedQuery]);

  const showNewPosts = useCallback(() => {
    const formattedPending = pendingPosts.filter(Boolean).map(p => ({ ...p, cheeredByMe: false }));
    const base = feedQuery.data?.pages.flat() ?? [];
    const baseIds = new Set(base.map(p => p.id));
    const uniquePending = formattedPending.filter(p => !baseIds.has(p.id));
    const nextMerged = [...uniquePending, ...mergedPending];
    writeFeedCache(currentUserId, [...nextMerged, ...base]);
    setMergedPending(nextMerged);
    setPendingPosts([]);
    setNewPostsCount(0);
  }, [pendingPosts, currentUserId, feedQuery.data, mergedPending]);

  return {
    posts,
    isLoading: feedQuery.isLoading && feedQuery.fetchStatus !== 'idle',
    isFetchingMore: feedQuery.isFetchingNextPage,
    hasMore: !!feedQuery.hasNextPage,
    loadMore,
    newPostsCount,
    showNewPosts,
    refetch: () => feedQuery.refetch().then(() => {}),
  };
}
