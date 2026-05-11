import React, { useEffect, useState } from 'react';
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

function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (!data?.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex h-5 items-end gap-0.5">
      {data.slice(-7).map((value, i) => {
        const height = ((value - min) / range) * 14 + 2;
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

  if (intensity < 0.5) return { zone: 'Resting', color: 'text-emerald-400', emoji: '😌' };
  if (intensity < 0.6) return { zone: 'Light', color: 'text-cyan-400', emoji: '🚶' };
  if (intensity < 0.7) return { zone: 'Moderate', color: 'text-amber-400', emoji: '🏃' };
  if (intensity < 0.8) return { zone: 'Vigorous', color: 'text-orange-400', emoji: '💪' };
  return { zone: 'Max', color: 'text-rose-400', emoji: '🔥' };
}

function getWeatherRecommendation(temp: number, uvIndex?: number) {
  if (uvIndex !== undefined && uvIndex > 6) {
    return {
      text: 'UV cao — nên bảo vệ da',
      icon: <Zap size={10} className="text-yellow-400" />,
    };
  }

  if (temp > 30) {
    return {
      text: 'Trời nóng — nhớ uống nước',
      icon: <WaterDrop size={10} className="text-cyan-400" />,
    };
  }

  if (temp < 10) {
    return {
      text: 'Trời lạnh — giữ ấm',
      icon: <Wind size={10} className="text-sky-400" />,
    };
  }

  return {
    text: 'Thời tiết khá dễ chịu',
    icon: <CloudSun size={10} className="text-emerald-400" />,
  };
}

function ConnectedCard({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  rightLabel,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClassName: string;
  iconBgClassName: string;
  rightLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-slate-950/60 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 ${iconBgClassName}`}>
            <Icon size={18} className={iconClassName} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-white">{title}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
          {rightLabel}
        </span>
      </div>

      <div className="relative z-10 mt-3">{children}</div>
    </div>
  );
}

function DisconnectedCard({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  rightLabel,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClassName: string;
  iconBgClassName: string;
  rightLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-white/8 bg-slate-950/35 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] via-transparent to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] ${iconBgClassName}`}>
            <Icon size={18} className={`${iconClassName} opacity-45`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-white/70">{title}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
          {rightLabel}
        </span>
      </div>

      <div className="relative z-10 mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <Wifi size={12} className="animate-pulse text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">{emptyTitle}</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {emptyDescription}
        </p>
      </div>
    </div>
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

  const stepsProgress = watchData?.stepsGoal
    ? Math.min((watchData.steps / watchData.stepsGoal) * 100, 100)
    : 0;

  const hrZone = watchData?.heartRate
    ? getHeartRateZone(watchData.heartRate, watchData.restingHR)
    : null;

  const weatherRec = weatherData
    ? getWeatherRecommendation(weatherData.temp, weatherData.uvIndex)
    : null;

  const weatherConnected = !!weatherData;
  const watchConnected = !!(watchData && watchData.heartRate > 0);

  return (
    <div className="mb-6 space-y-3 px-6">
      {weatherConnected ? (
        <ConnectedCard
          title={`${animatedTemp}°C`}
          subtitle={weatherData?.status || t('home.environment')}
          icon={CloudSun}
          iconClassName="text-cyan-400"
          iconBgClassName="bg-cyan-500/10"
          rightLabel={t('home.environment')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {weatherData?.trend === 'up' ? (
                  <TrendingUp size={12} className="text-orange-400" />
                ) : weatherData?.trend === 'down' ? (
                  <TrendingDown size={12} className="text-cyan-400" />
                ) : null}

                {weatherData?.location ? (
                  <p className="truncate text-[11px] text-slate-400">
                    {weatherData.location}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {t('home.weather_live')}
                  </p>
                )}
              </div>

              {weatherRec && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                  {weatherRec.icon}
                  <span className="text-[10px] font-medium text-slate-300">
                    {weatherRec.text}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Feels like
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {weatherData?.feelsLike ?? weatherData?.temp}°C
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Humidity
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {weatherData?.humidity ?? '--'}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  UV
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {weatherData?.uvIndex ?? '--'}
                </p>
              </div>
            </div>
          </div>
        </ConnectedCard>
      ) : (
        <DisconnectedCard
          title="--°C"
          subtitle={t('home.environment')}
          icon={CloudSun}
          iconClassName="text-cyan-400"
          iconBgClassName="bg-cyan-500/10"
          rightLabel={t('home.environment')}
          emptyTitle={t('home.not_synced')}
          emptyDescription="Kết nối thời tiết để xem nhiệt độ, độ ẩm, UV và gợi ý phù hợp trong ngày."
        />
      )}

      {watchConnected ? (
        <ConnectedCard
          title={`${animatedHR} bpm`}
          subtitle={hrZone?.zone || t('home.vitals')}
          icon={Heart}
          iconClassName="text-rose-400"
          iconBgClassName="bg-rose-500/10"
          rightLabel={t('home.vitals')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {hrZone ? (
                  <span className={`${hrZone.color} text-[10px] font-bold uppercase tracking-[0.18em]`}>
                    {hrZone.emoji} {hrZone.zone} zone
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    {t('home.working_well')}
                  </span>
                )}
              </div>

              {watchData?.heartRateTrend?.length ? (
                <MiniSparkline data={watchData.heartRateTrend} color="#fb7185" />
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Steps
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {animatedSteps.toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  HRV
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {watchData?.hrv ?? '--'}
                  {watchData?.hrv ? 'ms' : ''}
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Calories
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {watchData?.calories ?? '--'}
                </p>
              </div>
            </div>

            {watchData?.stepsGoal ? (
              <div className="rounded-2xl border border-white/6 bg-white/5 px-3 py-3">
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
        </ConnectedCard>
      ) : (
        <DisconnectedCard
          title="-- bpm"
          subtitle={t('home.vitals')}
          icon={Heart}
          iconClassName="text-rose-400"
          iconBgClassName="bg-rose-500/10"
          rightLabel={t('home.vitals')}
          emptyTitle={t('home.not_connected')}
          emptyDescription="Kết nối thiết bị để xem nhịp tim, số bước, HRV và các chỉ số sức khỏe trong ngày."
        />
      )}
    </div>
  );
});

export default TelemetryGrid;