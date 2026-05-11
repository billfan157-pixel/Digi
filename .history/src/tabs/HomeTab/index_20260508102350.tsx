import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, LogOut, Edit2, X, BatteryFull, RefreshCw, Bluetooth, Droplet, Coffee, Activity, Wine, Zap } from 'lucide-react';
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

import { HomeHeader, GamificationBar, QuickAddSection, UtilityRow, TelemetryGrid, RecentActivity } from './components';
import { MainMenuSidebar, QuickAmountsEditor } from './modals';
import { useDrinkGrid } from './hooks/useDrinkGrid';

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

  const { drinkGridList, addDrink, updateDrink, deleteDrink } = useDrinkGrid();

  const progress = Math.min((waterIntake / (waterGoal || 1)) * 100, 100);
  const isGoalReached = waterIntake >= waterGoal && waterGoal > 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrinkMenuOpen, setIsDrinkMenuOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customVolume, setCustomVolume] = useState(250);
  const [customFactor, setCustomFactor] = useState(1.0);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
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

      <GamificationBar
        wp={profile?.wp || 0}
        coins={profile?.coins || 0}
        onShopClick={() => setShowShopModal(true)}
        onBattleClick={() => setShowBattleArena(true)}
        onQuestClick={() => setShowQuestModal(true)}
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
            <h2 className="text-5xl font-black text-slate-800 dark:text-white flex items-baseline justify-center">
              <AnimatedCounter value={waterIntake} /> 
              <span className="text-2xl ml-2 text-slate-500 dark:text-slate-300 font-bold">ml</span>
            </h2>
            <div className="mt-3 px-4 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-full border border-slate-200/50 dark:border-white/15 flex items-center gap-2 shadow-lg">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest">
                {t('home.goal')}: <span className="text-slate-900 dark:text-white font-black">{waterGoal} ml</span>
              </span>
            </div>
            {progress >= 100 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 border border-emerald-500/60 rounded-full shadow-lg shadow-emerald-500/20"
              >
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('home.goal_reached')}</span>
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
        onProfileSettings={() => setShowProfileSettings(true)}
        onHistory={() => setShowHistory(true)}
        onDrinkMenu={() => setIsDrinkMenuOpen(true)}
      />

      <div className="px-6">
        <RecentActivity
          waterEntries={waterEntries || []}
          handleDeleteEntry={handleDeleteEntry}
          setShowHistory={setShowHistory}
        />
      </div>

      <TelemetryGrid weatherData={weatherData} watchData={watchData} />

      {bottleDemoEnabled && (
        <div className="bg-gradient-to-r from-slate-200/60 to-slate-100/40 dark:from-slate-900/60 dark:to-slate-800/40 backdrop-blur-xl border border-slate-300/50 dark:border-white/10 rounded-[2rem] px-6 py-4 flex items-center justify-between mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(6,182,212,0.15)] hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${effectiveIsConnected ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]' : 'bg-slate-200/60 dark:bg-slate-800/50 border-slate-300/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500'}`}>
                <Bluetooth size={22} className={`${isConnecting ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
              </div>
              {effectiveIsConnected && <motion.div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full border-3 border-white dark:border-slate-900 shadow-lg" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} />}
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-sm">DigiBottle Demo</h3>
              {effectiveIsConnected ? (
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-emerald-500/15 px-2 py-1 rounded-lg border border-emerald-500/30">
                    <BatteryFull size={11} /> {batteryLevel}%
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-bold tracking-widest border-l border-slate-400/50 dark:border-slate-700 pl-2.5">Live</span>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1.5">
                  {isConnecting ? t('home.finding_device') : t('home.offline')}
                </p>
              )}
            </div>
          </div>
          <div>
            {effectiveIsConnected ? (
              <div className="flex gap-2">
                <button onClick={syncData} className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/25 dark:hover:bg-cyan-500/20 active:scale-90 transition-all flex items-center justify-center shadow-[0_2px_8px_rgba(6,182,212,0.1)] hover:shadow-[0_4px_12px_rgba(6,182,212,0.2)] group/btn">
                  <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                </button>
                <button onClick={disconnectBottle} className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 dark:hover:bg-rose-500/20 active:scale-90 transition-all flex items-center justify-center shadow-[0_2px_8px_rgba(244,63,94,0.1)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.2)]">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
<button onClick={connectBottle} disabled={isConnecting} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-50">
                 {isConnecting ? t('home.turning_on_demo') : t('home.turn_on_demo')}
               </button>
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

      <AnimatePresence>
        {isDrinkMenuOpen && (
          <div key="drink-menu-modal" className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsDrinkMenuOpen(false)} />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", damping: 24, stiffness: 220 }} 
              drag="y" 
              dragConstraints={{ top: 0 }} 
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) { setIsDrinkMenuOpen(false); setIsCustomMode(false); }
              }}
              className="relative w-full bg-gradient-to-br from-slate-900 to-slate-950 backdrop-blur-2xl border-t border-white/15 rounded-t-[2rem] shadow-2xl p-6 pt-5"
            >
              <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-5 shrink-0" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-black text-lg">{isCustomMode ? t('home.create_new_drink') : t('home.add_drink')}</h2>
                  <p className="text-slate-400 text-xs mt-2 opacity-75">{isCustomMode ? t('home.save_for_quick_use') : t('home.choose_drink_type')}</p>
                </div>
                <button onClick={() => { setIsDrinkMenuOpen(false); setIsCustomMode(false); }} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white active:scale-90 transition-all border border-white/10">
                  <X size={18} />
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {isCustomMode ? (
                  <motion.div key="custom-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4 mb-2">
                    <input 
                      type="text" 
                      value={customName} 
                      onChange={(e) => setCustomName(e.target.value)} 
                      placeholder={t('home.drink_name_placeholder')} 
                      className="w-full bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all" 
                    />
                    <div className="bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4.5">
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('volume')}</label>
                        <span className="text-2xl font-black text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-lg">{customVolume}ml</span>
                      </div>
                      <input type="range" min="50" max="1000" step="10" value={customVolume} onChange={(e) => setCustomVolume(Number(e.target.value))} className="w-full accent-cyan-500 h-2.5 bg-slate-900/60 rounded-full appearance-none cursor-pointer" />
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-md border border-white/15 rounded-2xl p-4.5">
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('home.hydration_factor')}</label>
                        <span className="text-lg font-black text-white bg-cyan-500/15 px-3 py-1 rounded-lg">{customFactor.toFixed(1)}x</span>
                      </div>
                      <input type="range" min="-1.0" max="2.0" step="0.1" value={customFactor} onChange={(e) => setCustomFactor(Number(e.target.value))} className="w-full accent-cyan-500 h-2.5 bg-slate-900/60 rounded-full appearance-none cursor-pointer" />
                    </div>
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => setIsCustomMode(false)} className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20 text-slate-200 font-semibold hover:bg-white/15 active:scale-95 transition-all">{t('home.back')}</button>
                      <button 
                        onClick={() => {
                          if(!customName.trim()) { toast.error(t('home.enter_drink_name')); return; }
                          const newDrink = {
                            id: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            name: customName.trim(),
                            amount: customVolume,
                            factor: customFactor,
                            icon: 'Droplet',
                            bg: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
                            color: 'text-indigo-400'
                          };
                          if (editingDrinkId) {
                            updateDrink(editingDrinkId, { name: customName.trim(), amount: customVolume, factor: customFactor });
                            toast.success(t('home.drink_updated'));
                          } else {
                            addDrink(newDrink);
                            handleAddWater(customVolume, customFactor, customName.trim());
                          }
                          setIsCustomMode(false);
                          setIsDrinkMenuOpen(false);
                        }} 
                        className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold hover:from-cyan-400 hover:to-blue-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                      >
                        {editingDrinkId ? t('home.save_changes') : t('home.save_and_add')}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="grid-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="grid grid-cols-3 gap-3 mb-3 max-h-[50vh] overflow-y-auto scrollbar-hide pb-4 pt-1 px-0.5">
                    {(drinkGridList.length > 0 ? drinkGridList : DEFAULT_GRID_DRINKS).map((drink, index) => (
                      <div key={drink.id || `fallback-drink-grid-${index}`} className="relative h-full group">
                        <button
                          onClick={() => {
                            handleAddWater(drink.amount || 250, drink.factor, drink.name);
                            setIsDrinkMenuOpen(false);
                            toast.success(t('home.added_drink', { amount: drink.amount || 250, name: drink.name }));
                          }}
                          className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ease-out active:scale-95 hover:scale-105 ${drink.bg} shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]`}
                        >
                          <div className="mb-2.5 group-hover:scale-120 transition-transform">{renderIcon(drink.icon, { size: 26, className: drink.color })}</div>
                          <span className="text-white text-xs font-bold w-full text-center truncate leading-tight">{drink.name}</span>
                          <span className="text-slate-300 text-[9px] mt-1 font-semibold opacity-75">{(drink.factor > 0 ? '+' : '') + drink.factor.toFixed(1)}x</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDrinkId(drink.id);
                            setCustomName(drink.name);
                            setCustomVolume(drink.amount || 250);
                            setCustomFactor(drink.factor);
                            setIsCustomMode(true);
                          }}
                          className="absolute -top-1.5 right-7 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all z-10 shadow-lg"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
