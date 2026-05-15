import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { RefreshCw, Bluetooth } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { impact } from '@/lib/haptics';

import { useUIStore } from '../../store/useUIStore';
import LevelDetailModal from '../LevelDetailModal';
import HomeHydrationHero from '../../components/home/HomeHydrationHero';
import HydrationGoalModal from '../../components/modals/HydrationGoalModal';
import AnimatedCounter from '../../components/AnimatedCounter';
import LiquidProgress from '../../components/LiquidProgress';
import ConfettiParticles from '../../components/ConfettiParticles';
import { WaterSplashEffect } from '../../components/effects/WaterSplashEffect';
import { useAppStore } from '../../store/useAppStore';
import DayCompleteCard from '../../components/DayCompleteCard';
import ProgressSummary from '../../components/home/ProgressSummary';
import { useShallow } from 'zustand/react/shallow';

import { HomeHeader, QuickAddSection, TelemetryGrid } from './components';
import { MainMenuSidebar, QuickAmountsEditor, DrinkMenuModal } from './modals';

interface SmartBottleProps {
  isSyncing: boolean;
  isConnected: boolean;
  metrics?: { currentVolume?: number; batteryLevel?: number };
  equippedBottle: unknown;
  connectDevice: () => void;
  disconnectDevice: () => void;
  forceSync: () => void;
}

interface HomeTabProps {
  smartBottle: SmartBottleProps;
}

