import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { RefreshCw, Bluetooth, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { impact } from '@/lib/haptics';
import type { BottleConnectionState } from '@/hooks/useSmartBottle';

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
import { glassCard } from '../../styles/glass';
import { useVolumeFormat } from '../../hooks/useVolumeFormat';
import { useHydrationPattern } from '../../hooks/useHydrationPattern';
import { useWeeklyReport } from '../../hooks/useWeeklyReport';
import { usePreviousWeekData } from '../../hooks/usePreviousWeekData';
import { useWaterData } from '../../hooks/useWaterData';
import { useDuelResultWatcher } from '../../hooks/useDuelResultWatcher';
import { buildWeatherHistoryFromCurrent } from '../../lib/weatherHistory';
import WeeklyReportModal from '../../components/modals/WeeklyReportModal';
import HabitNudgeBar from '../../components/HabitNudgeBar';
import { useAiNudge } from '../../hooks/useMLNudges';
import { confirmDialog } from '../../store/useConfirmDialog';

import { HomeHeader, QuickAddSection, TelemetryGrid, ActiveDuelBanner } from './components';
import { QuickAmountsEditor, DrinkMenuModal } from './modals';

interface SmartBottleProps {
  connectionState?: BottleConnectionState;
  isSyncing: boolean;
  isConnected: boolean;
  lastError?: string | null;
  metrics?: { currentVolume?: number; batteryLevel?: number };
  equippedBottle: unknown;
  connectDevice: () => void;
  disconnectDevice: () => void;
  retryConnection?: () => void;
  forceSync: () => void;
}

interface HomeTabProps {
  smartBottle: SmartBottleProps;
}

const HomeTab = React.memo((props: HomeTabProps) => {
  const { t } = useTranslation();
  
  const { 
    setActiveTab, setShowHistory, setShowMainMenu,
  } = useUIStore(useShallow((state) => ({
    setActiveTab: state.setActiveTab,
    setShowHistory: state.setShowHistory,
    setShowMainMenu: state.setShowMainMenu,
  })));

  const {
    profile, streak, waterIntake, waterGoal,
    weatherData, weatherLastUpdatedAt, watchData, hydrationResult,
    calendarEvents,
    actions: { handleAddWater: _rawAddWater }
  } = useAppStore(useShallow((state) => ({
    profile: state.profile,
    streak: state.streak,
    waterIntake: state.waterIntake,
    waterGoal: state.waterGoal,
    weatherData: state.weatherData,
    weatherLastUpdatedAt: state.weatherLastUpdatedAt,
    watchData: state.watchData,
    hydrationResult: state.hydrationResult,
    calendarEvents: state.calendarEvents,
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

  const [isDrinkMenuOpen, setIsDrinkMenuOpen] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([100, 250, 500]);
  const [isEditingQuickAmounts, setIsEditingQuickAmounts] = useState(false);
  const [draftAmounts, setDraftAmounts] = useState<[number, number, number]>([100, 250, 500]);
  const [showLevelDetail, setShowLevelDetail] = useState(false);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { formatVolume, getUnitLabel, unit } = useVolumeFormat();

  const bottleDemoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_BOTTLE_DEMO === 'true';

  const { connectionState = 'idle', isSyncing: isConnecting, isConnected, lastError, metrics, connectDevice: connectBottle, disconnectDevice: disconnectBottle, retryConnection: retryBottle, forceSync: syncData } = props.smartBottle;
  const showBottleHero = bottleDemoEnabled && connectionState !== 'idle';
  const batteryLevel = metrics?.batteryLevel || 0;

  // Water data for pattern analysis
  const { waterEntries } = useWaterData(profile, undefined, {});
  const { data: previousWeekRaw } = usePreviousWeekData(profile?.id);
  const previousWeekLogs = (previousWeekRaw || []).map(d => ({
    id: d.fullDate,
    user_id: profile?.id || '',
    amount: d.ml,
    name: 'Water',
    day: d.fullDate,
    exp: 0,
    created_at: d.fullDate,
  }));

  // Hydration pattern (7-day weather history from localStorage)
  const weatherHistory = buildWeatherHistoryFromCurrent(weatherData);
  const { pattern } = useHydrationPattern({
    waterLogs: waterEntries.map(e => ({ ...e, day: e.day || e.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10) })),
    waterGoal,
    userId: profile?.id || null,
    weatherHistory,
  });

  const hour = new Date().getHours();
  const [isFirstOpen] = useState(sessionStorage.getItem('home_first_open') !== 'true');
  useEffect(() => { sessionStorage.setItem('home_first_open', 'true'); }, []);

  const aiNudge = useAiNudge({
    hour,
    waterIntake,
    waterGoal,
    streak,
    isFirstOpen,
    weather: (weatherData && weatherData.temp !== undefined) ? { temp: weatherData.temp, status: weatherData.status || '' } : undefined,
    weeklyHistory: previousWeekRaw || [],
    calendarEvents: calendarEvents || undefined,
  });

  // Weekly report
  const { report, isLoading: isReportLoading, hasNewReport, shareReport } = useWeeklyReport({
    currentWeekLogs: waterEntries.map(e => ({ ...e, day: e.day || e.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10) })),
    previousWeekLogs,
    waterGoal,
    userId: profile?.id || null,
  });

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
  }, [isGoalReached, waterIntake]);

  useDuelResultWatcher();

  return (
    <div ref={containerRef} className="space-y-6 pb-10 pt-2 animate-in fade-in duration-300 relative">
      {/* 1. Header */}
      <HomeHeader 
        profile={profile} 
        onMenuOpen={() => setShowMainMenu(true)} 
        onWeeklyReportClick={() => setShowWeeklyReport(true)}
        hasNewReport={hasNewReport}
      />

      {/* 2. Progress Summary (merged LevelBar + HabitNudgeBar) */}
      {profile ? (
        <ProgressSummary
          level={profile.level || 1}
          exp={profile.total_exp || 0}
          streak={streak}
          onLevelClick={() => setShowLevelDetail(true)}
        />
      ) : (
        <div className="mx-6 h-[120px] bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-[var(--theme-border-glass,rgba(255,255,255,0.05))] rounded-[var(--theme-border-radius,28px)] p-5 animate-pulse" />
      )}

      <HabitNudgeBar
        hour={hour}
        waterIntake={waterIntake}
        waterGoal={waterGoal}
        streak={streak}
        isFirstOpen={isFirstOpen}
        pattern={pattern}
        onQuickDrink={(amount) => aiNudge.nudge.isAi ? (async (a) => { const ok = await confirmDialog({ title: t('home.drink_confirm_title', { amount: a }), message: t('home.drink_confirm_message'), confirmLabel: t('home.drink_now'), cancelLabel: t('home.skip') }); if (ok) handleAddWater(a, 1, 'Nudge'); })(amount) : handleAddWater(amount, 1, 'Nudge')}
        aiNudge={aiNudge.nudge.isAi ? {
          title: aiNudge.nudge.title,
          message: aiNudge.nudge.message,
          actionLabel: aiNudge.nudge.actionLabel,
          emoji: aiNudge.nudge.emoji,
          isLoading: aiNudge.isLoading,
        } : null}
      />
      <ConfettiParticles trigger={isGoalReached} />

      {/* 3. Hydration Hero */}
      {!showBottleHero ? (
        <div className="relative my-4 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform px-6" onClick={() => setShowGoalDetail(true)}>
          <LiquidProgress percentage={progress} />
          <WaterSplashEffect trigger={splashTrigger} amount={splashAmount} />
          <div className="absolute text-center z-10 drop-shadow-xl pointer-events-none flex flex-col items-center">
            <h2 className="text-5xl font-black text-white flex items-baseline justify-center">
              <AnimatedCounter value={unit === 'oz' ? Math.round(waterIntake * 0.033814) : waterIntake} /> 
              <span className="text-2xl ml-2 text-slate-300 font-bold">{getUnitLabel()}</span>
            </h2>
            <div className="mt-3 px-4 py-2 bg-[var(--theme-surface-glass,rgba(15,23,42,0.7))] backdrop-blur-lg rounded-full border border-[var(--theme-border-glass,rgba(255,255,255,0.15))] flex items-center gap-2 shadow-lg">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                {t('home.goal')}: <span className="text-white font-black">{formatVolume(waterGoal)}</span>
              </span>
            </div>
            {waterIntake === 0 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-3 text-[10px] text-cyan-400 opacity-70 font-medium max-w-[200px] text-center leading-tight"
              >
                {t('device.tap_to_start')}
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
          isConnected={isConnected}
          isConnecting={isConnecting}
          connectionState={connectionState}
          lastError={lastError}
          metrics={metrics}
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          progress={progress}
          bottleCapacity={750}
          onConnectBottle={connectBottle}
          onRetryConnection={retryBottle}
          onOpenGoalDetail={() => setShowGoalDetail(true)}
          onOpenBottleDetail={() => setActiveTab('bottle')}
        />
      )}

      {/* 4. Quick Actions — always visible, even when bottle connected */}
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

      {/* 5. Telemetry Grid */}
      <div className="px-5">
        <TelemetryGrid weatherData={weatherData} watchData={watchData} weatherLastUpdatedAt={weatherLastUpdatedAt} />
      </div>

      {/* 5b. Active Duels */}
      <ActiveDuelBanner onViewArena={profile ? () => setActiveTab('league') : undefined} />

      {/* 7. Day Complete + Bottle Demo */}
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
        <div className={`${glassCard} mx-5 rounded-[var(--theme-border-radius,24px)] p-4 overflow-hidden relative mb-6`}>
          <div className="absolute -right-10 top-0 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className={[
                'w-12 h-12 rounded-full border flex items-center justify-center shrink-0',
                connectionState === 'connected' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_var(--theme-glow-color,rgba(34,211,238,0.2))]' : '',
                connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-orange-500/10 border-orange-400/30 text-orange-300' : '',
                connectionState === 'error' ? 'bg-orange-500/10 border-orange-400/30 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : '',
                connectionState === 'idle' ? 'bg-slate-800/80 border-slate-700 text-slate-500' : '',
              ].join(' ')}>
                {connectionState === 'error' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Bluetooth size={20} className={connectionState === 'connecting' || connectionState === 'reconnecting' ? 'animate-pulse' : ''} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white tracking-tight">
                    {connectionState === 'connected' ? 'DigiBottle Pro' :
                     connectionState === 'connecting' ? 'DigiBottle' :
                     connectionState === 'reconnecting' ? 'DigiBottle' :
                     connectionState === 'error' ? 'DigiBottle' :
                     'DigiBottle Demo'}
                  </h2>
                  <div className={[
                    'w-1.5 h-1.5 rounded-full',
                    connectionState === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : '',
                    connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-orange-400 animate-pulse' : '',
                    connectionState === 'error' ? 'bg-orange-400' : '',
                    connectionState === 'idle' ? 'bg-slate-600' : '',
                  ].join(' ')} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-[12rem] truncate">
                  {connectionState === 'connected' ? `Pin ${batteryLevel}%` :
                   connectionState === 'connecting' ? t('device.status_connecting') :
                   connectionState === 'reconnecting' ? t('device.status_reconnecting') :
                   connectionState === 'error' ? lastError || t('device.status_failed') :
                   t('device.status_ready')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {connectionState === 'connected' ? (
                <>
                  <button onClick={syncData} className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center active:scale-95 transition-all">
                    <RefreshCw size={14} className={isConnecting ? 'animate-spin' : ''} />
                  </button>
                  <button onClick={disconnectBottle} className="h-9 px-4 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black active:scale-95 transition-all flex items-center gap-1.5">
                    {t('device.disconnect_btn')}
                  </button>
                </>
              ) : connectionState === 'error' ? (
                <button
                  onClick={retryBottle}
                  className="h-9 px-4 rounded-full bg-cyan-500 text-[var(--theme-accent-contrast,#06121a)] text-xs font-black shadow-[0_0_20px_var(--theme-glow-color,rgba(34,211,238,0.3))] active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> {t('device.retry_btn')}
                </button>
              ) : (
                <button
                  onClick={connectBottle}
                  disabled={connectionState === 'connecting' || connectionState === 'reconnecting'}
                  className="h-9 px-4 rounded-full bg-cyan-500 text-[var(--theme-accent-contrast,#06121a)] text-xs font-black shadow-[0_0_20px_var(--theme-glow-color,rgba(34,211,238,0.3))] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {(connectionState === 'connecting' || connectionState === 'reconnecting') ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : t('device.enable_btn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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

      <WeeklyReportModal
        report={report}
        isOpen={showWeeklyReport}
        onClose={() => setShowWeeklyReport(false)}
        onShare={shareReport}
        isLoading={isReportLoading}
      />
    </div>
  );
});

export default HomeTab;