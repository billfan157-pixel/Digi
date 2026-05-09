import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LogOut, BatteryFull, RefreshCw, Bluetooth, Droplet, Coffee, Activity, Wine, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUIStore } from '../../store/useUIStore';
import LevelBar from '../../components/LevelBar';
import LevelDetailModal from '../LevelDetailModal';
import CountUp from '../../components/CountUp';
import HomeHydrationHero from '../../components/home/HomeHydrationHero';
import HydrationGoalModal from '../../components/modals/HydrationGoalModal';
import AnimatedCounter from '../../components/AnimatedCounter';
import LiquidProgress from '../../components/LiquidProgress';
import ConfettiParticles from '../../components/ConfettiParticles';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { HomeHeader, QuickAddSection, UtilityRow, TelemetryGrid } from './components';
import { MainMenuSidebar, QuickAmountsEditor, DrinkMenuModal } from './modals';

interface SmartBottleProps {
  isSyncing: boolean;
  isConnected: boolean;
  metrics?: { currentVolume?: number; batteryLevel?: number };
  equippedBottle: any;
  connectDevice: () => void;
  disconnectDevice: () => void;
  forceSync: () => void;
}

interface HomeTabProps {
  smartBottle: SmartBottleProps;
}

const DEFAULT_GRID_DRINKS = [
  { id: 'default-1', name: 'Nước lọc', amount: 250, factor: 1, icon: 'Droplet', bg: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20', color: 'text-cyan-400' },
  { id: 'default-2', name: 'Cà phê', amount: 250, factor: 0.8, icon: 'Coffee', bg: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20', color: 'text-orange-400' },
  { id: 'default-3', name: 'Trà', amount: 250, factor: 0.9, icon: 'Coffee', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20', color: 'text-emerald-400' },
  { id: 'default-4', name: 'Nước ép', amount: 250, factor: 1, icon: 'Droplet', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20', color: 'text-fuchsia-400' },
  { id: 'default-5', name: 'Bia/Rượu', amount: 250, factor: -0.5, icon: 'Wine', bg: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20', color: 'text-rose-400' }
];

const presetStyles = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
};

const renderIcon = (iconName: string, props?: any) => {
  const icons: Record<string, React.ReactNode> = {
    Droplet: <Droplet {...props} />,
    Coffee: <Coffee {...props} />,
    Wine: <Wine {...props} />,
    Activity: <Activity {...props} />,
    Zap: <Zap {...props} />,
  };
  return icons[iconName] || icons.Droplet;
};

const HomeTab = React.memo((props: HomeTabProps) => {
  const { t } = useTranslation();
  
  const { 
    setActiveTab, setShowHistory, setShowProfileSettings,
    setShowShopModal, setShowBattleArena, setShowQuestModal, isScanning
  } = useUIStore(useShallow((state) => ({
    setActiveTab: state.setActiveTab,
    setShowHistory: state.setShowHistory,
    setShowProfileSettings: state.setShowProfileSettings,
    setShowShopModal: state.setShowShopModal,
    setShowBattleArena: state.setShowBattleArena,
    setShowQuestModal: state.setShowQuestModal,
    isScanning: state.isScanning,
  })));

  const {
    profile, waterIntake, waterGoal, waterEntries,
    weatherData, watchData, hydrationResult,
    actions: { handleAddWater, handleScan, handleLogout, handleDeleteEntry }
  } = useAppStore(useShallow((state) => ({
    profile: state.profile,
    waterIntake: state.waterIntake,
    waterGoal: state.waterGoal,
    waterEntries: state.waterEntries,
    weatherData: state.weatherData,
    watchData: state.watchData,
    hydrationResult: state.hydrationResult,
    actions: state.actions,
  })));

  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const isGoalReached = waterIntake >= waterGoal && waterGoal > 0;

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

  const handleLogoutClick = async () => {
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({ title: t('home.logout'), message: t('home.logout_confirm'), confirmLabel: t('home.logout'), variant: 'danger' });
    if (ok) {
      setIsMenuOpen(false);
      handleLogout();
    }
  };

  return (
    <div ref={containerRef} className="space-y-5 animate-in fade-in zoom-in duration-300 pb-12 relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-800/60 to-transparent dark:via-slate-900/60 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent dark:via-cyan-400 transition-all duration-150" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>
      
      <HomeHeader 
        profile={profile} 
        isScanning={isScanning} 
        handleScan={handleScan} 
        onMenuOpen={() => setIsMenuOpen(true)} 
      />

      {profile ? (
        <LevelBar level={profile.level || 1} exp={profile.total_exp || 0} onDetailClick={() => setShowLevelDetail(true)} />
      ) : (
        <div className="h-[168px] bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-[2rem] p-5 mb-6 shadow-xl animate-pulse" />
      )}

      <ConfettiParticles trigger={isGoalReached} />

      {!effectiveIsConnected ? (
        <div className="relative my-8 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform px-6" onClick={() => setShowGoalDetail(true)}>
          <LiquidProgress percentage={progress} />
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
            {/* Empty state: welcoming message for new users */}
            {waterIntake === 0 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-3 text-xs text-cyan-400/80 font-medium leading-relaxed max-w-[220px] text-center"
              >
                Chạm vào vòng tròn để bắt đầu hành trình Hydration của bạn
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
          equippedBottleSkin={equippedBottle}
          waterIntake={waterIntake}
          waterGoal={waterGoal}
          progress={progress}
          bottleCapacity={750}
          onConnectBottle={connectBottle}
          onOpenGoalDetail={() => setShowGoalDetail(true)}
          onOpenBottleDetail={() => setActiveTab('insight')}
        />
      )}

      {!effectiveIsConnected && (
        <QuickAddSection
          quickAmounts={quickAmounts}
          handleAddWater={handleAddWater}
          onEditQuickAmounts={() => {
            setDraftAmounts([quickAmounts[0] || 100, quickAmounts[1] || 250, quickAmounts[2] || 500]);
            setIsEditingQuickAmounts(true);
          }}
        />
      )}

      <UtilityRow
        onHistory={() => setShowHistory(true)}
        onDrinkMenu={() => setIsDrinkMenuOpen(true)}
      />


      <TelemetryGrid weatherData={weatherData} watchData={watchData} />

      {bottleDemoEnabled && (
        <div className="glass-card px-6 py-4 flex items-center justify-between mb-6 hover:shadow-[0_6px_16px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${effectiveIsConnected ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
                <Bluetooth size={22} className={`${isConnecting ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
              </div>
              {effectiveIsConnected && <motion.div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full border-3 border-slate-900 shadow-lg" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} />}
            </div>
            <div>
              <h3 className="text-white font-black text-sm">DigiBottle Demo</h3>
              {effectiveIsConnected ? (
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-emerald-500/15 px-2 py-1 rounded-lg border border-emerald-500/30">
                    <BatteryFull size={11} /> {batteryLevel}%
                  </span>
                  <span className="text-slate-400 text-[9px] uppercase font-bold tracking-widest border-l border-slate-700 pl-2.5">Live</span>
                </div>
              ) : (
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1.5">
                  {isConnecting ? t('home.finding_device') : t('home.offline')}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {effectiveIsConnected ? (
              <>
                <Button variant="icon-btn" onClick={syncData}>
                  <RefreshCw size={16} />
                </Button>
                <Button variant="icon-btn" onClick={disconnectBottle}>
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={connectBottle} disabled={isConnecting}>
                {isConnecting ? t('home.turning_on_demo') : t('home.turn_on_demo')}
              </Button>
            )}
          </div>
        </div>
      )}

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

export { renderIcon, presetStyles };