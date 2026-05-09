import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CloudSun,
  Droplets as WaterDrop,
  Footprints,
  Heart,
  TrendingDown,
  TrendingUp,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TelemetryGridProps {
  weatherData: {
    temp: number;
    status?: string;
    location?: string;
    humidity?: number;
    uvIndex?: number;
    feelsLike?: number;
    trend?: 'up' | 'down' | 'stable';
  } | null;
  watchData: {
    heartRate: number;
    steps: number;
    stepsGoal?: number;
    hrv?: number;
    calories?: number;
    restingHR?: number;
    heartRateTrend?: number[];
  } | null;
}

function useAnimatedValue(target: number, duration = 700) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = current;
    const diff = target - from;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + diff * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return Math.round(current);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data?.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex h-6 items-end gap-0.5">
      {data.slice(-7).map((value, i) => {
        const height = ((value - min) / range) * 16 + 2;
        return (
          <div
            key={i}
            className="w-1.5 rounded-full"
            style={{
              height: `${height}px`,
              backgroundColor: color,
              opacity: i === data.length - 1 ? 1 : 0.45,
            }}
          />
        );
      })}
    </div>
  );
}

function getHeartRateZone(
  hr: number,
  restingHR: number = 60
): { zone: string; color: string; emoji: string } {
  const maxHR = 220 - 25;
  const hrr = Math.max(maxHR - restingHR, 1);
  const intensity = (hr - restingHR) / hrr;

  if (intensity < 0.5) return { zone: 'Resting', color: 'text-emerald-400', emoji: '◌' };
  if (intensity < 0.6) return { zone: 'Light', color: 'text-cyan-400', emoji: '•' };
  if (intensity < 0.7) return { zone: 'Moderate', color: 'text-amber-400', emoji: '◉' };
  if (intensity < 0.8) return { zone: 'Vigorous', color: 'text-orange-400', emoji: '⬤' };
  return { zone: 'Max', color: 'text-rose-400', emoji: '✦' };
}

function getWeatherRecommendation(temp: number, uvIndex?: number) {
  if (uvIndex !== undefined && uvIndex > 6) {
    return {
      text: 'High UV',
      icon: <Zap size={10} className="text-amber-400" />,
    };
  }

  if (temp > 30) {
    return {
      text: 'Hydrate more',
      icon: <WaterDrop size={10} className="text-cyan-400" />,
    };
  }

  if (temp < 10) {
    return {
      text: 'Keep warm',
      icon: <Wind size={10} className="text-sky-400" />,
    };
  }

  return {
    text: 'Good conditions',
    icon: <CloudSun size={10} className="text-emerald-400" />,
  };
}

function Shell({
  title,
  subtitle,
  rightLabel,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  children,
  disconnected = false,
}: {
  title: string;
  subtitle: string;
  rightLabel: string;
  icon: React.ElementType;
  iconClassName: string;
  iconBgClassName: string;
  children: React.ReactNode;
  disconnected?: boolean;
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-[30px] border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300',
        disconnected
          ? 'border-white/8 bg-slate-950/38'
          : 'border-white/8 bg-slate-950/68',
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
      <div
        className={[
          'absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl pointer-events-none',
          disconnected ? 'bg-white/5' : 'bg-cyan-500/10',
        ].join(' ')}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
              disconnected ? 'border-white/8 bg-white/[0.03]' : iconBgClassName,
            ].join(' ')}
          >
            <Icon size={18} className={disconnected ? `${iconClassName} opacity-45` : iconClassName} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              {subtitle}
            </p>
            <h3 className={['mt-1 text-[20px] font-black tracking-tight', disconnected ? 'text-white/70' : 'text-white'].join(' ')}>
              {title}
            </h3>
          </div>
        </div>

        <span className={['shrink-0 text-[9px] font-bold uppercase tracking-[0.2em]', disconnected ? 'text-slate-700' : 'text-slate-500'].join(' ')}>
          {rightLabel}
        </span>
      </div>

      <div className="relative z-10 mt-4">{children}</div>
    </div>
  );
}

