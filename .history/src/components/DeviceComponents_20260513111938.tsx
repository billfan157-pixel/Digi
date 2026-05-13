import React from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, RefreshCw, LogOut, Droplet, GlassWater, Zap, Lock, ChevronRight, Activity, Battery, Thermometer, Wifi } from 'lucide-react';
import { getBatteryIcon, CAPACITY } from './constants';

// ============================================================================
// METRIC MINI COMPONENT (CYBER UPGRADE)
// ============================================================================
export function MetricMini({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 transition-all hover:bg-slate-900/60 hover:border-cyan-500/30">
      {/* Subtle background glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

      <div className="relative flex flex-col items-center text-center">
        {Icon && <Icon size={12} className="text-slate-500 mb-1.5 group-hover:text-cyan-400 transition-colors" />}
        <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-black leading-none">{label}</p>
        <p className="text-sm font-black text-white mt-1.5 tracking-tight group-hover:text-cyan-100 transition-colors">{value}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-cyan-400 group-hover:w-1/2 transition-all duration-300" />
    </div>
  );
}

// ============================================================================
// HYDRATESPARK PRO BOTTLE
// ============================================================================
function HydrateSparkBottle({
  fillPercentage,
  isConnected
}: {
  fillPercentage: number;
  isConnected: boolean;
}) {
  const fillPct = isConnected ? Math.min(Math.max(fillPercentage, 0), 100) : 0;
  const isLowWater = fillPct < 20 && isConnected;

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* ── Flip-top Cap ── */}
      <div className="relative z-20 mb-1 w-16 h-10">
        {/* Cap body */}
        <div className="absolute bottom-0 left-0 right-0 h-8 rounded-t-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border border-white/10 border-b-0 shadow-lg">
          {/* Cap ridge lines */}
          <div className="absolute inset-x-2 top-1.5 space-y-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[1.5px] bg-white/5 rounded-full" />
            ))}
          </div>
          {/* Highlight */}
          <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-white/25 to-transparent rounded-full blur-[0.5px]" />
        </div>
        {/* Flip-top lid */}
        <div className="absolute -top-0.5 left-0 right-0 mx-auto w-14 h-4 rounded-t-lg bg-gradient-to-b from-slate-600 to-slate-700 border border-white/10 border-b-0">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-white/10 rounded-full" />
        </div>
        {/* Cap hinge */}
        <div className="absolute top-2.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-white/10" />
      </div>

      {/* ── Bottle Body ── */}
      <div className="relative w-28 flex-1 min-h-0">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]">
          {/* Glass reflections */}
          <div
            className="absolute left-0 top-2 bottom-2 w-10 rounded-l-2xl pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, transparent 70%)'
            }}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-8 rounded-r-2xl pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, transparent 70%)'
            }}
          />
          <div className="absolute left-5 top-8 bottom-8 w-1.5 bg-gradient-to-b from-transparent via-white/25 to-transparent rounded-full blur-[1px] pointer-events-none z-20" />

          {/* ── ml Marker Lines ── */}
          {[250, 500, 750].map((ml) => {
            const posPct = (ml / 750) * 100;
            return (
              <div
                key={ml}
                className="absolute right-4 flex items-center gap-2 pointer-events-none z-20"
                style={{ bottom: `${posPct}%` }}
              >
                <span className="text-[8px] font-bold text-white/25 tracking-wider leading-none">{ml}</span>
                <div className="h-px w-5 bg-white/15" />
              </div>
            );
          })}

          {/* ── Water Fill ── */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-b-2xl overflow-hidden"
            initial={false}
            animate={{ height: `${fillPct}%` }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Water gradient body */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.7) 15%, rgba(59,130,246,0.75) 50%, rgba(30,64,175,0.85) 100%)'
              }}
            />
            {/* Water inner glow */}
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle at 35% 30%, rgba(96,165,250,0.45) 0%, transparent 65%)',
                mixBlendMode: 'plus-lighter'
              }}
            />
            {/* Bubbles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30"
                style={{
                  left: `${15 + (i * 22)}%`,
                  bottom: `${10 + (i * 18)}%`
                }}
                animate={{
                  y: [-3, 3, -3],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 2 + i * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4
                }}
              />
            ))}

            {/* ── Wave Surface ── */}
            <div className="absolute top-0 left-0 right-0 h-5 overflow-visible">
              {/* Wave layer 1 (fast) */}
              <motion.div
                className="absolute top-0 left-0 w-[200%] h-full"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              >
                <svg className="w-full h-full text-cyan-400/90" viewBox="0 0 800 40" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,20 Q100,5 200,20 T400,20 T600,20 T800,20 L800,40 L0,40 Z" />
                </svg>
              </motion.div>
              {/* Wave layer 2 (slow, deeper) */}
              <motion.div
                className="absolute top-1 left-0 w-[200%] h-full opacity-60"
                animate={{ x: ['-50%', '0%'] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: 'linear' }}
              >
                <svg className="w-full h-full text-cyan-300/70" viewBox="0 0 800 40" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,25 Q150,10 300,25 T600,25 T900,25 L900,40 L0,40 Z" />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottle shape outline */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/10 z-10" />
        </div>
      </div>

      {/* ── LED Base Glow (HydrateSpark Signature) ── */}
      <div className="relative z-10 -mt-1">
        {/* LED base bar */}
        <div className="relative w-32 h-5 rounded-b-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 border-t-0 overflow-hidden shadow-lg">
          {/* LED glow strip */}
          <motion.div
            className="absolute inset-0 m-1 rounded-full"
            animate={{
              opacity: isConnected ? [0.6, 1, 0.6] : 0.3,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: isLowWater
                ? 'linear-gradient(to right, transparent, rgba(251,191,36,0.7), rgba(251,191,36,1), rgba(251,191,36,0.7), transparent)'
                : 'linear-gradient(to right, transparent, rgba(34,211,238,0.6), rgba(34,211,238,1), rgba(34,211,238,0.6), transparent)',
              boxShadow: isLowWater
                ? '0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.3)'
                : '0 0 20px rgba(34,211,238,0.5), 0 0 40px rgba(34,211,238,0.25)'
            }}
          />
        </div>
        {/* Glow projection on surface */}
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-3 rounded-[50%]"
          animate={{
            opacity: isConnected ? [0.3, 0.6, 0.3] : 0.15,
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: isLowWater
              ? 'radial-gradient(ellipse at center, rgba(251,191,36,0.6) 0%, transparent 80%)'
              : 'radial-gradient(ellipse at center, rgba(34,211,238,0.5) 0%, transparent 80%)',
            filter: 'blur(6px)'
          }}
        />
      </div>

      {/* ── Bottle Shadow ── */}
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 rounded-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 80%)',
          filter: 'blur(6px)'
        }}
      />
    </div>
  );
}

