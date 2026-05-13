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
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {/* ── Tall Slim Body ── */}
      <div className="relative w-20 flex-1 max-h-[85%] flex flex-col items-center">
        
        {/* Cap - simple flip-top */}
        <div className="relative z-10 flex-shrink-0 w-18 h-8 mb-0.5">
          <div className="absolute bottom-0 left-1 right-1 h-7 rounded-t-lg bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10 border-b-0" />
          <div className="absolute -top-0.5 left-2 right-2 h-3 rounded-t-md bg-gradient-to-b from-slate-600 to-slate-700 border border-white/10 border-b-0" />
        </div>

        {/* Body - colored cylinder (opaque like real HydrateSpark) */}
        <div className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 30%, #1e293b 70%, #0f172a 100%)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {/* Subtle body highlight streak */}
          <div className="absolute left-[10%] top-[8%] bottom-[8%] w-[3px] rounded-full bg-white/8 pointer-events-none" />
          
          {/* ── Water level window (vertical strip) ── */}
          <div className="absolute left-[18%] top-[20%] bottom-[12%] w-[5px] rounded-full overflow-hidden bg-slate-950/60 pointer-events-none">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              initial={false}
              animate={{ height: `${fillPct}%` }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isLowWater ? [0.5, 1, 0.5] : [0.6, 0.9, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: isLowWater
                    ? 'linear-gradient(to top, #fbbf24, #f59e0b)'
                    : 'linear-gradient(to top, #22d3ee, #06b6d4)',
                  boxShadow: isLowWater
                    ? '0 0 12px rgba(251,191,36,0.6)'
                    : '0 0 12px rgba(34,211,238,0.5)'
                }}
              />
            </motion.div>
          </div>

          {/* ── ml markers (tiny dots on body) ── */}
          {[250, 500, 750].map((ml) => {
            const btm = 12 + ((ml / 750) * (100 - 12 - 20));
            return (
              <div
                key={ml}
                className="absolute right-[15%] flex items-center gap-1 pointer-events-none"
                style={{ bottom: `${btm}%` }}
              >
                <div className="w-3 h-px bg-white/10" />
                <span className="text-[7px] font-bold text-white/15 tracking-wider">{ml}</span>
              </div>
            );
          })}
        </div>

        {/* ── LED Ring (thin glowing ring at base - HydrateSpark signature) ── */}
        <div className="relative flex-shrink-0 -mt-[2px] z-10">
          {/* Physical ring base */}
          <div className="w-[82px] h-[6px] rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-white/10" />
          
          {/* Glowing LED ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: isConnected ? [0.5, 1, 0.5] : 0.2 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: isLowWater
                ? 'linear-gradient(to right, transparent 10%, #fbbf24 30%, #f59e0b 50%, #fbbf24 70%, transparent 90%)'
                : 'linear-gradient(to right, transparent 10%, #22d3ee 30%, #06b6d4 50%, #22d3ee 70%, transparent 90%)',
              boxShadow: isLowWater
                ? '0 0 15px rgba(251,191,36,0.7), 0 0 30px rgba(251,191,36,0.35)'
                : '0 0 15px rgba(34,211,238,0.7), 0 0 30px rgba(34,211,238,0.35)',
              filter: 'blur(0.5px)'
            }}
          />
          
          {/* Glow bloom beneath */}
          <motion.div
            className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full"
            animate={{ opacity: isConnected ? [0.2, 0.45, 0.2] : 0.1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: isLowWater
                ? 'radial-gradient(ellipse at center, rgba(251,191,36,0.5) 0%, transparent 80%)'
                : 'radial-gradient(ellipse at center, rgba(34,211,238,0.4) 0%, transparent 80%)',
              filter: 'blur(8px)'
            }}
          />
        </div>
      </div>

      {/* ── Shadow beneath bottle ── */}
      <div
        className="w-16 h-2 rounded-full flex-shrink-0 mt-1"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 80%)',
          filter: 'blur(4px)'
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