function ConnectedWeather({
  weatherData,
  animatedTemp,
  t,
}: {
  weatherData: NonNullable<TelemetryGridProps['weatherData']>;
  animatedTemp: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const rec = getWeatherRecommendation(weatherData.temp, weatherData.uvIndex);

  return (
    <Shell
      title={`${animatedTemp}°`}
      subtitle={weatherData.status || t('home.environment')}
      rightLabel={t('home.environment')}
      icon={CloudSun}
      iconClassName="text-cyan-400"
      iconBgClassName="bg-cyan-500/10"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs text-slate-400">
            {weatherData.location || t('home.weather_live')}
          </p>

          <div className="flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
            {rec.icon}
            <span className="text-[10px] font-medium text-slate-300">{rec.text}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Feels" value={`${weatherData.feelsLike ?? weatherData.temp}°`} />
          <StatPill label="Humidity" value={`${weatherData.humidity ?? '--'}%`} />
          <StatPill label="UV" value={`${weatherData.uvIndex ?? '--'}`} />
        </div>
      </div>
    </Shell>
  );
}

function ConnectedWatch({
  watchData,
  animatedHR,
  animatedSteps,
  t,
}: {
  watchData: NonNullable<TelemetryGridProps['watchData']>;
  animatedHR: number;
  animatedSteps: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const hrZone = getHeartRateZone(watchData.heartRate, watchData.restingHR);
  const stepsProgress = watchData.stepsGoal
    ? Math.min((watchData.steps / watchData.stepsGoal) * 100, 100)
    : 0;

  return (
    <Shell
      title={`${animatedHR}`}
      subtitle={t('home.vitals')}
      rightLabel={t('home.vitals')}
      icon={Heart}
      iconClassName="text-rose-400"
      iconBgClassName="bg-rose-500/10"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={`${hrZone.color} text-[10px] font-bold uppercase tracking-[0.2em]`}>
            {hrZone.emoji} {hrZone.zone}
          </span>
          {watchData.heartRateTrend?.length ? (
            <MiniSparkline data={watchData.heartRateTrend} color="#fb7185" />
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Steps" value={animatedSteps.toLocaleString('vi-VN')} />
          <StatPill label="HRV" value={`${watchData.hrv ?? '--'}${watchData.hrv ? 'ms' : ''}`} />
          <StatPill label="Calories" value={`${watchData.calories ?? '--'}`} />
        </div>

        {watchData.stepsGoal ? (
          <div className="rounded-2xl border border-white/6 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Daily goal
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {Math.round(stepsProgress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${stepsProgress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function DisconnectedWeather({ t }: { t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <Shell
      title="Weather"
      subtitle={t('home.environment')}
      rightLabel={t('home.environment')}
      icon={CloudSun}
      iconClassName="text-cyan-400"
      iconBgClassName="bg-cyan-500/10"
      disconnected
    >
      <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <Wifi size={12} className="animate-pulse text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">
            {t('home.not_synced')}
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Kết nối thời tiết để xem nhiệt độ, độ ẩm, UV và gợi ý phù hợp trong ngày.
        </p>
      </div>
    </Shell>
  );
}

function DisconnectedWatch({ t }: { t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <Shell
      title="Vitals"
      subtitle={t('home.vitals')}
      rightLabel={t('home.vitals')}
      icon={Heart}
      iconClassName="text-rose-400"
      iconBgClassName="bg-rose-500/10"
      disconnected
    >
      <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <Wifi size={12} className="animate-pulse text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">
            {t('home.not_connected')}
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Kết nối thiết bị để xem nhịp tim, số bước, HRV và các chỉ số sức khỏe trong ngày.
        </p>
      </div>
    </Shell>
  );
}

const TelemetryGrid = React.memo(function TelemetryGrid({
  weatherData,
  watchData,
}: TelemetryGridProps) {
  const { t } = useTranslation();

  const animatedTemp = useAnimatedValue(weatherData?.temp || 0);
  const animatedHR = useAnimatedValue(watchData?.heartRate || 0);
  const animatedSteps = useAnimatedValue(watchData?.steps || 0);

  const weatherConnected = !!weatherData;
  const watchConnected = !!(watchData && watchData.heartRate > 0);

  return (
    <div className="mb-6 space-y-3 px-6">
      {weatherConnected ? (
        <ConnectedWeather weatherData={weatherData!} animatedTemp={animatedTemp} t={t} />
      ) : (
        <DisconnectedWeather t={t} />
      )}

      {watchConnected ? (
        <ConnectedWatch
          watchData={watchData!}
          animatedHR={animatedHR}
          animatedSteps={animatedSteps}
          t={t}
        />
      ) : (
        <DisconnectedWatch t={t} />
      )}
    </div>
  );
});

export default TelemetryGrid;