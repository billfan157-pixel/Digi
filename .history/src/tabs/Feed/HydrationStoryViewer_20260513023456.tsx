import { useEffect, useState, useCallback } from 'react';
import { X, MessageCircle, Heart, Smile, Droplets, CloudSun, Coffee, Zap, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getRelativeTimeLabel } from '../../lib/social';
import { getFallbackStoryDrink, getFallbackStoryPercent, getFallbackStoryTemperature } from '../../lib/feedUtils';
import type { SocialFeedPost } from '../../models';
import { CommentsView } from './CommentsView';
import { useAppStore } from '../../store/useAppStore';

interface HydrationStoryViewerProps {
  story: SocialFeedPost;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const QUICK_EMOJIS = ['💧', '🔥', '👏', '❤️', '🙌', '✨'];

export const HydrationStoryViewer = ({ story, onClose, onNext, onPrev }: HydrationStoryViewerProps) => {
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reactedEmojis, setReactedEmojis] = useState<Set<string>>(new Set());
  const profile = useAppStore((s) => s.profile);
  const currentUserId = profile?.id;

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onNext, 5000);
    return () => clearTimeout(timer);
  }, [story, onNext, paused]);

  const handleStartTouch = () => setPaused(true);
  const handleEndTouch = () => setPaused(false);

  const handleReact = useCallback(async (emoji: string) => {
    if (!currentUserId) {
      toast.error('Vui lòng đăng nhập để tương tác');
      return;
    }
    if (reactedEmojis.has(emoji)) return;

    // Optimistic UI
    setReactedEmojis(prev => new Set(prev).add(emoji));
    setPaused(true);
    if (navigator.vibrate) navigator.vibrate(30);

    try {
      const { error } = await supabase.from('social_comments').insert({
        post_id: story.id,
        author_id: currentUserId,
        content: emoji,
      });
      if (error) throw error;
      toast.success(`Đã thả ${emoji}`, { duration: 1200 });
    } catch (err) {
      setReactedEmojis(prev => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
    }

    setTimeout(() => setPaused(false), 500);
  }, [currentUserId, story.id, reactedEmojis]);

  const pct = story.author?.water_goal
    ? Math.round(Math.min(100, (((typeof story.hydration_ml === 'number' ? story.hydration_ml : 0) || story.author?.water_today || 0) / story.author.water_goal) * 100))
    : getFallbackStoryPercent(story);

  const temp = getFallbackStoryTemperature(story);
  const drink = getFallbackStoryDrink(story);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-30 flex gap-1">
          <div className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
            <motion.div key={story.id} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-white shadow-[0_0_8px_#fff]" />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/50 flex items-center justify-center overflow-hidden shadow-lg">
              {story.author?.avatar_url ? <img src={story.author.avatar_url} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{(story.author?.nickname || 'U')[0].toUpperCase()}</span>}
            </div>
            <div className="drop-shadow-md">
              <p className="text-white font-bold text-sm leading-tight">{story.author?.nickname}</p>
              <p className="text-white/80 text-xs font-medium">{getRelativeTimeLabel(story.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md active:scale-95 transition-all hover:bg-black/50">
            <X size={20} />
          </button>
        </div>

        {/* Tap Controls */}
        <div
          className="absolute inset-0 z-20 flex"
          onTouchStart={handleStartTouch}
          onTouchEnd={handleEndTouch}
          onMouseDown={handleStartTouch}
          onMouseUp={handleEndTouch}
        >
          <div className="flex-1" onClick={onPrev} />
          <div className="flex-[2]" onClick={onNext} />
        </div>

        {/* Background Media */}
        <div className="absolute inset-0 z-0">
          {story.image_url ? <img src={story.image_url} className="w-full h-full object-cover opacity-90" /> : <div className={`w-full h-full bg-gradient-to-br ${pct >= 100 ? 'from-emerald-900 to-teal-950' : pct >= 50 ? 'from-cyan-900 to-blue-950' : 'from-amber-900 to-orange-950'}`} />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
        </div>

        {/* Hydration Data */}
        <div className="absolute bottom-36 left-6 right-6 z-30 flex flex-col gap-4 pointer-events-none">
          {story.content && <p className="text-white text-3xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-tight">{story.content}</p>}
          <div className="flex flex-wrap gap-2">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><span className="text-white font-bold text-sm">Đạt {pct}% mục tiêu</span></motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><span className="text-white font-bold text-sm">Thời tiết {temp}°C</span></motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><span className="text-white font-bold text-sm">{drink}</span></motion.div>
            {(story.streak_snapshot || 0) > 0 && <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="px-3 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"><span className="text-white font-bold text-sm">Chuỗi {story.streak_snapshot} ngày</span></motion.div>}
          </div>
        </div>

        {/* Emoji Reactions + Comment */}
        <div className="absolute bottom-6 left-6 right-6 z-30">
          {/* Emoji row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {QUICK_EMOJIS.map(emoji => {
              const isReacted = reactedEmojis.has(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg active:scale-90 transition-all ${
                    isReacted
