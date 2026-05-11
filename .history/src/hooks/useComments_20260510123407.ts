import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useComments(postId: string, currentUserId: string | undefined) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('social_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useComments(postId: string, currentUserId: string | undefined) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!currentUserId) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!content.trim()) return;
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newComment = { id: tempId, post_id: postId, user_id: currentUserId, content, created_at: new Date().toISOString(), author: { nickname: 'Bạn' } };
    
    setComments(prev => [...prev, newComment]); // Optimistic
    
    const { data, error } = await supabase.from('social_post_comments').insert({ post_id: postId, user_id: currentUserId, content }).select('*').single();
    
    if (error) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      toast.error('Gửi bình luận thất bại');
    } else if (data) {
      const { data: author } = await supabase.from('public_profiles').select('id, nickname, avatar_url').eq('id', currentUserId).maybeSingle();
      setComments(prev => prev.map(c => c.id === tempId ? { ...data, author: author || { nickname: 'Bạn' } } : c));
    }
  };

  const deleteComment = async (id: string) => {
    const prev = [...comments];
    setComments(prev.filter(c => c.id !== id));
    const { error } = await supabase.from('social_post_comments').delete().eq('id', id);
    if (error) { setComments(prev); toast.error('Không thể xóa bình luận'); }
  };

  return { comments, isLoading, addComment, deleteComment };
}
