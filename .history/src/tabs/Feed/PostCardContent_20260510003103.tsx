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
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 border-4 border-slate-900 z-10">
          <Trophy size={36} className="text-white" />
        </div>
        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1 z-10 flex items-center gap-1"><Sparkles size={12} /> Kỷ Lục Mới</p>
        <h4 className="text-white text-2xl font-black mb-2 z-10">{post.content}</h4>
        {post.value && <p className="text-slate-300 text-sm z-10">Hoàn thành xuất sắc mục tiêu đề ra.</p>}
      </div>
    );
  }

  if (isCompare) {
    return (
      <div className="border border-white/10 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
        <div className="flex items-center justify-center mb-5 relative z-10">
