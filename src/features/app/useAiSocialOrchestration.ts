import { toast } from 'sonner';
import { useFeed } from '@/hooks/useFeed';
import { useGeminiAI } from '@/hooks/useGroqAI';
import { useSocialData } from '@/hooks/useSocialData';

import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

export function useAiSocialOrchestration() {


  const profile = useAppStore(s => s.profile);
  const waterIntake = useAppStore(s => s.waterIntake);
  const waterGoal = useAppStore(s => s.waterGoal);
  const streak = useAppStore(s => s.streak);
  const weatherData = useAppStore(s => s.weatherData);
  const watchData = useAppStore(s => s.watchData);
  const isWeatherSynced = useAppStore(s => s.isWeatherSynced);
  const isWatchConnected = useAppStore(s => s.isWatchConnected);
  const handleAddWater = useAppStore(s => s.actions.handleAddWater);

  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const setShowAiChat = useUIStore(s => s.setShowAiChat);
  const setShowHistory = useUIStore(s => s.setShowHistory);

  // Dummy handlers for now that will be wired to actual implementations 
  // or extracted from another store if available
  const handleExportPDF = async () => { toast.success('Export PDF feature') };
  const toggleFastingMode = () => { toast.success('Fasting Mode Triggered') };

  const socialProps = useSocialData({
    profile: profile as unknown as Record<string, unknown> | null,
    waterIntake,
    waterGoal,
    streak,
    activeTab,
    setActiveTab: setActiveTab as (tab: string) => void,
  }) || {};

  const geminiProps = useGeminiAI({
    profile,
    waterIntake,
    waterGoal,
    weatherData,
    watchData,
    isWeatherSynced,
    isWatchConnected,
    handleAddWater,
    setShowAiChat,
    handleExportPDF,
    toggleFastingMode,
    setShowHistory,
  }) || {};

  const { posts } = useFeed(profile?.id, socialProps.closeCircleIds || []);

  return {
    socialProps,
    geminiProps,
    posts,
    openSocialComposer: socialProps.openSocialComposer || (() => { }),
  };
}
