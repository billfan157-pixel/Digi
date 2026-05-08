import { CloudSun, Heart, Activity } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface TelemetryGridProps {
  weatherData: { temp: number; status?: string; location?: string } | null;
  watchData: { heartRate: number; steps: number } | null;
}

const TelemetryGrid = React.memo(function TelemetryGrid({ weatherData, watchData }: TelemetryGridProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 px-2 flex items-center gap-2">
        <Activity size={12} className="text-indigo-400" /> {t('home.biometrics')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Weather Card */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-sky-500/30 transition-colors shadow-sm">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-sky-500/10 blur-2xl rounded-full" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <CloudSun size={14} className="text-sky-500 dark:text-sky-400" />
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{t('home.environment')}</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {weatherData ? `${weatherData.temp}°C` : '--°'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 truncate">
              {weatherData ? weatherData.status : t('home.not_synced')}
            </p>
          </div>
        </div>

        {/* Watch Card */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors shadow-sm">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Heart size={14} className="text-rose-500 dark:text-rose-400" />
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{t('home.vitals')}</span>
          </div>
          <div className="relative z-10">
            {(!watchData || watchData.heartRate === 0) ? (
              <>
                <p className="text-2xl font-black text-slate-400 dark:text-slate-600">--</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">{t('home.not_connected')}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {watchData.heartRate} <span className="text-sm text-slate-500 font-bold tracking-normal">BPM</span>
                </p>
                <p className="text-emerald-500 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-bold mt-1">
                  {t('home.working_well')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TelemetryGrid;