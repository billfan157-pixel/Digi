import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, FlaskConical, Trophy, ArrowLeft, Box, Sparkles, Cpu, ChevronRight } from 'lucide-react';
import { DeviceHero, ControlDeck, ArenaPaywall } from '../components/DeviceComponents';
import { useUIStore } from '../store/useUIStore';
import { DiagnosticsPanel, LedPatternStudio, AutomationCenter } from '../components/LabComponents';
import type { LedPattern, RuleTrigger, RuleAction, AutomationRule } from '../components/types';
import { AuraPulseEffect } from '../components/effects/AuraPulseEffect';

interface SmartBottleMetrics {
  currentVolume?: number;
  batteryLevel?: number;
  temperature?: number;
  signalStrength?: number;
  latencyMs?: number;
  healthScore?: number;
}

interface SmartBottleProps {
  isConnected?: boolean;
  isSyncing?: boolean;
  metrics?: SmartBottleMetrics;
  connectDevice?: () => Promise<void>;
  disconnectDevice?: () => Promise<void>;
  handleDrinkEvent?: (amount: number) => Promise<void>;
  refillBottle?: () => Promise<void>;
  forceSync?: () => Promise<void>;
  [key: string]: unknown;
}

export default function BottleTab({
  profile,
  weatherData,
  isWeatherSynced,
  watchData,
  isWatchConnected,
  smartBottle,
  onBack,
}: {
  profile: Record<string, unknown>;
  weatherData: Record<string, unknown>;
  isWeatherSynced: boolean;
  watchData: Record<string, unknown>;
  isWatchConnected: boolean;
  smartBottle: SmartBottleProps;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const { setShowMainMenu } = useUIStore();
  const [activeTab, setActiveTab] = useState<'lab' | 'arena'>('lab');
  const [labTab, setLabTab] = useState<'control' | 'diagnostics' | 'aura' | 'logic'>('control');
  
  // Controls derived from smartBottle props
  const CAPACITY = 750;
  const isConnected = Boolean(smartBottle?.isConnected);
  const isSyncing = Boolean(smartBottle?.isSyncing);
  const currentVolume = smartBottle?.metrics?.currentVolume ?? CAPACITY;
  const fillPercentage = (currentVolume / CAPACITY) * 100;
  const batteryLevel = smartBottle?.metrics?.batteryLevel ?? 100;
  const temperature = smartBottle?.metrics?.temperature ?? 24;
  const signalStrength = smartBottle?.metrics?.signalStrength ?? 100;
  const latencyMs = smartBottle?.metrics?.latencyMs ?? 24;
  const healthScore = smartBottle?.metrics?.healthScore ?? 100;
  const [rawSensorSeries] = useState<number[]>(() => 
    Array.from({ length: 20 }, () => Math.random() * 100)
  );

  // LED & Automation state
  const [ledColor, setLedColor] = useState('#22d3ee');
  const [ledPattern, setLedPattern] = useState<LedPattern>('breathe');
  const [ruleTrigger, setRuleTrigger] = useState<RuleTrigger>('goal_time');
  const [ruleAction, setRuleAction] = useState<RuleAction>('red_strobe');
  const [ruleTime, setRuleTime] = useState('20:00');
  const [ruleThreshold, setRuleThreshold] = useState(50);
  const [rules, setRules] = useState<AutomationRule[]>([]);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 selection:text-cyan-200 font-sans relative overflow-hidden pb-32">
      {/* Global Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AuraPulseEffect color={ledColor} size="xl" intensity={0.5} className="absolute -top-40 -left-40" />
        <AuraPulseEffect color={activeTab === 'arena' ? '#a855f7' : ledColor} size="xl" intensity={0.3} className="absolute -bottom-40 -right-40" />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[100px]" />
      </div>

      {/* 1. Cyber Header */}
      <div className="sticky top-0 z-50 px-6 py-6 backdrop-blur-xl border-b border-white/5 bg-slate-950/20">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400 font-black">DigiBottle OS</p>
              <h1 className="text-xl font-black text-white tracking-tight mt-0.5">{t('bottle.control_center') || 'Control Center'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{t('bottle.identity')}</p>
              <p className="text-xs font-black text-white">{String(profile?.nickname || 'Cyber User')}</p>
            </div>
            <button 
              onClick={() => setShowMainMenu(true)}
              className="w-10 h-10 rounded-xl border-2 border-cyan-400/30 overflow-hidden bg-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-90 transition-transform"
            >
              <img src={String(profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber')} className="w-full h-full object-cover" alt="User" />
            </button>
          </div>
        </div>

        {/* 2. Main Tab Navigator */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 mt-6 relative z-10">
          <button 
            onClick={() => setActiveTab('lab')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'lab' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <FlaskConical size={16} />
            <span>{t('bottle.lab')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('arena')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'arena' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Trophy size={16} />
            <span>{t('bottle.arena')}</span>
          </button>
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="relative z-10 px-6 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'lab' ? (
            <motion.div 
              key="lab-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Primary Dashboard Hero */}
              <DeviceHero 
                isConnected={isConnected}
                isSyncing={isSyncing}
                fillPercentage={fillPercentage}
                currentVolume={currentVolume}
                batteryLevel={batteryLevel}
                signalStrength={signalStrength}
                latencyMs={latencyMs}
                temperature={temperature}
                healthScore={healthScore}
                onConnect={smartBottle?.connectDevice || (() => {})}
                onDisconnect={smartBottle?.disconnectDevice || (() => {})}
                pairedDeviceId={smartBottle?.pairedDeviceId as string | null | undefined}
                onUnpair={(smartBottle?.unpairDevice as (() => void) | undefined) ?? undefined}
                bottleAuthKey={smartBottle?.bottleAuthKey as string | null | undefined}
              />

              {!isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-[2.5rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-slate-900/60 p-6 backdrop-blur-3xl shadow-xl flex flex-col gap-4"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
                      <Cpu size={22} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        {t('bottle.exclusive_digiwell')}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5 leading-tight">
                        Pre-order DigiBottle Smart Water Bottle
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed font-medium">
                        {t('bottle.preorder_desc')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => useUIStore.getState().setShowHardwareWaitlist(true)}
                    className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all"
                  >
                    <span>{t('bottle.join_waitlist')}</span>
                    <ChevronRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* Lab Sub-navigation (Glass Bubbles) */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {[
                  { id: 'control', label: 'System', icon: Box },
                  { id: 'diagnostics', label: 'Sensors', icon: Activity },
                  { id: 'aura', label: 'Aura', icon: Sparkles },
                  { id: 'logic', label: 'Auto', icon: Cpu }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setLabTab(item.id as 'control' | 'diagnostics' | 'aura' | 'logic')}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${labTab === item.id ? 'bg-white text-slate-950 border-white font-black' : 'bg-slate-900/40 border-white/5 text-slate-400 font-bold hover:border-white/10'}`}
                  >
                    <item.icon size={14} />
                    <span className="text-xs uppercase tracking-tighter">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Lab Tab Content */}
              <div className="space-y-6">
                {labTab === 'control' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <ControlDeck 
                      isConnected={isConnected}
                      isSyncing={isSyncing}
                      onDrink={smartBottle?.handleDrinkEvent || (() => {})}
                      onRefill={smartBottle?.refillBottle || (() => {})}
                      onForceSync={smartBottle?.forceSync || (() => {})}
                    />
                  </motion.div>
                )}

                {labTab === 'diagnostics' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <DiagnosticsPanel 
                      isConnected={isConnected}
                      batteryLevel={batteryLevel}
                      batteryHealth={98}
                      batteryCycleCount={42}
                      latencyMs={latencyMs}
                      rawSensorSeries={rawSensorSeries}
                      temperature={temperature}
                      signalStrength={signalStrength}
                      healthScore={healthScore}
                      isOpen={true}
                      onToggle={() => {}}
                      isDemoMode={smartBottle?.isDemoMode as boolean | undefined}
                      simulateAttackType={smartBottle?.simulateAttackType as 'none' | 'replay' | 'tampering' | undefined}
                      setSimulateAttackType={smartBottle?.setSimulateAttackType as ((type: 'none' | 'replay' | 'tampering') => void) | undefined}
                    />
                  </motion.div>
                )}

                {labTab === 'aura' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <LedPatternStudio 
                      ledColor={ledColor}
                      setLedColor={setLedColor}
                      ledPattern={ledPattern}
                      setLedPattern={setLedPattern}
                      heartRate={Number(watchData?.heartRate) || 72}
                      isWatchConnected={isWatchConnected}
                      isConnected={isConnected}
                      isOpen={true}
                      onToggle={() => {}}
                    />
                  </motion.div>
                )}

                {labTab === 'logic' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <AutomationCenter 
                      ruleTrigger={ruleTrigger}
                      setRuleTrigger={setRuleTrigger}
                      ruleAction={ruleAction}
                      setRuleAction={setRuleAction}
                      ruleTime={ruleTime}
                      setRuleTime={setRuleTime}
                      ruleThreshold={ruleThreshold}
                      setRuleThreshold={setRuleThreshold}
                      addAutomationRule={() => {}}
                      rules={rules}
                      setRules={setRules}
                      weatherData={weatherData}
                      isWeatherSynced={isWeatherSynced}
                      fillPercentage={fillPercentage}
                      isOpen={true}
                      onToggle={() => {}}
                    />
                  </motion.div>
                )}
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="arena-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ArenaPaywall />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
