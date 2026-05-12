import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFeed } from '../hooks/useFeed';
import { useNotifications } from '../hooks/useNotifications';
import type { SocialFeedPost } from '../models';
import { CommentsView } from './Feed/CommentsView';
import { CloseCircleRail } from './Feed/CloseCircleRail';
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

export { PostCard } from './Feed/PostCard';

const FeedTab = memo(function FeedTab({
   profile,
   socialStories,
   socialError,
   isSocialLoading,
   socialFollowingIds,
   closeCircleMembers,
   closeCircleIds,
   isCloseCircleLoading,
   openSocialComposer,
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
  const [activeCommentPost, setActiveCommentPost] = useState<SocialFeedPost | null>(null);
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
    <div data-feed-scroll-container className="animate-in slide-in-from-right duration-300 pb-8 relative bg-slate-950 h-full overflow-y-auto scrollbar-hide">
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
      
      <PullToRefresh onRefresh={refetch} />

      <div className="max-w-[600px] mx-auto mt-3 space-y-5 pb-12">
        <NewPostsBanner count={newPostsCount} onShowNewPosts={showNewPosts} />
        <CloseCircleRail
          profile={profile}
          members={closeCircleMembers}
          stories={socialStories}
          isLoading={isCloseCircleLoading}
          onAddPeople={() => setShowDiscoverPeople(true)}
          onSelectStory={setActiveStoryIndex}
        />
        <FeedComposer profile={profile} onCreateStory={() => openSocialComposer('story')} />
        <HydrationStories
          profile={profile}
          socialStories={socialStories}
          storyCount={socialStories.length}
          isSocialLoading={isSocialLoading}
          onCreateStory={() => openSocialComposer('story')}
          onSelectStory={setActiveStoryIndex}
        />

        <div className="mx-4 flex items-center justify-between gap-3 sm:mx-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dòng hoạt động</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              {finalRankedFeed.length} bài - {feedModeLabel} - {feedFilterLabel}
            </p>
          </div>
          {feedSearch.trim() && (
            <span className="max-w-[180px] truncate rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300">
              "{feedSearch.trim()}"
            </span>
          )}
        </div>

        {!socialError && !isLoading && finalRankedFeed.length === 0 && (
          <EmptyFeedState
            feedSearch={feedSearch}
            feedFilter={feedFilter}
            closeCircleCount={closeCircleMembers.length}
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
