import { useState, memo } from 'react';
import { Camera, Lightbulb, BarChart3, MessageCircle, Image } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Profile, SocialFeedPost } from '../../models';
import type { SocialComposerKind } from './types';
import { QuickStatusComposer } from './QuickStatusComposer';
import { QuickTipComposer } from './QuickTipComposer';
import { QuickPollComposer } from './QuickPollComposer';

interface FeedComposerProps {
  profile: Profile | null;
  onOpenRitualSheet: () => void;
}

interface QuickAction {
  kind: SocialComposerKind;
  label: string;
  icon: typeof Camera;
  gradient: string;
  borderColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { kind: 'status', label: 'Status', icon: MessageCircle, gradient: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-500/30' },
  { kind: 'photo', label: 'Khoảnh khắc', icon: Image, gradient: 'from-violet-500/20 to-purple-500/20', borderColor: 'border-violet-500/30' },
  { kind: 'progress', label: 'Cột mốc', icon: BarChart3, gradient: 'from-orange-500/20 to-amber-500/20', borderColor: 'border-orange-500/30' },
  { kind: 'tip', label: 'Mẹo', icon: Lightbulb, gradient: 'from-emerald-500/20 to-teal-500/20', borderColor: 'border-emerald-500/30' },
  { kind: 'poll', label: 'Khảo sát', icon: BarChart3, gradient: 'from-amber-500/20 to-yellow-500/20', borderColor: 'border-amber-500/30' },
];

export const FeedComposer = memo(function FeedComposer({ profile, onOpenRitualSheet }: FeedComposerProps) {
  const { waterIntake, waterGoal, streak } = useAppStore(useShallow(s => ({
    waterIntake: s.waterIntake,
    waterGoal: s.waterGoal,
    streak: s.streak,
  })));

  const [activeComposer, setActiveComposer] = useState<SocialComposerKind | null>(null);

  const name = profile?.nickname || 'Bạn';
  const initial = name[0]?.toUpperCase() || 'U';

  const handlePublishPost = async (postData: {
    content: string;
    imageUrl?: string;
    postKind: SocialFeedPost['post_kind'];
    extra?: Record<string, any>;
  }) => {
    const toastId = toast.loading('Đang đăng bài...');
    try {
      // Upload ảnh local lên Supabase Storage trước khi lưu post
      let finalImageUrl: string | null = null;
      if (postData.imageUrl && postData.imageUrl.startsWith('blob:')) {
        const response = await fetch(postData.imageUrl);
        const blob = await response.blob();
        const filePath = `feed/${profile!.id}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) {
          console.error('Upload ảnh thất bại:', uploadError);
          toast.error('Không thể tải ảnh lên. Bài viết sẽ được đăng không có ảnh.');
        } else {
          const { data: urlData } = supabase.storage.from('post_images').getPublicUrl(filePath);
          finalImageUrl = urlData?.publicUrl || null;
        }
      } else {
        finalImageUrl = postData.imageUrl || null;
      }

      const { error } = await supabase.from('social_posts').insert({
        author_id: profile!.id,
        content: postData.content,
        image_url: finalImageUrl,
        post_kind: postData.postKind,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        visibility: 'public',
        ...postData.extra,
      });
      if (error) throw error;
      toast.success('Bài viết đã được đăng!', { id: toastId });
      setActiveComposer(null);
    } catch (err: any) {
      toast.error('Không thể đăng bài lúc này!', { id: toastId });
    }
  };

  return (
    <div className="mx-4 space-y-3">
      {/* Quick text trigger */}
      <button
        type="button"
        onClick={() => setActiveComposer('status')}
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
            <p className="truncate text-xs text-slate-400">Chia sẻ hydration moment...</p>
          </div>
          <div className="shrink-0 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors group-hover:bg-cyan-400/15">
            Post
          </div>
        </div>
      </button>

      {/* Quick action strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-0.5">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.kind}
            onClick={() => {
              if (action.kind === 'progress') {
                onOpenRitualSheet();
              } else {
                setActiveComposer(action.kind);
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border ${action.borderColor} bg-slate-800/40 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 active:scale-95 transition-all`}
          >
            <action.icon size={14} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Composer Modals */}
      <AnimatePresence>
        {activeComposer === 'status' && profile && (
          <QuickStatusComposer
            profile={profile}
            onPublish={handlePublishPost}
            onClose={() => setActiveComposer(null)}
          />
        )}
        {activeComposer === 'tip' && profile && (
          <QuickTipComposer
            profile={profile}
            onPublish={handlePublishPost}
            onClose={() => setActiveComposer(null)}
          />
        )}
        {activeComposer === 'poll' && profile && (
          <QuickPollComposer
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
