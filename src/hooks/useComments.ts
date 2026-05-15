import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { SocialComment } from '../models';

interface SocialCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export function useComments(postId: string, currentUserId: string | undefined) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('social_comments')
      .select('id, post_id, author_id, content, like_count, created_at, updated_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      const authorIds = Array.from(new Set(data.map((comment: SocialCommentRow) => comment.author_id).filter(Boolean)));
      const { data: authors } = authorIds.length > 0
        ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', authorIds)
        : { data: [] };
      const authorMap = new Map((authors || []).map((author: { id: string; nickname: string; avatar_url?: string | null }) => [author.id, author]));
      setComments(data.map((comment: SocialCommentRow) => ({
        id: comment.id,
        post_id: comment.post_id,
        author_id: comment.author_id,
        content: comment.content,
        like_count: comment.like_count,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: authorMap.get(comment.author_id) || { nickname: 'Người dùng' },
      })));
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    setTimeout(() => fetchComments(), 0);
  }, [fetchComments]);

  // Supabase Realtime cho bình luận mới / xóa
  useEffect(() => {
    if (!postId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`comments-${postId}-${Date.now()}`);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'social_comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const newComment = payload.new as SocialCommentRow;
          if (newComment.author_id === currentUserId) return;

          const { data: author } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .eq('id', newComment.author_id)
            .maybeSingle();

          setComments(prev => [...prev, {
            id: newComment.id,
            post_id: newComment.post_id,
            author_id: newComment.author_id,
            content: newComment.content,
            like_count: newComment.like_count,
            created_at: newComment.created_at,
            updated_at: newComment.updated_at,
            author: author || { nickname: 'Người dùng' },
          }]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'social_comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
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
  }, [postId, currentUserId]);

  const addComment = async (content: string) => {
    if (!currentUserId) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!content.trim()) return;
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newComment: SocialComment = { id: tempId, post_id: postId, author_id: currentUserId, content, like_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), author: { nickname: 'Bạn' } };

    setComments(prev => [...prev, newComment]);

    const { data, error } = await supabase.from('social_comments').insert({ post_id: postId, author_id: currentUserId, content }).select('id, post_id, author_id, content, like_count, created_at, updated_at').single();

    if (error) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      toast.error(error.message === 'JWT expired' ? 'Phiên đăng nhập hết hạn' : 'Gửi bình luận thất bại');
    } else if (data) {
      const { data: author } = await supabase.from('profiles').select('id, nickname, avatar_url').eq('id', currentUserId).maybeSingle();
      setComments(prev => prev.map(c => c.id === tempId ? { ...data, author: author || { nickname: 'Bạn' } } : c));
    }
  };

  const deleteComment = async (id: string) => {
    if (!currentUserId) return;
    const prev = [...comments];
    setComments(prev.filter(c => c.id !== id));
    const { error } = await supabase
      .from('social_comments')
      .delete()
      .eq('id', id)
      .eq('author_id', currentUserId);

    if (error) {
      setComments(prev);
      toast.error('Không thể xóa bình luận');
    }
  };

  return { comments, isLoading, addComment, deleteComment };
}
