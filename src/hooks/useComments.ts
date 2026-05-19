import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { SocialComment } from '../models';

const COMMENTS_QUERY_KEY = (postId: string) => ['comments', postId] as const;

interface SocialCommentRow {
  id: string; post_id: string; author_id: string; content: string;
  like_count: number; created_at: string; updated_at: string;
}

async function fetchComments(postId: string): Promise<SocialComment[]> {
  const { data, error } = await supabase
    .from('social_comments')
    .select('id, post_id, author_id, content, like_count, created_at, updated_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  const authorIds = Array.from(new Set((data || []).map((c: SocialCommentRow) => c.author_id).filter(Boolean)));
  const { data: authors } = authorIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', authorIds)
    : { data: [] };
  const authorMap = new Map((authors || []).map((a: { id: string; nickname: string; avatar_url?: string | null }) => [a.id, a]));

  return (data || []).map((c: SocialCommentRow) => ({
    id: c.id, post_id: c.post_id, author_id: c.author_id, content: c.content,
    like_count: c.like_count, created_at: c.created_at, updated_at: c.updated_at,
    author: authorMap.get(c.author_id) || { nickname: 'Người dùng' },
  }));
}

interface UseCommentsReturn {
  comments: SocialComment[];
  isLoading: boolean;
  addComment: (content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
}

export function useComments(postId: string, currentUserId: string | undefined): UseCommentsReturn {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryKey = COMMENTS_QUERY_KEY(postId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
    staleTime: 15_000,
  });

  const addCommentMut = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('social_comments')
        .insert({ post_id: postId, author_id: currentUserId, content })
        .select('id, post_id, author_id, content, like_count, created_at, updated_at')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<SocialComment[]>(queryKey);
      const optimistic: SocialComment = {
        id: `temp-${Date.now()}`, post_id: postId, author_id: currentUserId || '',
        content, like_count: 0, created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), author: { nickname: 'Bạn' },
      };
      queryClient.setQueryData<SocialComment[]>(queryKey, (old) => [...(old || []), optimistic]);
      return { prev };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error('Gửi bình luận thất bại');
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData<SocialComment[]>(queryKey, (old) =>
          (old || []).map(c => c.id.startsWith('temp-') ? { ...data, author: { nickname: 'Bạn' } } : c),
        );
      }
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_comments')
        .delete()
        .eq('id', id)
        .eq('author_id', currentUserId);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<SocialComment[]>(queryKey);
      queryClient.setQueryData<SocialComment[]>(queryKey, (old) => (old || []).filter(c => c.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error('Không thể xóa bình luận');
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!postId) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`comments-${postId}-${Date.now()}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'social_comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const newComment = payload.new as SocialCommentRow;
          if (newComment.author_id === currentUserId) return;
          const { data: author } = await supabase.from('profiles').select('id, nickname, avatar_url').eq('id', newComment.author_id).maybeSingle();
          queryClient.setQueryData<SocialComment[]>(queryKey, (old) => [...(old || []), {
            id: newComment.id, post_id: newComment.post_id, author_id: newComment.author_id,
            content: newComment.content, like_count: newComment.like_count,
            created_at: newComment.created_at, updated_at: newComment.updated_at,
            author: author || { nickname: 'Người dùng' },
          }]);
        },
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'social_comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          queryClient.setQueryData<SocialComment[]>(queryKey, (old) => (old || []).filter(c => c.id !== payload.old.id));
        },
      );

    const subTimeout = setTimeout(() => {
      if (channelRef.current === channel) channel.subscribe();
    }, 50);

    return () => {
      clearTimeout(subTimeout);
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [postId, currentUserId, queryClient, queryKey]);

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment: useCallback(async (content: string) => {
      if (!currentUserId) { toast.error('Vui lòng đăng nhập để bình luận'); return; }
      if (!content.trim()) return;
      await addCommentMut.mutateAsync(content);
    }, [currentUserId, addCommentMut]),
    deleteComment: useCallback(async (id: string) => {
      await deleteCommentMut.mutateAsync(id);
    }, [deleteCommentMut]),
  };
}
