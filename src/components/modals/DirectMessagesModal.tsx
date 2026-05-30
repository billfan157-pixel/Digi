/**
 * DirectMessagesModal Component
 * Private 1:1 messaging between users
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, MessageCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { LazyImage } from '@/components/LazyImage';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string | null;
  initialRecipientId?: string | null;
}

interface Conversation {
  conversation_id: string;
  participant_id: string;
  participant_nickname: string;
  participant_avatar: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_nickname: string;
  sender_avatar: string | null;
}

export const DirectMessagesModal = ({
  isOpen,
  onClose,
  initialConversationId,
  initialRecipientId,
}: DirectMessagesModalProps) => {
  const { t } = useTranslation();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
  const [messageText, setMessageText] = useState('');
  const [isShowingInbox, setIsShowingInbox] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!activeConversationId) return [];
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: activeConversationId,
        p_limit: 50,
      });
      if (error) throw error;
      return (data || []).reverse();
    },
    enabled: isOpen && !!activeConversationId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversationId) {
        // Need to get or create conversation first
        if (!initialRecipientId) return;
        const { data: convData } = await supabase.rpc('get_or_create_conversation', {
          p_other_user_id: initialRecipientId,
        });
        if (!convData) return;
        setActiveConversationId(convData);
        await supabase.rpc('send_direct_message', {
          p_conversation_id: convData,
          p_content: content,
        });
      } else {
        await supabase.rpc('send_direct_message', {
          p_conversation_id: activeConversationId,
          p_content: content,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
      setMessageText('');
      scrollToBottom();
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (activeConversationId) {
      supabase.rpc('mark_messages_read', { p_conversation_id: activeConversationId });
    }
  }, [activeConversationId, messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Realtime subscription
  useEffect(() => {
    if (!isOpen || !activeConversationId) return;

    const channel = supabase
      .channel(`dm-${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== profile?.id) {
            queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeConversationId, profile?.id, queryClient]);

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConversationId(convId);
    setIsShowingInbox(false);
  }, []);

  const handleBackToInbox = useCallback(() => {
    setIsShowingInbox(true);
    setActiveConversationId(null);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    sendMessage.mutate(messageText.trim());
  }, [messageText, sendMessage]);

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('dm.just_now');
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}gi`;
    return `${days}ngày`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
          {activeConversationId && !isShowingInbox && (
            <button
              onClick={handleBackToInbox}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">
              {isShowingInbox ? 'Messages' : 'Message'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Inbox View */}
          {isShowingInbox && (
            <div className="h-full overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <MessageCircle size={48} className="text-slate-600" />
                  <p className="text-slate-500 text-sm">No conversations yet</p>
                  <p className="text-slate-600 text-xs">{t('dm.start_chat')}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {conversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => handleSelectConversation(conv.conversation_id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden">
                        {conv.participant_avatar ? (
                          <LazyImage
                            src={conv.participant_avatar}
                            alt={conv.participant_nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                            {conv.participant_nickname?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold text-sm truncate">
                            {conv.participant_nickname}
                          </p>
                          <span className="text-slate-500 text-xs">
                            {getRelativeTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">
                          {conv.last_message_preview || 'Start a conversation'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {conv.unread_count}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat View */}
          {!isShowingInbox && activeConversationId && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-cyan-600 text-white rounded-br-md'
                              : 'bg-slate-800 text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-cyan-200' : 'text-slate-500'}`}>
                            {getRelativeTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-slate-900/80 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t('common.type_message')}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
