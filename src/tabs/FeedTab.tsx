import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFeed } from '../hooks/useFeed';
import { useNotifications } from '../hooks/useNotifications';
import type { SocialFeedPost } from '../models';
import { CommentsView } from './Feed/CommentsView';
import { EmptyFeedState } from './Feed/EmptyFeedState';
import { FeedComposer } from './Feed/FeedComposer';
import { FeedHeader } from './Feed/FeedHeader';
import { FeedPostList } from './Feed/FeedPostList';
import { FeedSummaryCards } from './Feed/FeedSummaryCards';
import { getOnlineFriendsCount, useFeedSummary, useRankedFeed } from './Feed/feedCalculations';
import { HydrationStories } from './Feed/HydrationStories';
import { HydrationStoryViewer } from './Feed/HydrationStoryViewer';
import { InfiniteScrollFooter } from './Feed/InfiniteScrollFooter';
import { NewPostsBanner } from './Feed/NewPostsBanner';
import { NotificationsView } from './Feed/NotificationsView';
import type { FeedFilter, FeedMode, FeedTabProps } from './Feed/types';

export { PostCard } from './Feed/PostCard';

const FeedTab = memo(function FeedTab({
  profile,
  socialStories,
  socialError,
  isSocialLoading,
  socialFollowingIds,
  openSocialComposer,
  setShowSocialProfile,
  setShowDiscoverPeople,
  handleToggleLikePost,
}: FeedTabProps) {
  const { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts } = useFeed(profile?.id);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications(profile?.id);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('smart');
  const [feedSearch, setFeedSearch] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<SocialFeedPost | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  const onlineFriendsCount = useMemo(
    () => getOnlineFriendsCount(socialFollowingIds),
    [socialFollowingIds]
  );

  const feedSummary = useFeedSummary(posts as SocialFeedPost[], socialStories, currentTimestamp);
  const finalRankedFeed = useRankedFeed(
    posts as SocialFeedPost[],
    feedMode,
    feedFilter,
    feedSearch,
    socialFollowingIds,
    profile
  );

  const handleNextStory = () => {
    setActiveStoryIndex(prev => {
      if (prev === null) return null;
      if (prev < socialStories.length - 1) return prev + 1;
      return null;
    });
  };

  const handlePrevStory = () => {
    setActiveStoryIndex(prev => {
      if (prev === null) return null;
      if (prev > 0) return prev - 1;
      return prev;
    });
  };

  useEffect(() => {
    setCurrentTimestamp(Date.now());
    const timer = window.setInterval(() => setCurrentTimestamp(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) loadMore();
    }, { threshold: 0.1 });

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isFetchingMore, loadMore, finalRankedFeed.length]);

  return (
    <div className="animate-in slide-in-from-right duration-300 pb-8 relative bg-slate-950 h-full overflow-y-auto scrollbar-hide">
      <FeedHeader
        profile={profile}
        onlineFriendsCount={onlineFriendsCount}
        unreadCount={unreadCount}
        feedMode={feedMode}
        feedFilter={feedFilter}
        feedSearch={feedSearch}
        onModeChange={setFeedMode}
        onFilterChange={setFeedFilter}
        onSearchChange={setFeedSearch}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowSocialProfile(true)}
        onOpenDiscoverPeople={() => setShowDiscoverPeople(true)}
      />

      <div className="max-w-[600px] mx-auto mt-4 space-y-5 pb-12">
        <FeedSummaryCards summary={feedSummary} />
        <NewPostsBanner count={newPostsCount} onShowNewPosts={showNewPosts} />
        <FeedComposer profile={profile} openSocialComposer={openSocialComposer} />
        <HydrationStories
          profile={profile}
          socialStories={socialStories}
          storyCount={feedSummary.storyCount}
          isSocialLoading={isSocialLoading}
          onCreateStory={() => openSocialComposer('story')}
          onSelectStory={setActiveStoryIndex}
        />

        {!socialError && !isLoading && finalRankedFeed.length === 0 && (
          <EmptyFeedState
            feedSearch={feedSearch}
            onFilterChange={setFeedFilter}
            onModeChange={setFeedMode}
            onOpenDiscoverPeople={() => setShowDiscoverPeople(true)}
          />
        )}

        <FeedPostList
          posts={finalRankedFeed}
          isLoading={isLoading}
          socialError={socialError}
          currentUserId={profile?.id}
          handleToggleLikePost={handleToggleLikePost}
          onOpenComments={setActiveCommentPost}
        />

        <AnimatePresence>
          {activeCommentPost && (
            <CommentsView key="comments-view-modal" post={activeCommentPost} currentUserId={profile?.id} onClose={() => setActiveCommentPost(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotifications && (
            <NotificationsView key="notifications-view-modal" notifications={notifications} unreadCount={unreadCount} markAllRead={markAllRead} markAsRead={markAsRead} onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeStoryIndex !== null && socialStories[activeStoryIndex] && (
            <HydrationStoryViewer
              key={`story-viewer-${activeStoryIndex}`}
              story={socialStories[activeStoryIndex]}
              onClose={() => setActiveStoryIndex(null)}
              onNext={handleNextStory}
              onPrev={handlePrevStory}
            />
          )}
        </AnimatePresence>

        <InfiniteScrollFooter
          ref={observerTarget}
          hasPosts={finalRankedFeed.length > 0}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
});

export default FeedTab;
