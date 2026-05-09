import { CloudSun, Heart, Activity, Wifi } from 'lucide-react';
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
      <p className="section-title text-slate-400 mb-4 px-1 flex items-center gap-2">
        <Activity size={13} className="text-cyan-400" /> {t('home.biometrics')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Weather Card */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-sky-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-400/8 blur-3xl rounded-full group-hover:bg-sky-400/12 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.1)]">
              <CloudSun size={16} className="text-sky-400" />
            </div>
            <span className="section-label">{t('home.environment')}</span>
          </div>
          <div className="relative z-10">
            {weatherData ? (
              <>
                <p className="text-3xl font-black text-white tracking-tight">
                  {weatherData.temp}°
                </p>
                <p className="text-slate-400 text-xs font-semibold mt-2 line-clamp-1">
                  {weatherData.status}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-500 mt-1">
                  Chưa đồng bộ
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Wifi size={12} className="text-slate-600 animate-pulse" />
                  <p className="text-slate-600 text-xs font-medium">
                    {t('home.not_synced')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Watch Card */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-400/8 blur-3xl rounded-full group-hover:bg-rose-400/12 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.1)]">
              <Heart size={16} className="text-rose-400" />
            </div>
            <span className="section-label">{t('home.vitals')}</span>
          </div>
          <div className="relative z-10">
            {watchData && watchData.heartRate > 0 ? (
              <>
                <p className="text-3xl font-black text-white tracking-tight">
                  {watchData.heartRate}
                </p>
                <p className="text-emerald-400 text-[10px] tracking-widest font-bold mt-2">
                  {t('home.working_well')}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-500 mt-1">
                  Kết nối thiết bị
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Heart size={12} className="text-slate-600 animate-[pulse_2s_ease-in-out_infinite]" />
                  <p className="text-slate-600 text-xs font-medium">
                    {t('home.not_connected')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TelemetryGrid;