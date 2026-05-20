import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFeed } from '../hooks/useFeed';
import { useNotifications } from '../hooks/useNotifications';
import type { SocialFeedPost } from '../models';
import { EmptyFeedState } from './Feed/EmptyFeedState';
import { FeedComposer } from './Feed/FeedComposer';
import { FeedHeader } from './Feed/FeedHeader';
import { FeedPostList } from './Feed/FeedPostList';
import { getOnlineFriendsCount, useRankedFeed } from './Feed/feedCalculations';
import { HydrationStories } from './Feed/HydrationStories';
import { HydrationStoryViewer } from './Feed/HydrationStoryViewer';
import { InfiniteScrollFooter } from './Feed/InfiniteScrollFooter';
import { NewPostsBanner } from './Feed/NewPostsBanner';
import { NotificationsView } from './Feed/NotificationsView';
import type { FeedFilter, FeedMode, FeedTabProps } from './Feed/types';
import { PullToRefresh } from './Feed/PullToRefresh';
import TabHeader from '../components/layout/TabHeader';
import { Search, TrendingUp } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useQueryClient } from '@tanstack/react-query';
import { appQueryKeys } from '../lib/queryKeys';

export { PostCard } from './Feed/PostCard';

const FeedTab = memo(function FeedTab({
   profile,
   socialStories,
   socialError,
   isSocialLoading,
   socialFollowingIds,
   closeCircleMembers,
   closeCircleIds,
   openQuickDropCamera,
   setShowSocialProfile,
   setShowDiscoverPeople,
   handleToggleLikePost,
 }: FeedTabProps) {
  const { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts, refetch } = useFeed(profile?.id, closeCircleIds);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications(profile?.id);
  const observerTarget = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(10);

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('smart');
  const [feedSearch, setFeedSearch] = useState('');
  const { setActiveCommentPost } = useUIStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const onlineFriendsCount = useMemo(
    () => getOnlineFriendsCount(socialFollowingIds),
    [socialFollowingIds]
  );

  const finalRankedFeed = useRankedFeed(
    posts as SocialFeedPost[],
    feedMode,
    feedFilter,
    feedSearch,
    socialFollowingIds,
    profile
  );

  const visiblePosts = useMemo(() => {
    if (!finalRankedFeed) return [];
    return finalRankedFeed.slice(0, visibleCount);
  }, [finalRankedFeed, visibleCount]);
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

  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Reset query cache when switching feed mode/filter/search
  useEffect(() => {
    const userId = profile?.id;
    if (!userId) return;

    // reset the underlying infinite query cache for feed
    queryClient.removeQueries({
      queryKey: appQueryKeys.feed(userId, closeCircleIds),
      exact: true,
    });
  }, [profile?.id, feedMode, feedFilter, feedSearch, queryClient, closeCircleIds]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return;

        // 1) Ensure we reveal more first, and decide fetch using the latest prev value
        const available = finalRankedFeed.length;

        setVisibleCount(prev => {
          const next = prev < available ? Math.min(prev + 10, available) : prev;

          // 2) Only fetch more when we already fully revealed current available window
          if (next >= available && hasMore && !isFetchingMore) {
            loadMoreRef.current();
          }

          return next;
        });
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [finalRankedFeed.length, visibleCount, hasMore, isFetchingMore]);

  return (
    <div data-feed-scroll-container className="animate-in slide-in-from-right duration-300 relative">
      <TabHeader 
        label="HĐ CỘNG ĐỒNG" 
        title={<span className="flex items-center gap-2">Feed <TrendingUp size={20} className="text-cyan-400" /></span>}
        profile={profile}
        actionIcon={<Search size={18} />}
        onActionClick={() => {
          // Toggle search in header
          const el = document.querySelector('[data-feed-search-trigger]') as HTMLButtonElement;
          if (el) el.click();
        }}
        onAvatarClick={() => setShowSocialProfile(true)}
      />
      
      <FeedHeader
        onlineFriendsCount={onlineFriendsCount}
        feedMode={feedMode}
        feedFilter={feedFilter}
        feedSearch={feedSearch}
        onModeChange={setFeedMode}
        onFilterChange={setFeedFilter}
        onSearchChange={setFeedSearch}
        profile={profile}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowSocialProfile(true)}
        onOpenDiscoverPeople={() => setShowDiscoverPeople(true)}
      />
      
      <PullToRefresh onRefresh={refetch} />

      <div className="max-w-[600px] mx-auto mt-3 space-y-5 pb-12">
        <NewPostsBanner count={newPostsCount} onShowNewPosts={showNewPosts} />
        
        <HydrationStories
          profile={profile}
          socialStories={socialStories}
          storyCount={socialStories.length}
          isSocialLoading={isSocialLoading}
          onCreateStory={openQuickDropCamera}
          onSelectStory={setActiveStoryIndex}
        />

        <FeedComposer profile={profile} onCreateDrop={openQuickDropCamera} />

        {!socialError && !isLoading && finalRankedFeed.length === 0 && (
          <EmptyFeedState
            feedSearch={feedSearch}
            feedFilter={feedFilter}
            friendCount={closeCircleMembers.length}
            onFilterChange={setFeedFilter}
            onModeChange={setFeedMode}
            onOpenDiscoverPeople={() => setShowDiscoverPeople(true)}
          />
        )}

        <FeedPostList
          posts={visiblePosts}
          isLoading={isLoading}
          socialError={socialError}
          currentUserId={profile?.id}
          handleToggleLikePost={handleToggleLikePost}
          onOpenComments={setActiveCommentPost}
        />

        <AnimatePresence>
          {showNotifications && (
            <NotificationsView key="notifications-view-modal" notifications={notifications as unknown as import('@/models').SocialNotification[]} unreadCount={unreadCount} markAllRead={markAllRead} markAsRead={markAsRead} onClose={() => setShowNotifications(false)} />
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