// ============================================================================
// BOTTLE VISUALIZER
// ============================================================================
export function BottleVisualizer({
  isConnected, currentVolume, capacity, fillPercentage, equippedBottle
}: {
  isConnected: boolean; currentVolume: number; capacity: number; fillPercentage: number; equippedBottle: any;
}) {
  return (
    <div className="flex justify-center items-center py-6 relative h-[320px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative w-48 h-full"
      >
        <HydrateSparkBottle fillPercentage={fillPercentage} isConnected={isConnected} />

        {/* Holographic Volume Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          <motion.div
            key={currentVolume}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            {isConnected ? currentVolume : 0}
          </motion.div>
          <div className="text-[10px] font-black text-cyan-400/70 tracking-[0.2em] mt-1 uppercase">Milliliters</div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
            <div className="text-xs font-bold text-white/40 tracking-wider">/ {capacity}</div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// DEVICE HERO (CYBER UPGRADE)
// ============================================================================
export function DeviceHero({
  isConnected, isSyncing, fillPercentage, currentVolume, batteryLevel, signalStrength, latencyMs, temperature, onConnect, onDisconnect, equippedBottle
}: {
  isConnected: boolean; isSyncing: boolean; fillPercentage: number; currentVolume: number; batteryLevel: number; signalStrength: number; latencyMs: number; temperature: number; onConnect: () => void; onDisconnect: () => void; equippedBottle: any;
}) {
  return (
    <div className="space-y-4">
      {/* Connectivity Status Orb */}
      <div className="group relative rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl p-5 overflow-hidden transition-all hover:bg-slate-900/60 hover:border-cyan-500/20">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.15)]' : 'bg-slate-900/80 border-white/5 text-slate-500'}`}>
              <Bluetooth size={24} className={isSyncing ? 'animate-pulse' : ''} />
              {isConnected && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {isConnected ? 'DigiBottle Pro' : 'Device Offline'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                  {isConnected ? 'ENCRYPTED LINK' : 'READY TO PAIR'}
                </span>
                {isConnected && <span className="text-[10px] text-slate-500 font-bold tracking-widest">{signalStrength}% RSSI</span>}
              </div>
            </div>
          </div>

          <button
            onClick={isConnected ? onDisconnect : onConnect}
            className={`h-11 px-6 rounded-2xl font-black text-xs tracking-widest uppercase transition-all active:scale-95 ${isConnected
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.4)]'
              }`}
          >
            {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : isConnected ? 'Eject' : 'Link'}
          </button>
        </div>
      </div>

      {/* Main Visualizer Deck */}
      <div className="relative rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl p-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute bottom-4 right-6 text-[8px] font-black text-white/5 tracking-[0.5em] uppercase pointer-events-none">Hardware Protocol v2.4</div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Live Telemetry</span>
          </div>
          <span className="text-[10px] font-black text-white/30 tracking-widest">{latencyMs > 0 ? `${latencyMs}ms PING` : '----'}</span>
        </div>

        <BottleVisualizer isConnected={isConnected} currentVolume={currentVolume} capacity={CAPACITY} fillPercentage={fillPercentage} equippedBottle={equippedBottle} />

        <div className="grid grid-cols-3 gap-3 mt-4">
          <MetricMini label="Charge" value={`${batteryLevel}%`} icon={Battery} />
          <MetricMini label="Liquid" value={`${temperature}°C`} icon={Thermometer} />
          <MetricMini label="Signal" value={isConnected ? 'Excellent' : '---'} icon={Wifi} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTROL DECK (CYBER UPGRADE)
// ============================================================================
export function ControlDeck({
  isConnected, isSyncing, onDrink, onRefill, onForceSync,
}: {
  isConnected: boolean; isSyncing: boolean; onDrink: (amount: number) => void; onRefill: () => void; onForceSync: () => void;
}) {
  const controls = [
    { id: 'sip-50', label: 'SIP', sub: '+50ml', icon: <Droplet size={22} />, color: '#22d3ee', onClick: () => onDrink(50) },
    { id: 'sip-250', label: 'GULP', sub: '+250ml', icon: <GlassWater size={22} />, color: '#3b82f6', onClick: () => onDrink(250) },
    { id: 'refill', label: 'REFILL', sub: 'Fill Tank', icon: <RefreshCw size={22} />, color: '#10b981', onClick: onRefill },
    { id: 'sync', label: 'BOOST', sub: 'Overclock', icon: <Zap size={22} />, color: '#d946ef', onClick: onForceSync },
  ];

  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">Manual Overrides</p>
          <h3 className="text-xl font-black text-white mt-1">Hệ thống nạp</h3>
        </div>
        <Activity size={18} className="text-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {controls.map(control => (
          <motion.button
            key={control.id}
            whileTap={{ scale: 0.95 }}
            disabled={!isConnected || isSyncing}
            onClick={control.onClick}
            className="group relative rounded-3xl border border-white/5 bg-slate-950/40 p-5 text-left transition-all hover:bg-slate-900/60 hover:border-white/10 disabled:opacity-40"
          >
            {/* Action color glow */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"
              style={{ background: control.color }}
            />

            <div className="flex items-center justify-between mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-slate-900 shadow-inner group-hover:scale-110 transition-transform"
                style={{ color: control.color }}
              >
                {control.icon}
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>

            <p className="text-sm font-black text-white tracking-wider">{control.label}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-bold tracking-widest uppercase">{control.sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ARENA PAYWALL
// ============================================================================
export const ArenaPaywall = () => (
  <div className="relative h-[60vh] rounded-[2.5rem] overflow-hidden border border-white/5 mx-4 flex items-center justify-center mt-6">
    <div className="absolute inset-0 p-6 space-y-4 blur-[8px] opacity-30 pointer-events-none select-none flex flex-col">
      {[1, 2, 3, 4].map((index) => (<div key={index} className="h-28 bg-slate-800 rounded-3xl border border-slate-700" />))}
    </div>
    <div className="relative z-10 flex flex-col items-center text-center p-10 bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl mx-6 w-full max-w-[340px]">
      <div className="relative w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 group">
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
        <Lock size={40} className="text-indigo-400 relative z-10" />
      </div>
      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Khu vực hạn chế</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">Đấu trường DigiBottle yêu cầu phụ kiện kết nối vật lý và xác thực phần cứng Pro-Link.</p>
      <div className="w-full py-4 rounded-2xl font-black text-[10px] text-indigo-300 bg-indigo-500/5 border border-indigo-500/20 uppercase tracking-[0.2em]">
        CHƯA PHÁT HÀNH CÔNG KHAI
      </div>
    </div>
  </div>
);
