import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readFeedCache, writeFeedCache } from '@/lib/sessionSecurity';

const PAGE_SIZE = 10;

export function useFeed(currentUserId: string | undefined) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const postsLengthRef = useRef(0);
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readFeedCache, writeFeedCache } from '@/lib/sessionSecurity';

const PAGE_SIZE = 10;

export function useFeed(currentUserId: string | undefined) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      } catch(e) {}
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          author:public_profiles!social_posts_author_public_profile_fkey (id, nickname, avatar_url, level, water_today, water_goal),
          social_post_likes (user_id)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const formatted = data.map((post: any) => ({
          ...post,
          likedByMe: post.social_post_likes?.some((l: any) => l.user_id === currentUserId) ?? false,
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
      } catch(e) {}
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          author:public_profiles!social_posts_author_public_profile_fkey (id, nickname, avatar_url, level, water_today, water_goal),
          social_post_likes (user_id)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore) fetchPosts(posts.length);
  }, [isLoading, isFetchingMore, hasMore, posts.length, fetchPosts]);

  const showNewPosts = useCallback(() => {
    const formattedPending = pendingPosts.map(p => ({ ...p, likedByMe: false }));
    setPosts(prev => {
      const nextPosts = [...formattedPending, ...prev];
      writeFeedCache(currentUserId, nextPosts);
      return nextPosts;
    });
    setPendingPosts([]); setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pendingPosts, currentUserId]);

  return { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts, refetch };
}
