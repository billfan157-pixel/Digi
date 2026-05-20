import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../store/useUIStore';
import {
  buildProgressShareText,
  DEFAULT_SOCIAL_COMPOSER,
  type SocialComposerState,
} from '../lib/social';
import type { AppProfile } from '@/services/profile.service';

interface UseSocialComposerOptions {
  profile: AppProfile | null;
  setActiveTab?: (tab: string) => void;
  waterIntake?: number;
  waterGoal?: number;
  streak?: number;
  onPostPublished?: () => void;
}

interface UseSocialComposerReturn {
  socialComposer: SocialComposerState;
  setSocialComposer: React.Dispatch<React.SetStateAction<SocialComposerState>>;
  socialImageFile: File | null;
  setSocialImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  socialImagePreview: string;
  setSocialImagePreview: React.Dispatch<React.SetStateAction<string>>;
  socialImageInputRef: React.RefObject<HTMLInputElement | null>;
  isPublishingSocialPost: boolean;
  showQuickDropCamera: boolean;
  setShowQuickDropCamera: React.Dispatch<React.SetStateAction<boolean>>;
  isPublishingQuickDrop: boolean;
  openSocialComposer: (kind?: SocialComposerState['postKind']) => void;
  closeSocialComposer: () => void;
  resetSocialComposer: () => void;
  openQuickDropCamera: () => void;
  closeQuickDropCamera: () => void;
  handleSocialImagePicked: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuickDropCapture: (blob: Blob) => Promise<void>;
  handlePublishSocialPost: (e: React.FormEvent) => Promise<void>;
}

