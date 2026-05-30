import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Gauge, Thermometer, Wifi, Cpu, Waves, Heart, Sparkles, Zap, Activity, Play } from 'lucide-react';
import type { LedPattern, RuleTrigger, RuleAction, AutomationRule } from './types';
import { ledColors, ruleActionLabel } from './constants';
import { AuraPulseEffect } from './effects/AuraPulseEffect';

// ============================================================================
// INTERFACES
// ============================================================================
export interface DiagnosticsPanelProps {
  isConnected: boolean;
  batteryLevel: number;
  batteryHealth: number;
  batteryCycleCount: number;
  latencyMs: number;
  rawSensorSeries: number[];
  temperature: number;
  signalStrength: number;
  healthScore?: number;
  isOpen: boolean;
  onToggle: () => void;
  isDemoMode?: boolean;
  simulateAttackType?: 'none' | 'replay' | 'tampering';
  setSimulateAttackType?: (type: 'none' | 'replay' | 'tampering') => void;
}

export interface LedPatternStudioProps {
  ledColor: string;
  setLedColor: React.Dispatch<React.SetStateAction<string>>;
  ledPattern: LedPattern;
  setLedPattern: React.Dispatch<React.SetStateAction<LedPattern>>;
  heartRate: number;
  isWatchConnected: boolean;
  isConnected: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export interface AutomationCenterProps {
  ruleTrigger: RuleTrigger;
  setRuleTrigger: React.Dispatch<React.SetStateAction<RuleTrigger>>;
  ruleAction: RuleAction;
  setRuleAction: React.Dispatch<React.SetStateAction<RuleAction>>;
  ruleTime: string;
  setRuleTime: React.Dispatch<React.SetStateAction<string>>;
  ruleThreshold: number;
  setRuleThreshold: React.Dispatch<React.SetStateAction<number>>;
  addAutomationRule: () => void;
  rules: Array<AutomationRule & { status?: string }>;
  setRules: React.Dispatch<React.SetStateAction<AutomationRule[]>>;
  weatherData?: Record<string, unknown>;
  isWeatherSynced: boolean;
  fillPercentage: number;
  isOpen: boolean;
  onToggle: () => void;
}


// ============================================================================
// METRIC CARD
// ============================================================================
export function MetricCard({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: string; hint: string; accent: 'cyan' | 'violet' | 'amber' | 'emerald'; }) {
  const accentColors = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]',
    violet: 'text-violet-400 border-violet-500/20 bg-violet-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
  };

  return (
    <div className={`min-w-[12rem] snap-start rounded-3xl border p-5 backdrop-blur-md relative overflow-hidden group transition-all hover:bg-slate-900/40 ${accentColors[accent]}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="w-11 h-11 rounded-2xl border border-white/10 bg-slate-950/40 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black relative z-10">{label}</p>
      <p className="text-2xl font-black text-white mt-1.5 tracking-tight relative z-10">{value}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium relative z-10 opacity-70">{hint}</p>
      <div className="absolute bottom-0 left-0 w-full h-px bg-white/5" />
    </div>
  );
}

// ============================================================================
// SENSOR WAVE CHART
// ============================================================================
export function SensorWaveChart({ series, isConnected }: { series: number[]; isConnected: boolean }) {
  const width = 640; const height = 180;
  const points = series.map((value, index) => `${(index / Math.max(series.length - 1, 1)) * width},${height - (value / 100) * (height - 30) - 15}`).join(' ');
  
  return (
    <div className="rounded-3xl overflow-hidden border border-white/5 bg-slate-950/60 relative group">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 relative z-10">
        <defs>
          <linearGradient id="sensor-line-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {Array.from({ length: 4 }).map((_, index) => (
          <line key={`grid-${index}`} x1="0" x2={width} y1={(height / 4) * (index + 1)} y2={(height / 4) * (index + 1)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 6" />
        ))}
        <polyline fill="none" stroke="url(#sensor-line-grad)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} filter="url(#glow)" />
      </svg>
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-black tracking-widest uppercase relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-600'}`} />
          <span className={isConnected ? 'text-cyan-300' : 'text-slate-500'}>{isConnected ? 'Stream Active' : 'Sensor Sleeping'}</span>
        </div>
        <span className="text-white/20">Protocol X-10</span>
      </div>
    </div>
  );
}

