import React from 'react';
import CoachHero from './CoachHero';

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
  isPremium,
  setShowPremiumModal,
}: OverviewSectionProps) {
  const handleHeroClick = () => {
    if (nextBestAction.ml > 0 && actions?.handleAddWater) {
      actions.handleAddWater(nextBestAction.ml, 0, 'Gợi ý AI');
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
      isPremium={isPremium}
      setShowPremiumModal={setShowPremiumModal}
    />
  );
}