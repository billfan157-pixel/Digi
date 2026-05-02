import { useUIStore } from '@/store/useUIStore';
import { useShallow } from 'zustand/react/shallow';

export function useAppLocalUiState() {
  return useUIStore(useShallow((state) => ({
    onboardingStep: state.onboardingStep,
    setOnboardingStep: state.setOnboardingStep,
    showShopModal: state.showShopModal,
    setShowShopModal: state.setShowShopModal,
    showBattleArena: state.showBattleArena,
    setShowBattleArena: state.setShowBattleArena,
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
