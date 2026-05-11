import { useState, memo } from 'react';
import { Camera, Lightbulb, BarChart3, MessageCircle, Image } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Profile } from '../../models';
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
      const { error } = await supabase.from('social_posts').insert({
        author_id: profile!.id,
        content: postData.content,
        image_url: postData.imageUrl || null,
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
