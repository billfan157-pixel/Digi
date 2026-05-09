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

function PostCardError
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
          <PostCard
            key={post.id && String(post.id).trim() !== '' ? post.id : `fallback-post-${index}`}
            post={post}
            currentUserId={currentUserId}
            handleToggleLikePost={handleToggleLikePost}
            onOpenComments={onOpenComments}
          />
        ))}
      </div>
    )}
  </>
);
