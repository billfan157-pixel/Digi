import { memo } from 'react';
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

const FeedPostListComponent = ({
  posts,
  isLoading,
  socialError,
  currentUserId,
  handleToggleLikePost,
  onOpenComments,
}: FeedPostListProps) => (
  <>
    {socialError && (
      <div className="mx-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-left sm:mx-0">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <p className="text-sm font-bold text-rose-100">Không tải được feed</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/70">{socialError}</p>
          </div>
        </div>
      </div>
    )}

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
          <ErrorBoundary
            key={post.id && String(post.id).trim() !== '' ? post.id : `fallback-post-${index}`}
            FallbackComponent={PostCardErrorFallback}
          >
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

export const FeedPostList = memo(FeedPostListComponent);
