import { motion } from 'framer-motion';
import { Bluetooth, RefreshCw, Battery, Thermometer, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottleVisualizer } from './BottleVisualizer';
import { MetricMini } from './MetricMini';
import { CAPACITY } from '../constants';

export function DeviceHero({
  isConnected, isSyncing, fillPercentage, currentVolume, batteryLevel, signalStrength, latencyMs, temperature, onConnect, onDisconnect
}: {
  isConnected: boolean; isSyncing: boolean; fillPercentage: number; currentVolume: number; batteryLevel: number; signalStrength: number; latencyMs: number; temperature: number; onConnect: () => void; onDisconnect: () => void;
}) {
  const { t } = useTranslation();
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
          <MetricMini label={t('device.battery_label')} value={`${batteryLevel}%`} icon={Battery} />
          <MetricMini label={t('device.temp_label')} value={`${temperature}°C`} icon={Thermometer} />
          <MetricMini label={t('device.signal_label')} value={isConnected ? t('device.signal_good') : '---'} icon={Wifi} />
        </div>
      </div>
    </div>
  );
}
