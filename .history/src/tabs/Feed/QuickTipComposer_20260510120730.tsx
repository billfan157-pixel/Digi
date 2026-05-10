import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Beaker, Coffee, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../../models';
import type { TipCategory } from './types';

interface QuickTipComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; postKind: 'tip'; extra: Record<string, any> }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: { key: TipCategory; label: string; icon: typeof Beaker; color: string }[] = [
  { key: 'science', label: 'Khoa học', icon: Beaker, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
