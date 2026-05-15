import { useState, memo } from 'react';
import { Activity, Droplets, Swords } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Profile } from '../../models';
import type { SignaturePostKind } from './types';
import { QuickStatusComposer } from './QuickStatusComposer';
import { QuickChallengeComposer } from './QuickChallengeComposer';
import { sanitizeInput } from '@/lib/sanitize';

interface FeedComposerProps {
  profile: Profile | null;
  onCreateDrop: () => void;
}

export const FeedComposer = memo(function FeedComposer({ profile, onCreateDrop }: FeedComposerProps) {
  const { waterIntake, waterGoal, streak } = useAppStore(useShallow(s => ({
    waterIntake: s.waterIntake,
    waterGoal: s.waterGoal,
    streak: s.streak,
  })));
  const progressPercent = Math.min(100, Math.round((waterIntake / Math.max(waterGoal, 1)) * 100));

  const [activeComposer, setActiveComposer] = useState<Extract<SignaturePostKind, 'pulse' | 'duel'> | null>(null);

  const name = profile?.nickname || 'Bạn';
  const initial = name[0]?.toUpperCase() || 'U';

  const handlePublishPost = async (postData: {
    content: string;
    imageUrl?: string;
    postKind: 'pulse' | 'duel';
    visibility?: 'public' | 'followers';
    extra?: Record<string, unknown>;
  }) => {
    if (!profile?.id) {
      toast.error('Bạn cần đăng nhập để đăng bài.');
      return;
    }

    const toastId = toast.loading('Đang đăng bài...');
    try {
      let finalImageUrl: string | null = null;
      if (postData.imageUrl) {
        if (postData.imageUrl.startsWith('blob:')) {
          const resp = await fetch(postData.imageUrl);
          const blob = await resp.blob();
          finalImageUrl = await new Promise<string | null>(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } else {
          finalImageUrl = postData.imageUrl;
        }
      }

      const persistedPostKind = postData.postKind === 'pulse' ? 'status' : 'challenge';
      const sanitizedContent = sanitizeInput(postData.content, 500);
      const { data, error } = await supabase.from('social_posts').insert({
        author_id: profile.id,
        content: sanitizedContent,
        image_url: finalImageUrl,
        post_kind: persistedPostKind,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        visibility: postData.postKind === 'duel' ? 'followers' : postData.visibility || 'followers',
        ...postData.extra,
      }).select('id').single();
      
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được bài viết vừa tạo.');
      
      toast.success(postData.postKind === 'duel' ? 'Duel đã lên feed.' : 'Pulse đã được đăng.', { id: toastId });
      setActiveComposer(null);
    } catch {
      toast.error('Không thể đăng bài lúc này!', { id: toastId });
    }
  };

  return (
    <div className="mx-4 space-y-2.5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-4 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-50" />
        
        <div className="relative space-y-4">
          {/* Main Input Trigger */}
          <button
            onClick={() => setActiveComposer('pulse')}
            className="flex items-center gap-4 w-full text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-[1.5px] border border-white/5">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-slate-500">{initial}</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-300">Bạn đang nạp gì thế?</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 mt-0.5">
                {progressPercent}% mục tiêu • Chuỗi {streak} ngày
              </p>
            </div>
          </button>

          <div className="h-[1px] w-full bg-white/5" />

          {/* Quick Action Strip - Compact Icons */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => setActiveComposer('pulse')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                <Activity size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">Pulse</span>
            </button>

            <button
              onClick={onCreateDrop}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Droplets size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 transition-colors">Drop</span>
            </button>

            <button
              onClick={() => setActiveComposer('duel')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Swords size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">Duel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Composer Modals */}
      <AnimatePresence mode="wait">
        {activeComposer === 'pulse' && profile && (
          <QuickStatusComposer
            key="status-composer"
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            streak={streak}
            onPublish={handlePublishPost}
            onClose={() => setActiveComposer(null)}
          />
        )}
        {activeComposer === 'duel' && profile && (
          <QuickChallengeComposer
            key="challenge-composer"
            profile={profile}
            onPublish={handlePublishPost}
            onClose={() => setActiveComposer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default FeedComposer;
