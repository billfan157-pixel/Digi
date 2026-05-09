import { Droplets, Flame, Swords, Trophy, Sparkles, Zap } from 'lucide-react';
import type { SocialFeedPost } from '../../models';

interface PostCardContentProps {
  post: SocialFeedPost;
  postContent: string;
  isAchievement: boolean;
  isCompare: boolean;
  isChallenge: boolean;
  isMilestone: boolean;
  isWaterLog: boolean;
  handleJoinChallenge: () => void;
}

export const PostCardContent = ({
  post,
  postContent,
  isAchievement,
  isCompare,
  isChallenge,
  isMilestone,
  isWaterLog,
  handleJoinChallenge,
}: PostCardContentProps) => {
  if (isAchievement) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-amber-500/30 bg-amber-500/5 rounded-2xl text-center relative overflow-hidden">
