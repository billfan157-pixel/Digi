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

function PostCardErrorFallback({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Bài viết không hợp lệ';
  return (
    <div className="bg-slate-900/50 rounded-3xl p-5 border border-red-500/20 flex items-center gap-3">
      <AlertTriangle size={20} className="text-red-400 shrink-0" />
      <div className="text-sm text-slate-400">
        <p className="font-bold text-red-300">Lỗi hiển thị bài viết</p>
        <p className="text-xs text-slate-500 truncate max-w-[300px]">{message}</p>
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
      <div className="space-y-4 px-4 sm:px-0">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )}

    {!socialError && posts.length > 0 && (
      <div className="space-y-4">
        {posts.map((post, index) => (
          <ErrorBoundary key={post.id && String(post.id).trim() !== '' ? post.id : `fallback-post-${index}`} FallbackComponent={PostCardErrorFallback}>
            <PostCard
              post={post}
              currentUserId={currentUserId}
              handleToggleLikePost={handleToggleLikePost}
              onOpenComments={onOpenComments}
            />
          </ErrorBoundary>
        ))}
      </div>
    )}
  </>
);
