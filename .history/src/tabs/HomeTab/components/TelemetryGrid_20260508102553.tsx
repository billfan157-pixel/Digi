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
    <div className="mb-6 px-6">
      <p className="text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase mb-4 px-1 flex items-center gap-2 opacity-85">
        <Activity size={13} className="text-indigo-400" /> {t('home.biometrics')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Weather Card */}
        <div className="bg-gradient-to-br from-slate-100/70 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/30 backdrop-blur-md border border-slate-300/50 dark:border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden group hover:border-sky-500/40 dark:hover:border-sky-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_rgba(14,165,233,0.15)] dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-400/10 blur-3xl rounded-full group-hover:bg-sky-400/15 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.1)]">
              <CloudSun size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold opacity-75">{t('home.environment')}</span>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {weatherData ? `${weatherData.temp}°` : '--°'}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold mt-2 line-clamp-1">
              {weatherData ? weatherData.status : t('home.not_synced')}
            </p>
          </div>
        </div>

        {/* Watch Card */}
        <div className="bg-gradient-to-br from-slate-100/70 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/30 backdrop-blur-md border border-slate-300/50 dark:border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden group hover:border-rose-500/40 dark:hover:border-rose-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_rgba(244,63,94,0.15)] dark:hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-400/10 blur-3xl rounded-full group-hover:bg-rose-400/15 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.1)]">
              <Heart size={16} className="text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold opacity-75">{t('home.vitals')}</span>
          </div>
          <div className="relative z-10">
            {(!watchData || watchData.heartRate === 0) ? (
              <>
                <p className="text-3xl font-black text-slate-400 dark:text-slate-600">--</p>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold mt-2">{t('home.not_connected')}</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {watchData.heartRate}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-bold mt-2">
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