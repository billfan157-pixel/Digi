import React from 'react';
import CoachHero from './CoachHero';
import { confirmDialog } from '@/store/useConfirmDialog';
import { useFeature } from '@/hooks/useFeature';
import { useTranslation } from 'react-i18next';

interface OverviewSectionProps {
  greeting: string;
  primaryStory: string;
  nextBestAction: {
    title: string;
    action: string;
    ml: number;
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    bg: string;
  };
  actions?: {
    handleAddWater?: (amount: number, type: number, name: string) => void;
  };
  aiAdvice: string;
  isAiLoading: boolean;
  fetchAiAdvice: () => void;
  isPremium: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

export default function OverviewSection({
  greeting,
  primaryStory,
  nextBestAction,
  actions,
  aiAdvice,
  isAiLoading,
  fetchAiAdvice,
  setShowPremiumModal,
}: OverviewSectionProps) {
  const { t } = useTranslation();
  const canUseCoach = useFeature('aiHydrationCoach');
  const handleHeroClick = async () => {

      if (nextBestAction.ml > 0) {
        const ok = await confirmDialog({
          title: t('home.drink_confirm_title', { amount: nextBestAction.ml }),
          message: t('home.drink_confirm_message'),
          confirmLabel: t('home.drink_now'),
          cancelLabel: t('home.skip'),
        });
        if (ok) actions?.handleAddWater?.(nextBestAction.ml, 0, t('ai_suggestion'));
      }
  };

  return (
    <CoachHero
      greeting={greeting}
      primaryStory={primaryStory}
      nextBestAction={nextBestAction}
      onClickAction={handleHeroClick}
      aiAdvice={aiAdvice}
      isAiLoading={isAiLoading}
      fetchAiAdvice={fetchAiAdvice}
      isPremium={canUseCoach}
      setShowPremiumModal={setShowPremiumModal}
    />
  );
}