import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, PostPollOption } from '../../models';

interface QuickPollComposerProps {
  profile: Profile;
  onPublish: (data: { content: string; postKind: 'poll'; extra: Record<string, any> }) => Promise<void>;
  onClose: () => void;
}

const DURATIONS = [
  { value: '1h', label: '1 giờ' },
  { value: '6h', label: '6 giờ' },
  { value: '24h', label: '24 giờ' },
];

export const QuickPollComposer = ({ profile, onPublish, onClose }: QuickPollComposerProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('24h');
  const [isPublishing, setIsPublishing] = useState(false);

  const addOption = () => {
