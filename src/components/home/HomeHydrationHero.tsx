import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bluetooth, AlertTriangle, RefreshCw } from 'lucide-react';
import type { BottleConnectionState } from '@/hooks/useSmartBottle';
import CountUp from '../CountUp';
import { BottleVisualizer } from '../DeviceComponents';

interface BottleMetrics {
  currentVolume?: number;
}

interface EquippedBottleSkin {
  name?: string;
  rarity?: string;
  meta_value?: string | null;
  image_url?: string | null;
}

interface HomeHydrationHeroProps {
  isConnected: boolean;
  isConnecting?: boolean;
  connectionState?: BottleConnectionState;
  lastError?: string | null;
  metrics?: Partial<BottleMetrics>;
  equippedBottleSkin?: EquippedBottleSkin | null;
  waterIntake: number;
  waterGoal: number;
  progress: number;
  bottleCapacity: number;
  onConnectBottle: () => void | Promise<void>;
  onRetryConnection?: () => void;
  onOpenGoalDetail?: () => void;
  onOpenBottleDetail?: () => void;
}


export default function HomeHydrationHero({
  isConnected,
  isConnecting,
  connectionState,
  lastError,
  metrics,
  waterIntake,
  waterGoal,
  progress,
  bottleCapacity,
  onConnectBottle,
  onRetryConnection,
  onOpenGoalDetail,
  onOpenBottleDetail,
}: Omit<HomeHydrationHeroProps, 'equippedBottleSkin'>) {
  const { t } = useTranslation();
  const bottleFillPercentage = (metrics?.currentVolume ?? 0) / bottleCapacity * 100;
  const state = connectionState || (isConnected ? 'connected' : 'idle');

  // Error state banner
  if (state === 'error') {
    return (
      <div className="relative flex flex-col items-center justify-center py-6 px-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center w-full max-w-xs">
          <AlertTriangle size={32} className="mx-auto text-rose-400 mb-3" />
          <p className="text-sm font-bold text-rose-300 mb-1">{t('device.connection_failed')}</p>
          <p className="text-xs text-slate-400 mb-4">{lastError || t('device.cannot_connect')}</p>
          {onRetryConnection && (
            <button
              onClick={onRetryConnection}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold active:scale-95 transition-all"
            >
              <RefreshCw size={14} /> {t('common.retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Connecting / Reconnecting state
  if (state === 'connecting' || state === 'reconnecting') {
    return (
      <div className="relative flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 rounded-full border-2 border-amber-400/30 flex items-center justify-center mb-4">
          <Bluetooth size={32} className="text-amber-400 animate-pulse" />
        </div>
        <p className="text-sm font-bold text-amber-300">
          {state === 'connecting' ? t('device.status_connecting') : t('device.status_reconnecting')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center pb-4',
        isConnected ? 'mt-4' : '-mt-4 h-80',
      ].join(' ')}
    >
      {/* Visualizer Layer */}
      <div
        className={[
          'relative flex items-center justify-center',
          isConnected ? 'w-72' : 'w-64 h-64',
        ].join(' ')}
      >
        {isConnected ? (
          <button
            onClick={onOpenBottleDetail || onOpenGoalDetail}
            className="w-full flex items-center justify-center active:scale-[1.03] transition-transform duration-150"
          >
            <BottleVisualizer
              isConnected={true}
              currentVolume={metrics?.currentVolume || 0}
              capacity={bottleCapacity}
              fillPercentage={bottleFillPercentage}
            />
          </button>
        ) : (
          <button onClick={onOpenGoalDetail} className="relative w-52 h-52 active:scale-95 transition-transform duration-150">
            <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle className="text-slate-200 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
              <motion.circle
                className="text-cyan-500 dark:text-cyan-400"
                strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"
                strokeDasharray="282.7"
                initial={{ strokeDashoffset: 282.7 }}
                animate={{ strokeDashoffset: 282.7 - (progress / 100) * 282.7 }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
            </svg>
          </button>
        )}
      </div>

      {/* Text Overlay Layer - Shows Daily Goal Progress ONLY when not connected */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            <CountUp value={waterIntake} />
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            / {waterGoal} ml
          </p>
          <div className="mt-2 px-3 py-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-slate-300/50 dark:border-white/10">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Action Layer (Connect Button) */}
      {!isConnected && (
        <div className="absolute bottom-4">
          <button
            onClick={onConnectBottle}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50"
          >
            <Bluetooth size={14} />
            {isConnecting ? t('home.turning_on_demo') : t('home.turn_on_demo')}
          </button>
        </div>
      )}
    </div>
  );
}
