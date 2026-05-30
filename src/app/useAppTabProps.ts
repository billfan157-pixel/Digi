import { useMemo } from 'react';
import type HomeTab from '@/tabs/HomeTab';
import type InsightTab from '@/tabs/InsightTab';
import type FeedTab from '@/tabs/FeedTab';
import type ProfileTab from '@/tabs/ProfileTab';
import type LeagueTab from '@/tabs/LeagueTab';
import type { RankInfo } from '@/tabs/League/types';
import type { Profile, SocialFeedPost } from '@/models';
import type { CalendarEventItem } from '@/hooks/useCalendarSync';

interface SocialProfileStats {
  followers: number;
  following: number;
  posts: number;
}

interface UseAppTabPropsOptions {
  profile: Profile | null;
  smartBottle: Record<string, unknown> | null;
  isExportingPDF: boolean;
  handleExportPDF: (dateRange?: { start: string; end: string } | null) => Promise<void>;
  handleExportCSV: (dateRange?: { start: string; end: string } | null) => void;
  handleExportJSON: (dateRange?: { start: string; end: string } | null) => void;
  geminiProps: Record<string, unknown>;
  weatherData: Record<string, unknown> | null | undefined;
  isWeatherSynced: boolean;
  watchData: Record<string, unknown> | null | undefined;
  isWatchConnected: boolean;
  leagueMode: 'public' | 'friends' | 'clubs';
  setLeagueMode: (mode: 'public' | 'friends' | 'clubs') => void;
  setShowAddFriend: (value: boolean) => void;
  setShowShopModal: (value: boolean) => void;
  getLeagueData: () => Record<string, unknown>[];
  getRankInfo: (wp: number) => RankInfo;
  socialProps: Record<string, unknown>;
  openSocialComposer: (...args: unknown[]) => void;
  streakFreezes: number;
  needsFreeze: boolean;
  useStreakFreeze: () => Promise<boolean>;
  posts: SocialFeedPost[];
  setActiveTab: (tab: 'home' | 'insight' | 'league' | 'feed' | 'profile') => void;
  calendarEvents: CalendarEventItem[];
  syncCalendar: (options?: { silent?: boolean; startOAuthIfNeeded?: boolean }) => Promise<number | false>;
}

export function useAppTabProps({
  profile,
  smartBottle,
  isExportingPDF,
  handleExportPDF,
  handleExportCSV,
  handleExportJSON,
  geminiProps,
  weatherData,
  isWeatherSynced,
  watchData,
  isWatchConnected,
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  setShowShopModal,
  getLeagueData,
  socialProps,
  openSocialComposer,
  streakFreezes,
  needsFreeze,
  useStreakFreeze,
  posts,
  setActiveTab,
  calendarEvents,
  syncCalendar,
}: UseAppTabPropsOptions) {
  const homeTabProps = useMemo(() => ({
    smartBottle,
    calendarEvents,
  }) as unknown as React.ComponentProps<typeof HomeTab>, [
    smartBottle,
    calendarEvents,
  ]);

  const insightTabProps = useMemo(() => ({
    isExportingPDF,
    handleExportPDF,
    handleExportCSV,
    handleExportJSON,
    isAiLoading: Boolean((geminiProps as Record<string, unknown>).isAiLoading),
    aiAdvice: String((geminiProps as Record<string, unknown>).aiAdvice || ''),
    aiAdviceObj: (geminiProps as Record<string, unknown>).aiAdviceObj as any,
    fetchAIAdvice: ((geminiProps as Record<string, unknown>).fetchAIAdvice as (() => void) | undefined) || (() => {}),
    calendarEvents,
    syncCalendar,
    weatherData,
  }) as React.ComponentProps<typeof InsightTab>, [
    geminiProps,
    handleExportPDF,
    handleExportCSV,
    handleExportJSON,
    isExportingPDF,
    calendarEvents,
    syncCalendar,
    weatherData,
  ]);

  const bottleTabProps = useMemo(() => ({
    profile,
    weatherData,
    isWeatherSynced,
    watchData,
    isWatchConnected,
    smartBottle,
    onBack: () => setActiveTab('home'),
  }), [
    profile,
    weatherData,
    isWeatherSynced,
    watchData,
    isWatchConnected,
    smartBottle,
    setActiveTab,
  ]);

  const leagueTabProps = useMemo(() => ({
    leagueMode,
    setLeagueMode,
    setShowAddFriend,
    getLeagueData,
    profile,
  }) as unknown as React.ComponentProps<typeof LeagueTab>, [
    getLeagueData,
    leagueMode,
    profile,
    setLeagueMode,
    setShowAddFriend,
  ]);

  const feedTabProps = useMemo(() => ({
    profile,
    socialStories: (socialProps.socialStories as unknown[]) || [],
    socialError: String(socialProps.socialError || ''),
    isSocialLoading: Boolean(socialProps.isSocialLoading),
    socialFollowingIds: (socialProps.socialFollowingIds as string[]) || [],
    closeCircleMembers: (socialProps.closeCircleMembers as unknown[]) || [],
    closeCircleIds: (socialProps.closeCircleIds as string[]) || [],
    isCloseCircleLoading: Boolean(socialProps.isCloseCircleLoading),
    openSocialComposer,
    openQuickDropCamera: (socialProps.openQuickDropCamera as (() => void) | undefined) || (() => {}),
    setShowSocialProfile: (socialProps.setShowSocialProfile as ((show: boolean) => void) | undefined) || (() => {}),
    setShowDiscoverPeople: (socialProps.setShowDiscoverPeople as ((show: boolean) => void) | undefined) || (() => {}),
    handleToggleLikePost: (socialProps.handleToggleLikePost as ((post: SocialFeedPost) => void) | undefined) || (() => {}),
  }) as React.ComponentProps<typeof FeedTab>, [
    openSocialComposer,
    profile,
    socialProps.handleToggleLikePost,
    socialProps.closeCircleIds,
    socialProps.closeCircleMembers,
    socialProps.isCloseCircleLoading,
    socialProps.isSocialLoading,
    socialProps.openQuickDropCamera,
    socialProps.setShowDiscoverPeople,
    socialProps.setShowSocialProfile,
    socialProps.socialError,
    socialProps.socialFollowingIds,
    socialProps.socialStories,
  ]);

  const profileTabProps = useMemo(() => ({
    streakFreezes,
    needsFreeze,
    onUseStreakFreeze: useStreakFreeze,
    socialProfileStats: (socialProps.socialProfileStats as SocialProfileStats) || { followers: 0, following: 0, posts: 0 },
    posts,
    handleToggleLikePost: (socialProps.handleToggleLikePost as ((post: SocialFeedPost) => void) | undefined) || (() => {}),
    setShowShopModal,
  }) as React.ComponentProps<typeof ProfileTab>, [
    needsFreeze,
    posts,
    setShowShopModal,
    socialProps.handleToggleLikePost,
    socialProps.socialProfileStats,
    streakFreezes,
    useStreakFreeze,
  ]);

  return {
    homeTabProps,
    insightTabProps,
    bottleTabProps,
    leagueTabProps,
    feedTabProps,
    profileTabProps,
  };
}
