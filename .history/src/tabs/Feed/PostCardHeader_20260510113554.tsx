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
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner bg-slate-800 border-2 border-slate-700/50"
        style={{
          background: isChallenge
            ? 'linear-gradient(135deg, #a855f7, #6366f1)'
            : 'linear-gradient(135deg, rgba(16,185,212,0.35), rgba(6,182,212,0.25))',
        }}
      >
        {post.author?.avatar_url ? (
          <img src={post.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-lg font-black text-white">
            {(post.author?.nickname || 'U').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-[15px]">
            {post.author?.nickname ?? 'Người dùng'}
          </span>
          {post.post_kind === 'progress' && (
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
              Tiến độ
            </span>
          )}
          {isChallenge && (