const { confirmDialog } = await import('@/store/useConfirmDialog');
                             const ok = await confirmDialog({ title: t('home.delete_drink'), message: t('home.delete_drink_confirm', { name: drink.name }), confirmLabel: t('home.delete'), variant: 'danger' });
                            if (ok) deleteDrink(drink.id);
                          }}
                          className="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all z-10 shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => { setEditingDrinkId(null); setCustomName(''); setCustomVolume(250); setCustomFactor(1.0); setIsCustomMode(true); }}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/50 border border-white/5 border-dashed hover:bg-white/5 transition-all active:scale-95 h-full"
                    >
                      <Plus size={24} className="text-slate-400 mb-2" />
                      <span className="text-sm font-semibold text-slate-300">{t('home.custom')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
                <div className="pt-4 mt-auto border-t border-white/5">
                  <button onClick={() => setIsDrinkMenuOpen(false)} className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 active:scale-95 transition-all">
                    {t('home.done')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {profile && (
        <LevelDetailModal isOpen={showLevelDetail} onClose={() => setShowLevelDetail(false)} level={profile.level || 1} exp={profile.total_exp || 0} />
      )}

      <HydrationGoalModal isOpen={showGoalDetail} onClose={() => setShowGoalDetail(false)} waterIntake={waterIntake} hydrationResult={hydrationResult} />
    </div>
  );
});

export default HomeTab;

export { renderIcon, presetStyles };