import { CloudSun, Heart, Wifi } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface TelemetryGridProps {
  weatherData: { temp: number; status?: string; location?: string } | null;
  watchData: { heartRate: number; steps: number } | null;
}

const TelemetryGrid = React.memo(function TelemetryGrid({ weatherData, watchData }: TelemetryGridProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 px-6 space-y-3">
      {/* ── Weather Card ── */}
      <div className="glass-card-strong p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CloudSun size={18} className="text-cyan-400" />
          </div>
          <div>
            {weatherData ? (
              <>
                <p className="text-white font-black text-lg leading-none tracking-tight">
                  {weatherData.temp}<span className="text-sm text-cyan-400/70 font-bold">°C</span>
                </p>
                {weatherData.status && (
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                    {weatherData.status}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-white font-black text-lg leading-none tracking-tight opacity-40">
                  --<span className="text-sm text-cyan-400/30 font-bold">°C</span>
                </p>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <Wifi size={10} className="animate-pulse" />
                  {t('home.not_synced')}
                </p>
              </>
            )}
          </div>
        </div>
        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          {t('home.environment')}
        </span>
      </div>

      {/* ── Watch Card ── */}
      <div className="glass-card-strong p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Heart size={18} className="text-rose-400" />
          </div>
          <div>
            {watchData && watchData.heartRate > 0 ? (
              <>
                <p className="text-white font-black text-lg leading-none tracking-tight flex items-baseline gap-1">
                  {watchData.heartRate}
                  <span className="text-[10px] text-rose-400/70 font-bold uppercase tracking-widest">bpm</span>
                </p>
                <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                  {t('home.working_well')}
                </p>
              </>
            ) : (
              <>
                <p className="text-white font-black text-lg leading-none tracking-tight opacity-40">
                  --<span className="text-[10px] text-rose-400/30 font-bold uppercase tracking-widest ml-1">bpm</span>
                </p>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <Heart size={10} className="animate-pulse" />
                  {t('home.not_connected')}
                </p>
              </>
            )}
          </div>
        </div>
        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          {t('home.vitals')}
        </span>
      </div>
    </div>
  );
});

export default TelemetryGrid;