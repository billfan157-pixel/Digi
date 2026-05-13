import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readFeedCache, writeFeedCache } from '@/lib/sessionSecurity';

const PAGE_SIZE = 10;

/** Đảm bảo user có row trong public_profiles để JOIN hiển thị tên */
async function ensurePublicProfile(userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('public_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    // Copy từ profiles sang public_profiles
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

export function useFeed(currentUserId: string | undefined, friendIds: string[] = []) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const postsLengthRef = useRef(0);
  const visibleAuthorIds = useMemo(
    () => Array.from(new Set([currentUserId, ...friendIds].filter(Boolean))) as string[],
    [currentUserId, friendIds]
  );
  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  useEffect(() => {
    if (currentUserId && currentUserId !== 'undefined') {
      void ensurePublicProfile(currentUserId).catch(error => {
        console.error('Lỗi đồng bộ public profile:', error);
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    setPosts(currentUserId && currentUserId !== 'undefined'
      ? readFeedCache<any[]>(currentUserId) || []
      : []);
    setPendingPosts([]);
    setNewPostsCount(0);
    setHasMore(true);
  }, [currentUserId]);

  const fetchPosts = useCallback(async (offset: number) => {
    if (!currentUserId || currentUserId === 'undefined') return;
    const isFirstPage = offset === 0;

    // 1. Load từ Local Cache trước (Offline-First) cho trang đầu
    if (isFirstPage) {
      try {
        const cached = readFeedCache<any[]>(currentUserId);
        if (cached) {
          setPosts(cached);
        } else {
          setIsLoading(true);
        }
      } catch (e) { }
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          author:public_profiles!social_posts_author_public_profile_fkey (id, nickname, avatar_url, level, water_today, water_goal),
          post_cheers (user_id)
        `)
        .neq('post_kind', 'story')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const visibleRows = data.filter((post: any) => {
          if (post.author_id === currentUserId) return true;
          if (post.post_kind === 'challenge') return friendIdSet.has(post.author_id);
          return post.visibility === 'public' || friendIdSet.has(post.author_id);
        });

        const formatted = visibleRows.map((post: any) => ({
          ...post,
          cheeredByMe: post.post_cheers?.some((l: any) => l.user_id === currentUserId) ?? false,
        }));

        if (isFirstPage) {
          setPosts(formatted);
          postsLengthRef.current = formatted.length;
          // 2. Cập nhật lại Cache
          writeFeedCache(currentUserId, formatted);
        }
        else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = formatted.filter((p: any) => !existingIds.has(p.id));
            const merged = [...prev, ...newPosts];
            postsLengthRef.current = merged.length;
            return merged;
          });
        }

        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error('Lỗi tải feed:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [currentUserId, friendIdSet]);

  // Public refetch for pull-to-refresh
  const refetch = useCallback(async () => {
    if (!currentUserId || currentUserId === 'undefined') return;
    await fetchPosts(0);
  }, [currentUserId, fetchPosts]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Supabase Realtime Subscription cho bài mới
  useEffect(() => {
    if (!currentUserId || currentUserId === 'undefined') return;

    // Cleanup previous channel before creating new one
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
        async (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const newPost = payload.new as { id: string;[key: string]: any };
          const { data } = await supabase
            .from('social_posts')
            .select('*, author:public_profiles!social_posts_author_public_profile_fkey (id, nickname, avatar_url, level, water_today, water_goal)')
            .eq('id', newPost.id)
            .single();
          
          if (data) {
            if (data.post_kind === 'story') return;
            // Simplified check for performance
            setPendingPosts(prev => [data, ...prev]);
            setNewPostsCount(prev => prev + 1);
          }
        }
      );

    // Dùng setTimeout cực ngắn để đảm bảo callstack dọn dẹp channel cũ xong
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

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore) fetchPosts(postsLengthRef.current);
  }, [isLoading, isFetchingMore, hasMore, fetchPosts]);

  const showNewPosts = useCallback(() => {
    const formattedPending = pendingPosts.map(p => ({ ...p, likedByMe: false }));
    setPosts(prev => {
      const nextPosts = [...formattedPending, ...prev];
      postsLengthRef.current = nextPosts.length;
      writeFeedCache(currentUserId, nextPosts);
      return nextPosts;
    });
    setPendingPosts([]); setNewPostsCount(0);
  }, [pendingPosts, currentUserId]);

  return { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts, refetch };
}