const HomeTab = React.memo((props: HomeTabProps) => {
  const { t } = useTranslation();
  
  const { 
    setActiveTab, setShowHistory, setShowProfileSettings,
  } = useUIStore(useShallow((state) => ({
    setActiveTab: state.setActiveTab,
    setShowHistory: state.setShowHistory,
    setShowProfileSettings: state.setShowProfileSettings,
  })));

  const {
    profile, streak, waterIntake, waterGoal,
    weatherData, watchData, hydrationResult,
    actions: { handleAddWater: _rawAddWater, handleLogout }
  } = useAppStore(useShallow((state) => ({
    profile: state.profile,
    streak: state.streak,
    waterIntake: state.waterIntake,
    waterGoal: state.waterGoal,
    weatherData: state.weatherData,
    watchData: state.watchData,
    hydrationResult: state.hydrationResult,
    actions: state.actions,
  })));

  // Splash effect state
  const [splashTrigger, setSplashTrigger] = useState(0);
  const [splashAmount, setSplashAmount] = useState(250);

  const handleAddWater = React.useCallback(
    async (amount: number, factor: number, name: string) => {
      setSplashAmount(amount);
      setSplashTrigger(prev => prev + 1);
      impact('light');
      return _rawAddWater(amount, factor, name);
    },
    [_rawAddWater]
  );

  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const isGoalReached = waterIntake >= waterGoal && waterGoal > 0;
  const [showDayComplete, setShowDayComplete] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrinkMenuOpen, setIsDrinkMenuOpen] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([100, 250, 500]);
  const [isEditingQuickAmounts, setIsEditingQuickAmounts] = useState(false);
  const [draftAmounts, setDraftAmounts] = useState<[number, number, number]>([100, 250, 500]);
  const [showLevelDetail, setShowLevelDetail] = useState(false);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
        setScrollProgress(progress);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const bottleDemoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_BOTTLE_DEMO === 'true';

  const { isSyncing: isConnecting, isConnected, metrics, connectDevice: connectBottle, disconnectDevice: disconnectBottle, forceSync: syncData, equippedBottle } = props.smartBottle;
  const effectiveIsConnected = bottleDemoEnabled && isConnected;
  const batteryLevel = metrics?.batteryLevel || 0;

  useEffect(() => {
    const handleOpenMenu = () => setIsDrinkMenuOpen(true);
    window.addEventListener('openDrinkMenuFromWidget', handleOpenMenu);
    return () => window.removeEventListener('openDrinkMenuFromWidget', handleOpenMenu);
  }, []);

  // Auto-show DayCompleteCard when goal is first reached
  useEffect(() => {
    if (isGoalReached && waterIntake > 0) {
      setShowDayComplete(true);
    }
  }, [isGoalReached]);

  const handleLogoutClick = async () => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: t('home.logout'), message: t('home.logout_confirm'), confirmLabel: t('home.logout'), variant: 'danger' });
    if (ok) {
      setIsMenuOpen(false);
      handleLogout();
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in zoom-in duration-300 pb-12 relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-800/60 to-transparent dark:via-slate-900/60 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent dark:via-cyan-400 transition-all duration-150" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>
      
      {/* 1. Header */}
      <HomeHeader 
        profile={profile} 
        onMenuOpen={() => setIsMenuOpen(true)} 
      />

      {/* 2. Progress Summary (merged LevelBar + HabitNudgeBar) */}
      {profile ? (
        <ProgressSummary
          level={Number((profile as unknown as Record<string, unknown>).level) || 1}
          streak={streak}
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          onLevelClick={() => setShowLevelDetail(true)}
        />
      ) : (
        <div className="mx-6 h-[120px] bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-[1.75rem] p-5 animate-pulse" />
      )}

      <ConfettiParticles trigger={isGoalReached} />

      {/* 3. Hydration Hero */}
      {!effectiveIsConnected ? (
        <div className="relative my-4 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform px-6" onClick={() => setShowGoalDetail(true)}>
          <LiquidProgress percentage={progress} />
          <WaterSplashEffect trigger={splashTrigger} amount={splashAmount} />
          <div className="absolute text-center z-10 drop-shadow-xl pointer-events-none flex flex-col items-center">
            <h2 className="text-5xl font-black text-white flex items-baseline justify-center">
              <AnimatedCounter value={waterIntake} /> 
              <span className="text-2xl ml-2 text-slate-300 font-bold">ml</span>
            </h2>
            <div className="mt-3 px-4 py-2 bg-slate-900/70 backdrop-blur-lg rounded-full border border-white/15 flex items-center gap-2 shadow-lg">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                {t('home.goal')}: <span className="text-white font-black">{waterGoal} ml</span>
              </span>
            </div>
            {waterIntake === 0 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-3 text-[10px] text-cyan-400/70 font-medium max-w-[200px] text-center leading-tight"
              >
                Chạm để bắt đầu
              </motion.p>
            )}
            {progress >= 100 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 border border-emerald-500/60 rounded-full shadow-lg shadow-emerald-500/20"
              >
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t('home.goal_reached')}</span>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <HomeHydrationHero
          isConnected={effectiveIsConnected}
          isConnecting={isConnecting}
          metrics={metrics}
          equippedBottleSkin={equippedBottle as import('@/hooks/useSmartBottle').EquippedBottleSkin | null}
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          progress={progress}
          bottleCapacity={750}
          onConnectBottle={connectBottle}
          onOpenGoalDetail={() => setShowGoalDetail(true)}
          onOpenBottleDetail={() => setActiveTab('bottle')}
        />
      )}

      {/* 4. Quick Actions (merged QuickAddSection + UtilityRow) */}
      {!effectiveIsConnected && (
        <QuickAddSection
          quickAmounts={quickAmounts}
          handleAddWater={handleAddWater}
          onEditQuickAmounts={() => {
            setDraftAmounts([quickAmounts[0] || 100, quickAmounts[1] || 250, quickAmounts[2] || 500]);
            setIsEditingQuickAmounts(true);
          }}
          onHistory={() => setShowHistory(true)}
          onDrinkMenu={() => setIsDrinkMenuOpen(true)}
        />
      )}

      {/* 5. Telemetry Grid */}
      <div className="px-5">
        <TelemetryGrid weatherData={weatherData} watchData={watchData} />
      </div>

      {/* 6. Day Complete + Bottle Demo */}
      {showDayComplete && isGoalReached && (
        <div className="px-5">
          <DayCompleteCard
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            streak={streak}
            isGoalReached={isGoalReached}
            onClose={() => setShowDayComplete(false)}
          />
        </div>
      )}

      {bottleDemoEnabled && (
        <div className="mx-5 rounded-[1.5rem] bg-slate-900/80 border border-white/10 backdrop-blur-xl p-4 overflow-hidden relative mb-6">
          <div className="absolute -right-10 top-0 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${effectiveIsConnected ? 'bg-cyan-500/12 border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-slate-800/80 border-slate-700 text-slate-500'}`}>
                <Bluetooth size={20} className={isConnecting ? 'animate-pulse' : ''} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white tracking-tight">{effectiveIsConnected ? 'DigiBottle Pro' : 'DigiBottle Demo'}</h2>
                  <div className={`w-1.5 h-1.5 rounded-full ${effectiveIsConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-[10rem] truncate">
                  {effectiveIsConnected ? `Pin ${batteryLevel}% • Live` : (isConnecting ? t('home.finding_device') : 'Sẵn sàng ghép nối')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {effectiveIsConnected ? (
                <>
                  <button onClick={syncData} className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center active:scale-95 transition-all">
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={disconnectBottle} className="h-9 px-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black active:scale-95 transition-all flex items-center gap-1.5">
                    Ngắt
                  </button>
                </>
              ) : (
                <button 
                  onClick={connectBottle} 
                  disabled={isConnecting} 
                  className="h-9 px-4 rounded-full bg-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : 'Bật'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MainMenuSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onProfile={() => { setIsMenuOpen(false); setActiveTab('profile'); }}
        onSettings={() => { setIsMenuOpen(false); setShowProfileSettings(true); }}
        onLogout={handleLogoutClick}
      />

      <QuickAmountsEditor
        isOpen={isEditingQuickAmounts}
        onClose={() => setIsEditingQuickAmounts(false)}
        draftAmounts={draftAmounts}
        onDraftChange={setDraftAmounts}
        onSave={() => {
          const parsed = draftAmounts.filter(n => !isNaN(n) && n >= 50 && n <= 2000);
          if (parsed.length === 3) {
            setQuickAmounts(parsed);
            toast.success(t('home.quick_amounts_updated'));
          } else {
            toast.error(t('home.quick_amounts_invalid'));
          }
        }}
      />

      <DrinkMenuModal
        isOpen={isDrinkMenuOpen}
        onClose={() => setIsDrinkMenuOpen(false)}
        handleAddWater={handleAddWater}
      />

      {profile && (
        <LevelDetailModal isOpen={showLevelDetail} onClose={() => setShowLevelDetail(false)} level={profile.level || 1} exp={profile.total_exp || 0} />
      )}

      <HydrationGoalModal isOpen={showGoalDetail} onClose={() => setShowGoalDetail(false)} waterIntake={waterIntake} hydrationResult={hydrationResult} />
    </div>
  );
});

export default HomeTab;