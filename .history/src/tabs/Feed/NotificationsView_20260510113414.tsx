import { X, Bell } from 'lucide-react';
import { useRef, useCallback } from 'react';
import { getRelativeTimeLabel } from '../../lib/social';
import type { SocialNotification } from '../../models';
interface NotificationsViewProps {
  notifications: SocialNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationsView = ({ notifications, unreadCount, markAllRead, markAsRead, onClose }: NotificationsViewProps) => {
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateToPost = useCallback((referenceId: string) => {
    onClose();
    // Allow modal close animation before scrolling
    setTimeout(() => {
      const el = document.getElementById(`post-${referenceId}`);
      if (!el) return;

      // Scroll the feed container to the post
      const container = document.querySelector('[data-feed-scroll-container]');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollOffset = elRect.top - containerRect.top + container.scrollTop - 80;
        container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
      }

      // Highlight pulse
      el.classList.add('ring-2', 'ring-cyan-500', 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', 'scale-[1.02]', 'z-50');
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-cyan-500', 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', 'scale-[1.02]', 'z-50');
      }, 2000);
    }, 300);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full h-[85vh] rounded-t-3xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-lg">Thông báo</h3>
            {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} mới</span>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-cyan-400 text-xs font-bold hover:text-cyan-300 px-3 py-1.5 rounded-full bg-cyan-500/10 active:scale-95 transition-all">Đánh dấu đã đọc</button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n, index: number) => (
                <div 
                  key={n.id || `notif-${index}`} 
                  onClick={() => { 
                    if (!n.is_read) markAsRead(n.id); 
                    const targetId = n.reference_id;
                    if (targetId) navigateToPost(targetId);
                  }}
                  className={`flex gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${n.is_read ? 'opacity-70 hover:bg-white/5' : 'bg-cyan-500/10 border border-cyan-500/20'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {n.actor?.avatar_url ? <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" /> : (n.actor?.nickname || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">
                      <span className="font-bold text-white">{n.actor?.nickname || 'Ai đó'}</span> {n.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{getRelativeTimeLabel(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
