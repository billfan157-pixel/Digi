import { useState, useRef, useEffect } from 'react';
import { X, Loader2, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComments } from '../../hooks/useComments';
import { getRelativeTimeLabel } from '../../lib/social';
import type { SocialFeedPost, SocialComment } from '../../models';

interface CommentsViewProps {
  post: SocialFeedPost;
  currentUserId: string | undefined;
  onClose: () => void;
}

export const CommentsView = ({ post, currentUserId, onClose }: CommentsViewProps) => {
  const { comments, isLoading, addComment, deleteComment } = useComments(post.id, currentUserId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{id: string, name: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    const finalContent = replyTo && !text.startsWith(`@${replyTo.name}`) ? `@${replyTo.name} ${text}` : text;
    setIsSubmitting(true);
    try {
      await addComment(finalContent);
      setText('');
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReact = async (emoji: string) => {
    if (isSubmitting) return;
    if (navigator.vibrate) navigator.vibrate(50);
    const finalContent = replyTo ? `@${replyTo.name} ${emoji}` : emoji;
    setIsSubmitting(true);
    try {
      await addComment(finalContent);
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

const handleDeleteComment = async (commentId: string) => {
    const { confirmDialog } = await import('../../store/useConfirmDialog');
    const ok = await confirmDialog({ title: 'Xóa bình luận', message: 'Bạn có chắn chắn muốn xóa bình luận này?', confirmLabel: 'Xóa', variant: 'danger' });
    if (!ok) return;
    await deleteComment(commentId);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full h-[75vh] rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 rounded-t-3xl">
          <h3 className="text-white font-bold text-lg">Bình luận ({comments.length})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X size={20}/></button>
        </div>
        
        {/* Danh sách Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? <p className="text-slate-400 text-center text-sm py-8"><Loader2 size={24} className="animate-spin mx-auto mb-2"/> Đang tải bình luận...</p> :
            comments.length === 0 ? <p className="text-slate-400 text-center text-sm py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p> :
            comments.map((c: SocialComment, index: number) => {
              const isReply = c.content.trim().startsWith('@');
              const contentParts = c.content.split(' ');
              const mentionedUser = isReply ? contentParts[0].substring(1) : null;
              const actualContent = isReply ? contentParts.slice(1).join(' ') : c.content;
              
              return (
                <div key={c.id || `comment-${index}`} className={`flex gap-3 relative group ${isReply ? 'ml-8 mt-1' : 'mt-4'}`}>
                  {isReply && (
                    <div className="absolute -left-6 top-4 w-4 h-4 border-l-2 border-b-2 border-slate-600 rounded-bl-lg opacity-50 pointer-events-none" />
                  )}
                  <div className={`${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
                    {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.author?.nickname || 'U')[0].toUpperCase()}
                  </div>
                  <div className={`flex-1 bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none ${isReply ? 'p-2.5' : 'p-3'} pr-8 relative`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-white text-xs font-bold">{c.author?.nickname || 'Người dùng'}</p>
                      {isReply && <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">▶ <span className="text-cyan-400">@{mentionedUser}</span></span>}
                    </div>
                    <p className={`text-slate-300 leading-relaxed ${isReply ? 'text-xs' : 'text-sm'}`}>{actualContent}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => setReplyTo({ id: c.id, name: c.author?.nickname || 'Người dùng' })} className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors">Phản hồi</button>
                      <span className="text-[10px] text-slate-600">{getRelativeTimeLabel(c.created_at || new Date().toISOString())}</span>
                    </div>

                    {(c.author_id === currentUserId || post.author_id === currentUserId) && (
                      <button onClick={() => handleDeleteComment(c.id)} className="absolute top-2 right-2 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          }
          <div ref={commentsEndRef} />
        </div>
        
        {/* Khung Input Chat */}
        <div className="p-4 border-t border-white/10 bg-slate-900 pb-8">
          {/* Quick Reactions */}
          <div className="flex gap-2 mb-3">
            {['💧', '🔥', '👏', '❤️', '🙌', '✨'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReact(emoji)}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all text-sm shadow-sm"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Indicator */}
          <AnimatePresence>
            {replyTo && (
              <motion.div key="reply-indicator" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg mb-2 overflow-hidden">
                <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                  Đang phản hồi <span className="text-white">@{replyTo.name}</span>
                </span>
                <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white"><X size={12}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea 
              value={text} onChange={e => setText(e.target.value)}
              placeholder={replyTo ? `Nhập phản hồi...` : "Viết bình luận..."} 
              className="flex-1 bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none h-[44px] min-h-[44px] max-h-[100px]"
              rows={1}
            />
            <button type="submit" disabled={!text.trim() || isSubmitting} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-3 rounded-xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-95 shrink-0">
              <Send size={20} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