export function useSocialComposer({
  profile,
  setActiveTab,
  waterIntake,
  waterGoal,
  streak,
  onPostPublished,
}: UseSocialComposerOptions): UseSocialComposerReturn {
  const [socialComposer, setSocialComposer] = useState<SocialComposerState>({ ...DEFAULT_SOCIAL_COMPOSER });
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [socialImagePreview, setSocialImagePreview] = useState('');
  const socialImageInputRef = useRef<HTMLInputElement>(null);
  const [isPublishingSocialPost, setIsPublishingSocialPost] = useState(false);
  const [showQuickDropCamera, setShowQuickDropCamera] = useState(false);
  const [isPublishingQuickDrop, setIsPublishingQuickDrop] = useState(false);

  const resetSocialComposer = useCallback(() => {
    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }
    setSocialComposer({ ...DEFAULT_SOCIAL_COMPOSER });
    setSocialImageFile(null);
    setSocialImagePreview('');
  }, [socialImagePreview]);

  const uploadSocialImage = async (file: File) => {
    if (!profile?.id) throw new Error('Vui lòng đăng nhập lại.');

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg';
    const safeExtension = extension || 'jpg';
    const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
    const { error } = await supabase!.storage.from('social-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return supabase!.storage.from('social-media').getPublicUrl(filePath).data.publicUrl;
  };

  const openSocialComposer = useCallback((kind: SocialComposerState['postKind'] = 'status') => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng bài.');
      return;
    }

    if (kind === 'story') {
      setActiveTab?.('feed');
      setShowQuickDropCamera(true);
      return;
    }

    const content = kind === 'progress'
      ? buildProgressShareText({
        nickname: profile?.nickname as string | undefined,
        waterIntake: waterIntake ?? 0,
        waterGoal: waterGoal ?? 2000,
        streak: streak ?? 0,
      })
      : '';

    resetSocialComposer();
    setSocialComposer({
      content,
      imageUrl: '',
      postKind: kind === 'progress' ? 'status' : kind,
      visibility: 'followers',
    });
    setActiveTab?.('feed');
    useUIStore.getState().setShowSocialComposer(true);
  }, [profile?.id, setActiveTab, waterIntake, waterGoal, streak, resetSocialComposer]);

  const closeSocialComposer = () => {
    resetSocialComposer();
    setShowQuickDropCamera(false);
    useUIStore.getState().setShowSocialComposer(false);
  };

  const openQuickDropCamera = () => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng Drop.');
      return;
    }
    setActiveTab?.('feed');
    setShowQuickDropCamera(true);
  };

  const closeQuickDropCamera = () => {
    setShowQuickDropCamera(false);
  };

  const handleSocialImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB để upload nhanh hơn.');
      event.target.value = '';
      return;
    }

    if (socialImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(socialImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSocialImageFile(file);
    setSocialImagePreview(previewUrl);
    setSocialComposer((prev: SocialComposerState) => ({ ...prev, imageUrl: '' }));
    event.target.value = '';
  };

  const handleQuickDropCapture = async (blob: Blob) => {
    if (!profile?.id) {
      toast.error('Vui lòng đăng nhập lại để đăng Drop.');
      return;
    }

    const file = new File([blob], `drop-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    setIsPublishingQuickDrop(true);
    const toastId = toast.loading('Đang đăng Drop...');
    try {
      const imageUrl = await uploadSocialImage(file);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: '',
        image_url: imageUrl,
        post_kind: 'story',
        visibility: 'followers',
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      }).select('id').single();
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được Drop vừa tạo.');

      toast.success('Drop đã lên sóng.', { id: toastId });
      setShowQuickDropCamera(false);
      onPostPublished?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message, { id: toastId });
    } finally {
      setIsPublishingQuickDrop(false);
    }
  };

  const handlePublishSocialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const trimmedContent = socialComposer.content.trim();
    const trimmedImageUrl = socialComposer.imageUrl.trim();

    if (socialComposer.postKind === 'story' && !trimmedImageUrl && !socialImageFile) {
      toast.error('Drop cần ảnh chụp nhanh trước khi đăng.');
      return;
    }

    if (socialComposer.postKind !== 'story' && !trimmedContent && !trimmedImageUrl && !socialImageFile) {
      toast.error('Viết gì đó hoặc thêm ảnh trước khi đăng.');
      return;
    }

    setIsPublishingSocialPost(true);
    const toastId = toast.loading(socialComposer.postKind === 'story' ? 'Đang đăng story...' : 'Đang đăng bài...');

    try {
      let imageUrl = trimmedImageUrl || null;
      if (socialImageFile) {
        imageUrl = await uploadSocialImage(socialImageFile);
      }

      const expiresAt = socialComposer.postKind === 'story'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const persistedPostKind = socialComposer.postKind === 'progress' ? 'status' : socialComposer.postKind;
      const { data, error } = await supabase!.from('social_posts').insert({
        author_id: profile.id,
        content: socialComposer.postKind === 'story' ? '' : trimmedContent,
        image_url: imageUrl,
        post_kind: persistedPostKind,
        visibility: socialComposer.visibility,
        hydration_ml: waterIntake,
        streak_snapshot: streak,
        expires_at: expiresAt,
      }).select('id').single();
      if (error) throw error;
      if (!data?.id) throw new Error('Không nhận được bài viết vừa tạo.');

      const successMessage = socialComposer.postKind === 'story'
        ? 'Drop đã lên sóng.'
        : socialComposer.postKind === 'challenge'
          ? 'Duel đã lên feed.'
          : 'Pulse đã xuất hiện trên feed.';
      toast.success(successMessage, { id: toastId });
      closeSocialComposer();
      onPostPublished?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message, { id: toastId });
    } finally {
      setIsPublishingSocialPost(false);
    }
  };

  return {
    socialComposer,
    setSocialComposer,
    socialImageFile,
    setSocialImageFile,
    socialImagePreview,
    setSocialImagePreview,
    socialImageInputRef,
    isPublishingSocialPost,
    showQuickDropCamera,
    setShowQuickDropCamera,
    isPublishingQuickDrop,
    openSocialComposer,
    closeSocialComposer,
    resetSocialComposer,
    openQuickDropCamera,
    closeQuickDropCamera,
    handleSocialImagePicked,
    handleQuickDropCapture,
    handlePublishSocialPost,
  };
}
