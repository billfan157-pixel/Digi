import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';
import { PostCard } from './PostCard';
import { SkeletonCard } from './SkeletonCard';
import type { SocialFeedPost } from '../../models';

interface FeedPostListProps {
  posts: SocialFeedPost[];
  isLoading: boolean;
  socialError: string;
  currentUserId: string | undefined;
  handleToggleLikePost: (post: SocialFeedPost) => void;
  onOpenComments: (post: SocialFeedPost) => void;
}

function PostCardErrorFallback({ error }: { error: Error }) {
  return (
    <div className="bg-slate-900/50 rounded-3xl p-5 border border-red-500/20 flex items-center gap-3">
      <AlertTriangle size={20} className="text-red-400 shrink-0" />
      <div className="text-sm text-slate-400">
        <p className="font-bold text-red-300">Lỗi hiển thị bài viết</p>
        <p className="text-xs text-slate-500 truncate max-w-[300px]">{error.message}</p>
      </div>
    </div>
  );
}

export const FeedPostList = ({
  posts,
  isLoading,
  socialError,
  currentUserId,
  handleToggleLikePost,
  onOpenComments,
}: FeedPostListProps) => (
  <>
    {isLoading && posts.length === 0 && (
      <div className="space-y-4 px
            onOpenComments={onOpenComments}
          />
        ))}
      </div>
    )}
  </>
);
