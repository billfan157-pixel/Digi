import { create } from 'zustand';
import type { TabType } from '@/components/layout/BottomNav';

// Định nghĩa Interface để TypeScript không bắt bẻ
interface UIState {
  isSidebarOpen: boolean;
  activeTab: TabType;
  toggleSidebar: () => void;
  setActiveTab: (tab: TabType) => void;
  showMainMenu: boolean;
  setShowMainMenu: (show: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showSmartHub: boolean;
  setShowSmartHub: (show: boolean) => void;
  showCustomDrink: boolean;
  setShowCustomDrink: (show: boolean) => void;
  showPresetManager: boolean;
  setShowPresetManager: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAiChat: boolean;
  setShowAiChat: (show: boolean) => void;
  showSocialComposer: boolean;
  setShowSocialComposer: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  showProfileSettings: boolean;
  setShowProfileSettings: (show: boolean) => void;
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  showEditProfile: boolean;
  setShowEditProfile: (show: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  showShopModal: boolean;
  setShowShopModal: (show: boolean) => void;
  competeSubTab: 'battles' | 'ranking' | 'clubs';
  setCompeteSubTab: (tab: 'battles' | 'ranking' | 'clubs') => void;
  showQuestModal: boolean;
  setShowQuestModal: (show: boolean) => void;
  showClubCoopModal: boolean;
  setShowClubCoopModal: (show: boolean) => void;
  editingEntry: { id: string } | null;
  setEditingEntry: (entry: { id: string } | null) => void;
  editAmount: string;
  setEditAmount: (amount: string) => void;
  showLevelUp: boolean;
  setShowLevelUp: (show: boolean) => void;
  levelUpInfo: { fromLevel: number; toLevel: number } | null;
  setLevelUpInfo: (info: { fromLevel: number; toLevel: number } | null) => void;
  showFastingModal: boolean;
  setShowFastingModal: (show: boolean) => void;
  showFirstSessionChecklist: boolean;
  setShowFirstSessionChecklist: (show: boolean) => void;
  activeCommentPost: unknown | null;
  setActiveCommentPost: (post: unknown | null) => void;
  showHardwareWaitlist: boolean;
  setShowHardwareWaitlist: (show: boolean) => void;
  showChallengeModal: boolean;
  setShowChallengeModal: (show: boolean) => void;
  showThemeCreator: boolean;
  setShowThemeCreator: (show: boolean) => void;
  showDuelResult: boolean;
  setShowDuelResult: (show: boolean) => void;
  duelResultData: { result: 'won' | 'lost' | 'draw'; rewardCoins: number; opponentName: string } | null;
  setDuelResultData: (data: { result: 'won' | 'lost' | 'draw'; rewardCoins: number; opponentName: string } | null) => void;
  showDeveloperPortal: boolean;
  setShowDeveloperPortal: (show: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: false, toggleSidebar: () => set((state: UIState) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activeTab: 'home', setActiveTab: (tab) => set({ activeTab: tab }),
  showMainMenu: false, setShowMainMenu: (show) => set({ showMainMenu: show }),
  showHistory: false, setShowHistory: (show) => set({ showHistory: show }),
  showSmartHub: false, setShowSmartHub: (show) => set({ showSmartHub: show }),
  showCustomDrink: false, setShowCustomDrink: (show) => set({ showCustomDrink: show }),
  showPresetManager: false, setShowPresetManager: (show) => set({ showPresetManager: show }),
  showOnboarding: false, setShowOnboarding: (show) => set({ showOnboarding: show }),
  showAiChat: false, setShowAiChat: (show) => set({ showAiChat: show }),
  showSocialComposer: false, setShowSocialComposer: (show) => set({ showSocialComposer: show }),
  showPremiumModal: false, setShowPremiumModal: (show) => set({ showPremiumModal: show }),
  showProfileSettings: false, setShowProfileSettings: (show) => set({ showProfileSettings: show }),
  showAddFriend: false, setShowAddFriend: (show) => set({ showAddFriend: show }),
  showEditProfile: false, setShowEditProfile: (show) => set({ showEditProfile: show }),
  onboardingStep: 1, setOnboardingStep: (step) => set({ onboardingStep: step }),
  showShopModal: false, setShowShopModal: (show) => set({ showShopModal: show }),
  competeSubTab: 'battles', setCompeteSubTab: (tab) => set({ competeSubTab: tab }),
  showQuestModal: false, setShowQuestModal: (show) => set({ showQuestModal: show }),
  showClubCoopModal: false, setShowClubCoopModal: (show) => set({ showClubCoopModal: show }),
  editingEntry: null, setEditingEntry: (entry) => set({ editingEntry: entry }),
  editAmount: '', setEditAmount: (amount) => set({ editAmount: amount }),
  showLevelUp: false, setShowLevelUp: (show) => set({ showLevelUp: show }),
  levelUpInfo: null, setLevelUpInfo: (info) => set({ levelUpInfo: info }),
  showFastingModal: false, setShowFastingModal: (show) => set({ showFastingModal: show }),
  showFirstSessionChecklist: false, setShowFirstSessionChecklist: (show) => set({ showFirstSessionChecklist: show }),
  activeCommentPost: null, setActiveCommentPost: (post) => set({ activeCommentPost: post }),
  showHardwareWaitlist: false, setShowHardwareWaitlist: (show) => set({ showHardwareWaitlist: show }),
  showChallengeModal: false, setShowChallengeModal: (show) => set({ showChallengeModal: show }),
  showThemeCreator: false, setShowThemeCreator: (show) => set({ showThemeCreator: show }),
  showDuelResult: false, setShowDuelResult: (show) => set({ showDuelResult: show }),
  duelResultData: null, setDuelResultData: (data) => set({ duelResultData: data }),
  showDeveloperPortal: false, setShowDeveloperPortal: (show) => set({ showDeveloperPortal: show }),
}));
