import { useState, memo } from 'react';
import { Camera, Swords, BookOpen } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Profile } from '../../models';
import type { SignaturePostKind } from './types';
import { QuickStatusComposer } from './QuickStatusComposer';
import { QuickChallengeComposer } from './QuickChallengeComposer';

interface FeedComposerProps {
  profile: Profile | null;
  onCreateStory: () => void;
}

interface QuickAction {
  kind: Exclude<SignaturePostKind, 'peak' | 'proof'>;
  label: string;
  icon: typeof Camera;
  gradient: string;
  borderColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { kind: 'pulse', label: 'Pulse', icon: Camera, gradient: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-500/30' },
  { kind: 'drop', label: 'Drop', icon: BookOpen, gradient: 'from-sky-500/20 to-cyan-500/20', borderColor: 'border-sky-500/30' },
  { kind: 'duel', label: 'Duel', icon: Swords, gradient: 'from-purple-500/20 to-fuchsia-500/20', borderColor: 'border-purple-500/30' },
];

export const FeedComposer = memo(function FeedComposer({ profile, onCreateStory }: FeedComposerProps) {
  const { waterIntake, waterGoal, streak } = useAppStore(useShallow(s => ({
    waterIntake: s.waterIntake,
    waterGoal: s.waterGoal,
    streak: s.streak,
  })));

  const [activeComposer, setActiveComposer] = useState<Extract<SignaturePostKind, 'pulse' | 'duel'> | null>(null);

  const name = profile?.nickname || 'Bạn';
  const initial = name[0]?.toUpperCase() || 'U';

  const handlePublishPost = async (postData: {
    content: string;
    imageUrl?: string;
    postKind: 'pulse' | 'duel';
    extra?: Record<string, any>;
  }) => {
    if (!profile?.id) {
      toast.error('Bạn cần đăng nhập để đăng bài.');
      return;
    }

    const toastId = toast.loading('Đang đăng bài...');
    try {
      // Chuyển blob URL sang base64 Data URL để lưu trực tiếp vào DB
      // (Storage bucket RLS không cho upload ảnh feed)
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
      const { data, error } = await supabase.from('social_posts').insert({
        author_id: profile.id,
        content: postData.content,
        image_url: finalImageUrl,
        post_kind: persistedPostKind,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        visibility: 'followers',
        ...postData.extra,
      }).select('id').single();
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được bài viết vừa tạo.');
      toast.success(postData.postKind === 'duel' ? 'Duel đã lên feed.' : 'Pulse đã được đăng.', { id: toastId });
      setActiveComposer(null);
    } catch (err: any) {
      toast.error('Không thể đăng bài lúc này!', { id: toastId });
    }
  };

  return (
    <div className="mx-4 space-y-2.5">
      {/* Quick text trigger */}
      <button
        type="button"
        onClick={() => setActiveComposer('pulse')}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-slate-900/70 active:scale-[0.99]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-800/80">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-300">{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{name}</p>
            <p className="truncate text-xs text-slate-400">Ghi lại Pulse hôm nay...</p>
          </div>
          <div className="shrink-0 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors group-hover:bg-cyan-400/15">
            Đăng
          </div>
        </div>
      </button>

      {/* Quick action strip */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.kind}
            onClick={() => {
              if (action.kind === 'drop') {
                onCreateStory();
              } else {
                setActiveComposer(action.kind);
              }
            }}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border ${action.borderColor} bg-slate-800/40 px-2 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 active:scale-95 transition-all`}
          >
            <action.icon size={14} />
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Composer Modals */}
      <AnimatePresence>
        {activeComposer === 'pulse' && profile && (
          <QuickStatusComposer
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            streak={streak}
            onPublish={handlePublishPost}
            onClose={() => setActiveComposer(null)}
          />
        )}
        {activeComposer === 'duel' && profile && (
          <QuickChallengeComposer
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
