import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Bluetooth, RefreshCw, LogOut, Droplet, GlassWater, Zap, Lock, ChevronRight, Activity, Battery, Thermometer, Wifi, FlaskConical, Trophy, ArrowLeft, Layers, Sliders, Box, Sparkles, Cpu } from 'lucide-react';
import { DeviceHero, ControlDeck, ArenaPaywall } from '../components/DeviceComponents';
import { DiagnosticsPanel, LedPatternStudio, AutomationCenter } from '../components/LabComponents';
import type { LedPattern, RuleTrigger, RuleAction, AutomationRule } from '../components/types';
import { AuraPulseEffect } from '../components/effects/AuraPulseEffect';

export default function BottleTab({
  profile,
  weatherData,
  isWeatherSynced,
  watchData,
  isWatchConnected,
  smartBottle,
  onBack,
}: {
  profile: any;
  weatherData: any;
  isWeatherSynced: boolean;
  watchData: any;
  isWatchConnected: boolean;
  smartBottle: any;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'lab' | 'arena'>('lab');
  const [labTab, setLabTab] = useState<'control' | 'diagnostics' | 'aura' | 'logic'>('control');
  
  // Local state for Demo/Lab controls
  const CAPACITY = 750;
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(smartBottle?.isConnected || false);
  const [currentVolume, setCurrentVolume] = useState(smartBottle?.metrics?.currentVolume ?? CAPACITY);
  const [fillPercentage, setFillPercentage] = useState(
    smartBottle?.metrics?.currentVolume != null ? (smartBottle.metrics.currentVolume / CAPACITY) * 100 : 100
  );
  const [batteryLevel, setBatteryLevel] = useState(smartBottle?.metrics?.batteryLevel ?? 84);
  const [temperature, setTemperature] = useState(smartBottle?.metrics?.temperature ?? 24);
  const [latencyMs, setLatencyMs] = useState(24);
  const [signalStrength, setSignalStrength] = useState(smartBottle?.metrics?.signalStrength ?? 92);
  const [rawSensorSeries, setRawSensorSeries] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 100));

  // LED & Automation state
  const [ledColor, setLedColor] = useState('#22d3ee');
  const [ledPattern, setLedPattern] = useState<LedPattern>('breathe');
  const [ruleTrigger, setRuleTrigger] = useState<RuleTrigger>('goal_time');
  const [ruleAction, setRuleAction] = useState<RuleAction>('red_strobe');
  const [ruleTime, setRuleTime] = useState('20:00');
  const [ruleThreshold, setRuleThreshold] = useState(50);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  // Sync from props (useSmartBottle returns metrics.currentVolume, not top-level)
  useEffect(() => {
    if (smartBottle) {
      setIsConnected(smartBottle.isConnected);
      const vol = smartBottle.metrics?.currentVolume ?? currentVolume;
      setCurrentVolume(vol);
      setFillPercentage((vol / CAPACITY) * 100);
      if (smartBottle.metrics?.batteryLevel != null) setBatteryLevel(smartBottle.metrics.batteryLevel);
      if (smartBottle.metrics?.temperature != null) setTemperature(smartBottle.metrics.temperature);
      if (smartBottle.metrics?.signalStrength != null) setSignalStrength(smartBottle.metrics.signalStrength);
    }
  }, [smartBottle]);

  // Handle drink simulation
  const handleDrink = (amount: number) => {
    if (!isConnected) return;
    setIsSyncing(true);
    setTimeout(() => {
      const newVol = Math.max(0, currentVolume - amount);
      setCurrentVolume(newVol);
      setFillPercentage((newVol / CAPACITY) * 100);
      setIsSyncing(false);
      setSyncLogs(prev => [...prev, { id: Date.now(), action: `Consumed ${amount}ml`, timestamp: new Date().toISOString() }]);
    }, 800);
  };

  const handleRefill = () => {
    if (!isConnected) return;
    setIsSyncing(true);
    setTimeout(() => {
      setCurrentVolume(CAPACITY);
      setFillPercentage(100);
      setIsSyncing(false);
      setSyncLogs(prev => [...prev, { id: Date.now(), action: 'Tank Refilled (100%)', timestamp: new Date().toISOString() }]);
    }, 1200);
  };

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
              <h1 className="text-xl font-black text-white tracking-tight mt-0.5">Control Center</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Identity</p>
              <p className="text-xs font-black text-white">{profile?.nickname || 'Cyber User'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl border-2 border-cyan-400/30 overflow-hidden bg-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <img src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber'} className="w-full h-full object-cover" alt="User" />
            </div>
          </div>
        </div>

        {/* 2. Main Tab Navigator */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 mt-6 relative z-10">
          <button 
            onClick={() => setActiveTab('lab')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'lab' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <FlaskConical size={16} />
            <span>Phòng Lab</span>
          </button>
          <button 
            onClick={() => setActiveTab('arena')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'arena' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Trophy size={16} />
            <span>Đấu trường</span>
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
                onConnect={() => setIsConnected(true)}
                onDisconnect={() => setIsConnected(false)}
                equippedBottle={null}
              />

              {/* Lab Sub-navigation (Glass Bubbles) */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {[
                  { id: 'control', label: 'Hệ thống', icon: Box },
                  { id: 'diagnostics', label: 'Cảm biến', icon: Activity },
                  { id: 'aura', label: 'Ánh sáng', icon: Sparkles },
                  { id: 'logic', label: 'Tự động', icon: Cpu }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setLabTab(item.id as any)}
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
                      onDrink={handleDrink}
                      onRefill={handleRefill}
                      onForceSync={() => {}}
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
                      isOpen={true}
                      onToggle={() => {}}
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
                      heartRate={watchData?.heartRate || 72}
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
