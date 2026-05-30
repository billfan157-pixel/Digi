/**
 * useDirectMessages Hook
 * Real-time 1:1 messaging
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Conversation {
  conversation_id: string;
  participant_id: string;
  participant_nickname: string;
  participant_avatar: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useDirectMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    const { error } = await supabase.rpc('send_direct_message', {
      p_conversation_id: conversationId,
      p_content: content,
    });
    if (error) throw error;
    fetchConversations();
  }, [fetchConversations]);

  const startConversation = useCallback(async (userId: string) => {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: userId,
    });
    if (error) throw error;
    return data;
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    await supabase.rpc('mark_messages_read', { p_conversation_id: conversationId });
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return { conversations, loading, sendMessage, startConversation, markRead, refetch: fetchConversations };
}
