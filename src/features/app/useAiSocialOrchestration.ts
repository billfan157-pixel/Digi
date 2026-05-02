import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { isAiConfigured, scanDrinkFromImage } from '@/lib/ai';
import { useFeed } from '@/hooks/useFeed';
import { useGeminiAI } from '@/hooks/useGroqAI';
import { useSocialData } from '@/hooks/useSocialData';

import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

export function useAiSocialOrchestration() {
  const isScanning = useUIStore(s => s.isScanning);
  const setIsScanning = (scanning: boolean) => useUIStore.getState().setIsScanning(scanning);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    profile,
    waterIntake,
    waterGoal,
    streak,
    activeTab,
    setActiveTab,
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

  const { posts } = useFeed(profile?.id);

  const handleScan = useCallback(() => {
    if (!isAiConfigured()) {
      toast.error('Cloud AI chưa được cấu hình.');
      return;
    }

    fileInputRef.current?.click();
  }, []);

  const processImageScan = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('AI đang phân tích hình ảnh...');

    try {
      const result = await scanDrinkFromImage(file);
      await handleAddWater(result.amount, result.factor, `${result.name} (AI Scan)`);
      toast.success(`AI nhận diện: ${result.name} (${result.amount}ml)`, { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsScanning(false);
      event.target.value = '';
    }
  }, [handleAddWater]);

  return {
    socialProps,
    geminiProps,
    posts,
    isScanning,
    fileInputRef,
    handleScan,
    processImageScan,
    openSocialComposer: socialProps.openSocialComposer || (() => {}),
  };
}
