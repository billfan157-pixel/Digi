import { useMemo } from 'react';
import type HomeTab from '@/tabs/HomeTab';
import type InsightTab from '@/tabs/InsightTab';
import type FeedTab from '@/tabs/FeedTab';
import type ProfileTab from '@/tabs/ProfileTab';
import type LeagueTab from '@/tabs/LeagueTab';

interface UseAppTabPropsOptions {
  profile: any;
  smartBottle: any;
  isExportingPDF: boolean;
  handleExportPDF: () => Promise<void>;
  handleExportCSV: () => void;
  geminiProps: Record<string, any>;
  weeklyReport: any;
  isWeeklyReportLoading: boolean;
  handleGenerateWeeklyReport: () => Promise<void>;
  weatherData: any;
  isWeatherSynced: boolean;
  watchData: any;
  isWatchConnected: boolean;
  leagueMode: 'public' | 'friends' | 'clubs';
  setLeagueMode: (mode: 'public' | 'friends' | 'clubs') => void;
  setShowAddFriend: (value: boolean) => void;
  setShowShopModal: (value: boolean) => void;
  getLeagueData: () => any[];
  getRankInfo: (wp: number) => any;
  socialProps: Record<string, any>;
  openSocialComposer: (...args: any[]) => void;
  streakFreezes: number;
  needsFreeze: boolean;
  useStreakFreeze: () => Promise<boolean>;
  posts: any[];
  setActiveTab: (tab: 'home' | 'insight' | 'league' | 'feed' | 'profile') => void;
}

export function useAppTabProps({
  profile,
  smartBottle,
  isExportingPDF,
  handleExportPDF,
  handleExportCSV,
  geminiProps,
  weeklyReport,
  isWeeklyReportLoading,
  handleGenerateWeeklyReport,
  weatherData,
  isWeatherSynced,
  watchData,
  isWatchConnected,
  leagueMode,
  setLeagueMode,
  setShowAddFriend,
  setShowShopModal,
  getLeagueData,
  getRankInfo,
  socialProps,
  openSocialComposer,
  streakFreezes,
  needsFreeze,
  useStreakFreeze,
  posts,
  setActiveTab,
}: UseAppTabPropsOptions) {
  const homeTabProps = useMemo(() => ({
    smartBottle,
  }) satisfies React.ComponentProps<typeof HomeTab>, [
    smartBottle,
  ]);

  const insightTabProps = useMemo(() => ({
    isExportingPDF,
    handleExportPDF,
    handleExportCSV,
    isAiLoading: geminiProps.isAiLoading || false,
    aiAdvice: geminiProps.aiAdvice || '',
    fetchAIAdvice: geminiProps.fetchAIAdvice || (() => {}),
    weeklyReport,
    isWeeklyReportLoading,
    generateWeeklyReport: handleGenerateWeeklyReport,
  }) satisfies React.ComponentProps<typeof InsightTab>, [
    geminiProps.aiAdvice,
    geminiProps.fetchAIAdvice,
    geminiProps.isAiLoading,
    handleExportPDF,
    handleExportCSV,
    handleGenerateWeeklyReport,
    isExportingPDF,
    isWeeklyReportLoading,
    weeklyReport,
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
  }) satisfies React.ComponentProps<typeof LeagueTab>, [
    getLeagueData,
    leagueMode,
    profile,
    setLeagueMode,
    setShowAddFriend,
  ]);

  const feedTabProps = useMemo(() => ({
    profile,
    socialStories: socialProps.socialStories || [],
    socialError: socialProps.socialError || '',
    isSocialLoading: socialProps.isSocialLoading || false,
    socialFollowingIds: socialProps.socialFollowingIds || [],
    closeCircleMembers: socialProps.closeCircleMembers || [],
    closeCircleIds: socialProps.closeCircleIds || [],
    isCloseCircleLoading: socialProps.isCloseCircleLoading || false,
    openSocialComposer,
    openQuickDropCamera: socialProps.openQuickDropCamera || (() => {}),
    setShowSocialProfile: socialProps.setShowSocialProfile || (() => {}),
    setShowDiscoverPeople: socialProps.setShowDiscoverPeople || (() => {}),
    handleToggleLikePost: socialProps.handleToggleLikePost || (() => {}),
  }) satisfies React.ComponentProps<typeof FeedTab>, [
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
    socialProfileStats: socialProps.socialProfileStats || { followers: 0, following: 0, posts: 0 },
    posts,
    handleToggleLikePost: socialProps.handleToggleLikePost || (() => {}),
    setShowShopModal,
  }) satisfies React.ComponentProps<typeof ProfileTab>, [
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
