import React from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, RefreshCw, Droplet, GlassWater, Zap, Lock, ChevronRight, Activity, Battery, Thermometer, Wifi } from 'lucide-react';
import { CAPACITY } from './constants';

// ============================================================================
// METRIC MINI COMPONENT (CYBER UPGRADE)
// ============================================================================
export function MetricMini({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
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
// HYDRATESPARK PRO BOTTLE — Inspired by HidrateSpark Steel
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
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {/* ── Complete Bottle Assembly ── */}
      <div className="relative w-[72px] flex-1 max-h-[94%] flex flex-col items-center">

        {/* ═══ 1. FLIP-TOP CAP ASSEMBLY ═══ */}
        <div className="relative z-20 flex-shrink-0 w-[56px] h-[52px] mb-[-2px]">

          {/* Cap top dome (the flip lid) */}
          <div className="absolute top-0 left-[4px] right-[4px] h-[22px] rounded-t-[14px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #8a949e 0%, #6d7680 30%, #5a6370 60%, #4e5862 100%)',
              boxShadow: 'inset 0 2px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.15)'
            }}
          >
            {/* Hinge mechanism */}
            <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[26px] h-[4px] rounded-full"
              style={{
                background: 'linear-gradient(to bottom, #9aa3ad, #737c86)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 1px rgba(0,0,0,0.15)'
              }}
            />
            {/* Flip latch / push button */}
            <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[14px] h-[6px] rounded-[3px]"
              style={{
                background: 'linear-gradient(to bottom, #b0b8c0, #8a929a)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
            />
            {/* Subtle groove line */}
            <div className="absolute bottom-0 left-[6px] right-[6px] h-[1px]"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

          {/* Spout lip (the drink opening visible when open) */}
          <div className="absolute top-[20px] left-[3px] right-[3px] h-[8px]"
            style={{
              background: 'linear-gradient(to bottom, #5a6370 0%, #4e5862 50%, #525b65 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.2)',
              borderRadius: '2px 2px 4px 4px'
            }}
          />

          {/* Cap collar / neck ring (wider, connects to body) */}
          <div className="absolute bottom-0 left-0 right-0 h-[24px] overflow-hidden"
            style={{
              borderRadius: '4px 4px 6px 6px',
              background: 'linear-gradient(to bottom, #6b747e 0%, #5e6770 30%, #535c65 60%, #4a535e 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 6px rgba(0,0,0,0.3)'
            }}
          >
            {/* Ring detail lines */}
            <div className="absolute top-[3px] left-[2px] right-[2px] h-[1px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute bottom-[3px] left-0 right-0 h-[1px]" style={{ background: 'rgba(0,0,0,0.25)' }} />
            {/* Center grip ridge */}
            <div className="absolute top-[8px] left-[3px] right-[3px] h-[6px]"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px)',
                borderRadius: '2px'
              }}
            />
          </div>
        </div>

        {/* ═══ 2. SHOULDER (tapers from cap width to body width) ═══ */}
        <div className="relative flex-shrink-0 w-full h-[18px] -mt-[1px]"
          style={{
            background: 'linear-gradient(to right, #3d424a 0%, #5e6770 12%, #8e98a2 28%, #b5bdc5 42%, #ccd3d9 50%, #b5bdc5 58%, #8e98a2 72%, #5e6770 88%, #3d424a 100%)',
            borderRadius: '3px 3px 0 0',
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)'
          }}
        >
          {/* Shoulder highlight */}
          <div className="absolute left-[22%] top-0 bottom-0 w-[4px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              filter: 'blur(1px)'
            }}
          />
        </div>

        {/* ═══ 3. BRUSHED STEEL BODY (tall cylinder) ═══ */}
        <div className="relative w-full flex-1 min-h-0 overflow-hidden -mt-[1px]"
          style={{
            borderRadius: '2px 2px 0 0',
            background: 'linear-gradient(to right, #3a3f47 0%, #535c65 8%, #6d7680 14%, #8e98a2 24%, #a8b2bb 34%, #bcc4cc 44%, #ccd3d9 50%, #bcc4cc 56%, #a8b2bb 66%, #8e98a2 76%, #6d7680 86%, #535c65 92%, #3a3f47 100%)',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          {/* Brushed metal texture (fine horizontal lines) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.6) 1px, rgba(255,255,255,0.6) 2px)',
              backgroundSize: '100% 2px'
            }}
          />

          {/* Primary specular highlight (left) */}
          <div className="absolute left-[20%] top-[2%] bottom-[2%] w-[5px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 15%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.4) 85%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1.5px)'
            }}
          />

          {/* Secondary specular (right, subtle) */}
          <div className="absolute right-[24%] top-[4%] bottom-[4%] w-[3px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 75%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1px)'
            }}
          />

          {/* Edge darkening (left & right) */}
          <div className="absolute left-0 top-0 bottom-0 w-[6px] pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[6px] pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
          />

          {/* ── Branding (vertical) — "DigiWell" ── */}
          <div className="absolute bottom-[30%] right-[14%] pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <span className="text-[7px] font-black tracking-[0.35em] uppercase"
              style={{ color: 'rgba(55,60,70,0.55)', textShadow: '0 0.5px 0 rgba(255,255,255,0.1)' }}
            >DigiWell</span>
          </div>

          {/* Capacity sub-label */}
          <div className="absolute bottom-[22%] right-[14%] pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <span className="text-[5px] font-bold tracking-wider" style={{ color: 'rgba(55,60,70,0.35)' }}>750 ml</span>
          </div>

          {/* ── Water level indicator (sleek side strip) ── */}
          <div className="absolute left-[12%] top-[8%] bottom-[6%] w-[3.5px] rounded-full overflow-hidden pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.12)' }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              initial={false}
              animate={{ height: `${fillPct}%` }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isLowWater ? [0.6, 1, 0.6] : [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: isLowWater
                    ? 'linear-gradient(to top, #fbbf24, #f59e0b)'
                    : 'linear-gradient(to top, #22d3ee, #06b6d4)',
                  boxShadow: isLowWater
                    ? '0 0 8px rgba(251,191,36,0.8)'
                    : '0 0 8px rgba(34,211,238,0.7)',
                  borderRadius: '2px'
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* ═══ 4. RAINBOW LED BASE (frosted translucent) ═══ */}
        <div className="relative flex-shrink-0 w-[76px] h-[28px] -mt-[1px] z-10">
          {/* Physical base housing */}
          <div className="absolute inset-0 rounded-b-[12px] overflow-hidden"
            style={{
              background: 'linear-gradient(to bottom, #4a535e 0%, #3a3f47 40%, #2e343b 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            {/* Rainbow LED strip — full width, frosted glass look */}
            {isConnected && (
              <motion.div
                className="absolute inset-x-0 bottom-0 h-[22px] rounded-b-[12px]"
                animate={{
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044 0%, #ff4400 10%, #ff8800 18%, #ffcc00 28%, #88ff00 38%, #00ff66 48%, #00ffcc 58%, #0088ff 68%, #4400ff 78%, #8800ff 86%, #cc00ff 93%, #ff0066 100%)',
                  opacity: 0.9
                }}
              />
            )}
            {!isConnected && (
              <div className="absolute inset-x-0 bottom-0 h-[22px] rounded-b-[12px]"
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)'
                }}
              />
            )}
            {/* Frosted glass overlay for LED diffusion */}
            <div className="absolute inset-0 rounded-b-[12px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(50,56,64,0.7) 0%, rgba(50,56,64,0.15) 40%, transparent 70%)',
              }}
            />
            {/* Subtle inner glow on the translucent edge */}
            {isConnected && (
              <div className="absolute inset-x-[2px] bottom-[2px] h-[8px] rounded-b-[10px]"
                style={{
                  background: 'linear-gradient(to top, rgba(255,255,255,0.08), transparent)',
                }}
              />
            )}
          </div>

          {/* Bloom glow beneath base */}
          {isConnected && (
            <>
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80px] h-[20px] rounded-full"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044, #ff8800, #ffcc00, #00ff66, #00ccff, #4400ff, #cc00ff)',
                  filter: 'blur(12px)'
                }}
              />
              {/* Secondary softer glow */}
              <motion.div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[100px] h-[16px] rounded-full"
                animate={{
                  opacity: [0.15, 0.3, 0.15],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044, #ffcc00, #00ff88, #0088ff, #cc00ff)',
                  filter: 'blur(20px)'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Ground shadow ── */}
      <div
        className="w-20 h-3 rounded-full flex-shrink-0 mt-2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 75%)',
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
  isConnected, currentVolume, capacity, fillPercentage
}: {
  isConnected: boolean; currentVolume: number; capacity: number; fillPercentage: number;
}) {
  const displayVolume = isConnected ? currentVolume : 0;
  const pct = isConnected ? Math.round(fillPercentage) : 0;

  return (
    <div className="flex flex-col items-center py-4 relative">
      {/* Bottle Visual */}
      <div className="relative w-48 h-[260px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-full"
        >
          <HydrateSparkBottle fillPercentage={fillPercentage} isConnected={isConnected} />
        </motion.div>
      </div>

      {/* Volume Display — Below bottle, no overlap */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col items-center mt-2"
      >
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={displayVolume}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-black text-white tracking-tighter tabular-nums"
            style={{ textShadow: '0 0 20px rgba(34,211,238,0.3)' }}
          >
            {displayVolume}
          </motion.span>
          <span className="text-sm font-bold text-cyan-400/70 tracking-wider uppercase">ml</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-px w-6 bg-gradient-to-r from-transparent to-white/15" />
          <span className="text-[10px] font-bold text-white/30 tracking-widest tabular-nums">/ {capacity}</span>
          <div className="h-px w-6 bg-gradient-to-l from-transparent to-white/15" />
        </div>

        {/* Fill percentage badge */}
        {isConnected && (
          <div className="mt-2 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15">
            <span className="text-[9px] font-black text-cyan-400/80 tracking-widest uppercase tabular-nums">{pct}% đầy</span>
          </div>
        )}
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
  isConnected: boolean; isSyncing: boolean; fillPercentage: number; currentVolume: number; batteryLevel: number; signalStrength: number; latencyMs: number; temperature: number; onConnect: () => void; onDisconnect: () => void; equippedBottle: Record<string, unknown> | null;
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

        <BottleVisualizer isConnected={isConnected} currentVolume={currentVolume} capacity={CAPACITY} fillPercentage={fillPercentage} />

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
