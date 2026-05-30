import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '@/store/useUIStore';

export function useAppUiState() {
  return useUIStore(useShallow((state) => ({
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    showHistory: state.showHistory,
    setShowHistory: state.setShowHistory,
    setShowOnboarding: state.setShowOnboarding,
    setShowAiChat: state.setShowAiChat,
    showPremiumModal: state.showPremiumModal,
    setShowPremiumModal: state.setShowPremiumModal,
    showProfileSettings: state.showProfileSettings,
    setShowProfileSettings: state.setShowProfileSettings,
    showAddFriend: state.showAddFriend,
    setShowAddFriend: state.setShowAddFriend,
    showShopModal: state.showShopModal,
    setShowShopModal: state.setShowShopModal,

    showQuestModal: state.showQuestModal,
    setShowQuestModal: state.setShowQuestModal,
    showClubCoopModal: state.showClubCoopModal,
    setShowClubCoopModal: state.setShowClubCoopModal,
    editingEntry: state.editingEntry,
    setEditingEntry: state.setEditingEntry,
    editAmount: state.editAmount,
    setEditAmount: state.setEditAmount,
  })));
}
