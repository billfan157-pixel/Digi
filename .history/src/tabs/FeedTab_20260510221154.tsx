import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
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
import { HydrationRitualSheet } from './Feed/HydrationRitualSheet';
import { InfiniteScrollFooter } from './Feed/InfiniteScrollFooter';
import { NewPostsBanner } from './Feed/NewPostsBanner';
import { NotificationsView } from './Feed/NotificationsView';
import type { FeedFilter, FeedMode, FeedTabProps } from './Feed/types';
import { PullToRefresh } from './Feed/PullToRefresh';

export { PostCard } from './Feed/PostCard';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

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
   const { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts, refetch } = useFeed(profile?.id);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications(profile?.id);
  const { waterIntake, waterGoal, streak } = useAppStore(useShallow(s => ({
    waterIntake: s.waterIntake,
    waterGoal: s.waterGoal,
    streak: s.streak,
  })));
  const observerTarget = useRef<HTMLDivElement>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('smart');
  const [feedSearch, setFeedSearch] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<SocialFeedPost | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showRitualSheet, setShowRitualSheet] = useState(false);
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

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

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

      <div className="max-w-[600px] mx-auto mt-4 space-y-5 pb-12">
        <FeedSummaryCards summary={feedSummary} />
        <NewPostsBanner count={newPostsCount} onShowNewPosts={showNewPosts} />
        <FeedComposer profile={profile} onOpenRitualSheet={() => setShowRitualSheet(true)} />
        
        {showRitualSheet && profile && (
          <HydrationRitualSheet
            profile={profile}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            streak={streak}
            onPublish={async (params) => {
              const kindMap: Record<RitualKind, string> = {
                baptism: 'status',
                ignition: 'progress',
                duel: 'challenge',
                wave: 'progress',
              };
              const toastId = toast.loading('Đang lan tỏa nghi thức...');
              try {
                // Upload ảnh lên Storage trước nếu là blob
                let finalImageUrl = params.imageUrl || null;
                if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
                  const resp = await fetch(finalImageUrl);
                  const blob = await resp.blob();
                  const filePath = `feed/${profile.id}/${Date.now()}.jpg`;
                  const { data: upData, error: upErr } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });
                  if (!upErr && upData) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    finalImageUrl = urlData?.publicUrl || finalImageUrl;
                  }
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
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
import { HydrationRitualSheet } from './Feed/HydrationRitualSheet';
import { InfiniteScrollFooter } from './Feed/InfiniteScrollFooter';
import { NewPostsBanner } from './Feed/NewPostsBanner';
import { NotificationsView } from './Feed/NotificationsView';
import type { FeedFilter, FeedMode, FeedTabProps } from './Feed/types';
import { PullToRefresh } from './Feed/PullToRefresh';

export { PostCard } from './Feed/PostCard';

type RitualKind = 'baptism' | 'ignition' | 'duel' | 'wave';

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
   const { posts, isLoading, isFetchingMore, hasMore, loadMore, newPostsCount, showNewPosts, refetch } = useFeed(profile?.id);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications(profile?.id);
  const { waterIntake, waterGoal, streak } = useAppStore(useShallow(s => ({
    waterIntake: s.waterIntake,
    waterGoal: s.waterGoal,
    streak: s.streak,
  })));
  const observerTarget = useRef<HTMLDivElement>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('smart');
  const [feedSearch, setFeedSearch] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<SocialFeedPost | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showRitualSheet, setShowRitualSheet] = useState(false);
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

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

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

      <div className="max-w-[600px] mx-auto mt-4 space-y-5 pb-12">
        <FeedSummaryCards summary={feedSummary} />
        <NewPostsBanner count={newPostsCount} onShowNewPosts={showNewPosts} />
        <FeedComposer profile={profile} onOpenRitualSheet={() => setShowRitualSheet(true)} />
        
        {showRitualSheet && profile && (
          <HydrationRitualSheet
            profile={profile}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            streak={streak}
            onPublish={async (params) => {
              const kindMap: Record<RitualKind, string> = {
                baptism: 'status',
                ignition: 'progress',
                duel: 'challenge',
                wave: 'progress',
              };
              const toastId = toast.loading('Đang lan tỏa nghi thức...');
              try {
                // Upload ảnh lên Storage trước nếu là blob
                let finalImageUrl = params.imageUrl || null;
                if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
                  const resp = await fetch(finalImageUrl);
                  const blob = await resp.blob();