// ============================================================================
// DIAGNOSTICS PANEL
// ============================================================================
export function DiagnosticsPanel({ isConnected, batteryHealth, batteryCycleCount, latencyMs, rawSensorSeries, temperature, signalStrength, healthScore = 100, isOpen, onToggle, isDemoMode, simulateAttackType, setSimulateAttackType }: DiagnosticsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden transition-all hover:border-white/10">
      <button onClick={onToggle} className="w-full p-6 flex items-center justify-between gap-4 text-left group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Gauge size={24} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70 font-black">Core Diagnostics</p>
            <h3 className="text-xl font-black text-white mt-1">Hệ thống & Cảm biến</h3>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5">
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 space-y-6">
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x scrollbar-hide">
                <MetricCard icon={<Activity size={20} />} label={t('lab.health_label')} value={`${batteryHealth}%`} hint={`Cycles: ${batteryCycleCount}`} accent="cyan" />
                <MetricCard icon={<Zap size={20} />} label={t('lab.latency_label')} value={latencyMs > 0 ? `${latencyMs}ms` : '--'} hint="BLE Response" accent="violet" />
                <MetricCard icon={<Thermometer size={20} />} label={t('lab.temp_label')} value={`${temperature}°C`} hint="Board Core" accent="amber" />
                <MetricCard icon={<Wifi size={20} />} label={t('lab.signal_label')} value={`${signalStrength}%`} hint={`${t('lab.good_signal')}: ${healthScore}%`} accent="emerald" />
              </div>
              <div className="rounded-[2rem] border border-white/5 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Activity size={16} className="text-cyan-400" /><span className="text-xs font-black text-white tracking-widest uppercase">Motion Analytics</span></div>
                  <span className="text-[10px] text-slate-500 font-bold">120HZ POLLING</span>
                </div>
                <SensorWaveChart series={rawSensorSeries} isConnected={isConnected} />
              </div>

              {isDemoMode && isConnected && setSimulateAttackType && (
                <div className="rounded-[2rem] border border-red-500/20 bg-red-950/5 p-5 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-red-400 animate-pulse" />
                      <span className="text-xs font-black text-white tracking-widest uppercase">Trình Giả Lập Tấn Công BLE</span>
                    </div>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Debug Mode Only</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                    Giả lập các kịch bản tấn công bảo mật để xác thực tính toàn vẹn của cơ chế chống phát lại (Replay protection) và chữ ký (HMAC-SHA256) trên database.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSimulateAttackType('replay')}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                        simulateAttackType === 'replay'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'
                      }`}
                    >
                      Replay Attack
                    </button>
                    <button
                      onClick={() => setSimulateAttackType('tampering')}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                        simulateAttackType === 'tampering'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'
                      }`}
                    >
                      Tamper Packet
                    </button>
                    <button
                      onClick={() => setSimulateAttackType('none')}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                        simulateAttackType === 'none'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'
                      }`}
                    >
                      Safe Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// LED PATTERN STUDIO
// ============================================================================
export function LedPatternStudio({ ledColor, setLedColor, ledPattern, setLedPattern, isWatchConnected, isOpen, onToggle }: LedPatternStudioProps) {
  const patterns: { id: LedPattern; name: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'breathe', name: 'Breathe', icon: Waves },
    { id: 'wave', name: 'Flowing', icon: Play },
    { id: 'strobe', name: 'Alert', icon: Zap },
    { id: 'heart-sync', name: 'Heart', icon: Heart }
  ];

  return (
    <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-6 flex items-center justify-between gap-4 text-left group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 group-hover:scale-110 transition-transform">
            <Sparkles size={24} className="text-fuchsia-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-400/70 font-black">Chroma Control</p>
            <h3 className="text-xl font-black text-white mt-1">Aura Studio</h3>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5">
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 space-y-6">
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {patterns.map(p => (
                  <button key={p.id} disabled={p.id === 'heart-sync' && !isWatchConnected} onClick={() => setLedPattern(p.id)} className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${ledPattern === p.id ? 'bg-fuchsia-500/20 border-fuchsia-400/40 text-white' : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10'}`}>
                    <p.icon size={16} className={ledPattern === p.id ? 'text-fuchsia-400' : ''} /><span className="text-xs font-black tracking-tight">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-[2rem] border border-white/5 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Palettes</span><div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: ledColor, backgroundColor: ledColor }} /></div>
                <div className="grid grid-cols-6 gap-3">
                  {ledColors.map(c => (
                    <button key={c.value} onClick={() => setLedColor(c.value)} className={`h-10 rounded-xl border transition-all active:scale-90 ${ledColor === c.value ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/5'}`} style={{ backgroundColor: c.value }} />
                  ))}
                </div>
              </div>
              <div className="relative h-44 rounded-[2.5rem] bg-slate-950/60 border border-white/5 flex items-center justify-center overflow-hidden">
                <AuraPulseEffect color={ledColor} size="lg" intensity={1.5} className="absolute" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-32 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl relative overflow-hidden">
                    <motion.div className="absolute inset-0 opacity-40" animate={{ opacity: [0.2, 0.6, 0.2], backgroundColor: ledColor }} transition={{ duration: 2, repeat: Infinity }} />
                  </div>
                  <span className="mt-3 text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">Visual Preview</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// AUTOMATION CENTER
