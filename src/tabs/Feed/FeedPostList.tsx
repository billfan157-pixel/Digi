import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';
import { useVirtualFeedWindow } from '../../hooks/useVirtualFeedWindow';
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

import { useTranslation } from 'react-i18next';

function PostCardErrorFallback({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : t('feed.invalid_post');
  return (
    <div className="bg-slate-900/50 rounded-3xl p-5 border border-red-500/20 flex items-center gap-3">
      <AlertTriangle size={20} className="text-red-400 shrink-0" />
      <div className="text-sm text-slate-400">
        <p className="font-bold text-red-300">{t('feed.error_displaying_post')}</p>
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
}: FeedPostListProps) => {
  const { t } = useTranslation();
  const { containerRef, measureElement, totalSize, virtualItems } = useVirtualFeedWindow({
    itemCount: posts.length,
  });

  return (
    <>
      {socialError && (
      <div className="mx-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-left sm:mx-0">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <p className="text-sm font-bold text-rose-100">{t('feed.failed_load_feed')}</p>
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
        <div ref={containerRef} className="relative" style={{ height: totalSize }}>
          {virtualItems.map(({ index, start }) => {
            const post = posts[index];
            if (!post) return null;

            return (
              <div
                key={post.id && String(post.id).trim() !== '' ? post.id : `fallback-post-${index}`}
                ref={(element) => measureElement(index, element)}
                className="absolute left-0 right-0 pb-4"
                style={{ transform: `translateY(${start}px)` }}
              >
                <ErrorBoundary FallbackComponent={PostCardErrorFallback}>
                  <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    handleToggleLikePost={handleToggleLikePost}
                    onOpenComments={onOpenComments}
                  />
                </ErrorBoundary>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export const FeedPostList = memo(FeedPostListComponent);
