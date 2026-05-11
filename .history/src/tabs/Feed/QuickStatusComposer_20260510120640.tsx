import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';

interface QuickStatusComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; imageUrl?: string; postKind: 'status' }) => Promise<void>;
  onClose: () => void;
}

export const QuickStatusComposer = ({ profile, onPublish, onClose }: QuickStatusComposerProps) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImagePick = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  }, [imagePreview]);

  const handleSubmit = async () => {
    if (!text.trim() && !imagePreview) {
      toast.error('Nhập nội dung hoặc thêm ảnh!');
      return;
    }
    setIsPublishing(true);
    try {