// ============================================================================
export function AutomationCenter({ ruleTrigger, setRuleTrigger, ruleAction, setRuleAction, ruleTime, setRuleTime, ruleThreshold, setRuleThreshold, addAutomationRule, rules, setRules, isOpen, onToggle }: AutomationCenterProps) {
  return (
    <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-6 flex items-center justify-between gap-4 text-left group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform"><Cpu size={24} className="text-amber-400" /></div>
          <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70 font-black">Logic Engine</p><h3 className="text-xl font-black text-white mt-1">Smart Rules</h3></div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5"><ChevronDown size={20} className="text-slate-400" /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 space-y-6">
              <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 relative">
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-400">1</div><span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">XÁC ĐỊNH ĐIỀU KIỆN</span></div>
                    <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value as RuleTrigger)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-amber-500/30 transition-all appearance-none">
                      <option value="goal_time">Qua mốc giờ chưa đạt mục tiêu</option><option value="weather_temp">Nhiệt độ ngoài trời quá cao</option><option value="low_battery">Pin xuống mức thấp</option>
                    </select>
                  </div>
                  <div className="flex justify-center py-1"><div className="w-px h-8 bg-gradient-to-b from-amber-500/40 to-cyan-500/40" /></div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-black text-cyan-400">2</div><span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">KÍCH HOẠT HÀNH ĐỘNG</span></div>
                    <select value={ruleAction} onChange={(e) => setRuleAction(e.target.value as RuleAction)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-cyan-500/30 transition-all appearance-none">
                      <option value="red_strobe">Nháy đỏ (Cảnh báo mạnh)</option><option value="boost_reminders">Nhắc nhở dồn dập</option><option value="cyan_wave">Sóng xanh (Nhẹ nhàng)</option><option value="power_save">Bật tiết kiệm Pin</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-4">
                    <div className="space-y-2"><span className="text-[10px] text-slate-500 font-black uppercase">Parameter</span>{ruleTrigger === 'goal_time' ? (<input value={ruleTime} onChange={(e) => setRuleTime(e.target.value)} type="time" className="w-full bg-transparent border-none text-white font-black outline-none" />) : (<div className="flex items-center gap-1"><input value={ruleThreshold} onChange={(e) => setRuleThreshold(Number(e.target.value))} type="number" className="w-12 bg-transparent border-none text-white font-black outline-none" /><span className="text-slate-500 text-xs">{ruleTrigger === 'weather_temp' ? '°C' : '%'}</span></div>)}</div>
                    <div className="space-y-2 text-right"><span className="text-[10px] text-slate-500 font-black uppercase">Status</span><p className="text-emerald-400 font-black text-xs uppercase">Validated</p></div>
                  </div>
                  <button onClick={addAutomationRule} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm tracking-tight active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]">Deploy Smart Rule</button>
                </div>
              </div>
              <div className="space-y-3">
                {rules.map((rule: AutomationRule & { description: string }) => (
                  <div key={rule.id} className="rounded-3xl border border-white/5 bg-slate-950/40 p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.active ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}><Zap size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight">{rule.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{ruleActionLabel[rule.action as RuleAction]}</p>
                      </div>
                    </div>
                    <button onClick={() => setRules((prev: AutomationRule[]) => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))} className={`w-12 h-6 rounded-full relative transition-all ${rule.active ? 'bg-amber-500' : 'bg-slate-800'}`}><motion.div animate={{ x: rule.active ? 24 : 4 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg" /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}