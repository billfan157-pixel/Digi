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

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('smart');
  const [feedSearch, setFeedSearch] = useState('');
  const { activeCommentPost, setActiveCommentPost } = useUIStore();
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
  const feedModeLabel = feedMode === 'smart' ? 'Thông minh' : feedMode === 'latest' ? 'Mới nhất' : 'Đang follow';
  const feedFilterLabel = {
    all: 'Tất cả',
    checkins: 'Pulse',
    drops: 'Drop',
    milestones: 'Peak',
    challenges: 'Duel',
    photos: 'Proof',
  }[feedFilter];

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

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) loadMoreRef.current();
    }, { threshold: 0.1 });

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isFetchingMore]);

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
          posts={finalRankedFeed}
          isLoading={isLoading}
          socialError={socialError}
          currentUserId={profile?.id}
          handleToggleLikePost={handleToggleLikePost}
          onOpenComments={setActiveCommentPost}
        />

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
