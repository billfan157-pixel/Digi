import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import WelcomeScreen from '@/screens/Auth/WelcomeScreen';
import LoginScreen from '@/screens/Auth/LoginScreen';
import RegisterScreen from '@/screens/Auth/RegisterScreen';
import LockedScreen from '@/screens/LockedScreen';
import OnboardingModal from '@/components/OnboardingModal';
import BottomNav, { type TabType } from '@/components/layout/BottomNav';
import ThemeEngine from '@/components/ThemeEngine';
import GlobalModalManager from '@/components/modals/GlobalModalManager';
import type { Profile } from '@/models';

const HomeTab = React.lazy(() => import('@/tabs/HomeTab'));
const InsightTab = React.lazy(() => import('@/tabs/InsightTab'));
const FeedTab = React.lazy(() => import('@/tabs/FeedTab'));
const ProfileTab = React.lazy(() => import('@/tabs/ProfileTab'));
const LeagueTab = React.lazy(() => import('@/tabs/LeagueTab'));
const BottleTab = React.lazy(() => import('@/components/BottleTab'));

export type AppView = 'welcome' | 'login' | 'register' | 'app' | 'locked';

export interface AppShellProps {
  view: AppView;
  setView: (view: AppView) => void;
  loginPrefill: string;
  handleRegisterSuccess: (email: string) => void;
  profile: Profile | null;
  handleLogout: () => Promise<void>;
  fileInputProps: React.ComponentProps<'input'>;
  onboardingProps: {
    profile: Profile;
    onComplete: (weight: number, waterGoal: number, name: string) => Promise<void>;
  } | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  homeTabProps: React.ComponentProps<typeof HomeTab>;
  insightTabProps: React.ComponentProps<typeof InsightTab>;
  bottleTabProps: React.ComponentProps<typeof BottleTab> | null;
  leagueTabProps: React.ComponentProps<typeof LeagueTab>;
  feedTabProps: React.ComponentProps<typeof FeedTab>;
  profileTabProps: React.ComponentProps<typeof ProfileTab>;
  devSyncProps?: {
    visible: boolean;
    onClick: () => void;
  };
}

export default function AppShell({
  view,
  setView,
  loginPrefill,
  handleRegisterSuccess,
  profile,
  handleLogout,
  fileInputProps,
  onboardingProps,
  activeTab,
  setActiveTab,
  homeTabProps,
  insightTabProps,
  bottleTabProps,
  leagueTabProps,
  feedTabProps,
  profileTabProps,
  devSyncProps,
}: AppShellProps) {
  const tabFallback = <div className="h-40 rounded-3xl bg-slate-900/40 border border-white/5 animate-pulse" />;
  const bottleDemoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_BOTTLE_DEMO === 'true';

  if (view === 'welcome') {
    return <WelcomeScreen onNavigate={(nextView: 'login' | 'register') => setView(nextView)} />;
  }

  if (view === 'login') {
    return <LoginScreen onBack={() => setView('welcome')} initialEmail={loginPrefill} />;
  }

  if (view === 'register') {
    return (
      <RegisterScreen
        onBack={() => setView('welcome')}
        onSuccess={handleRegisterSuccess}
      />
    );
  }

  if (view === 'locked') {
    return <LockedScreen profile={profile} onUnlock={() => setView('app')} onLogout={handleLogout} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden font-sans scanline-overlay bg-slate-50 dark:bg-slate-950 pt-[env(safe-area-inset-top)]">
      <ThemeEngine profile={profile} />
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[50%] bg-cyan-500/15 blur-[120px] pointer-events-none rounded-full transition-colors duration-500" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[40%] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full transition-colors duration-500" />
      <input {...fileInputProps} />

      {onboardingProps && (
        <OnboardingModal
          profile={onboardingProps.profile}
          onComplete={onboardingProps.onComplete}
        />
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28">
        <Suspense fallback={tabFallback}>
          {activeTab === 'home' && (
            <ErrorBoundary key="home-tab">
              <HomeTab {...homeTabProps} />
            </ErrorBoundary>
          )}
          {activeTab === 'insight' && (
            <ErrorBoundary key="insight-tab">
              <InsightTab {...insightTabProps} />
            </ErrorBoundary>
          )}
          {activeTab === 'league' && (
            <ErrorBoundary key="league-tab">
              <LeagueTab {...leagueTabProps} />
            </ErrorBoundary>
          )}
          {activeTab === 'feed' && (
            <ErrorBoundary key="feed-tab">
              <FeedTab {...feedTabProps} />
            </ErrorBoundary>
          )}
          {activeTab === 'profile' && (
            <ErrorBoundary key="profile-tab">
              <ProfileTab {...profileTabProps} />
            </ErrorBoundary>
          )}
          {activeTab === 'bottle' && bottleTabProps && (
            <ErrorBoundary key="bottle-tab">
              <BottleTab {...bottleTabProps} />
            </ErrorBoundary>
          )}
        </Suspense>
      </div>
