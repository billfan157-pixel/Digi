import { Share2, MoreHorizontal } from 'lucide-react';
import { getRelativeTimeLabel } from '../../lib/social';
import type { SocialFeedPost } from '../../models';

interface PostCardHeaderProps {
  post: SocialFeedPost;
  isChallenge: boolean;
  isAchievement: boolean;
  isCompare: boolean;
  onShare: () => void;
  onOpenMenu: () => void;
}

export const PostCardHeader = ({
  post,
  isChallenge,
  isAchievement,
  isCompare,
  onShare,
  onOpenMenu,
}: PostCardHeaderProps) => (
  <div className="flex items-center justify-between mb-4 relative z-20">
    <div className="flex items-center gap-3">
      <div
