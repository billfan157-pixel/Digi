import { CloudSun, Heart, Wifi, TrendingUp, TrendingDown, Footprints, Wind, Droplets as WaterDrop, Zap, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
    heartRateTrend?: number[]; // Last 5 readings
  } | null;
}

// Animated counter hook
function useAnimatedValue(target: number, duration: number = 800) {
  const [current, setCurrent] = useState(target);
  
  useEffect(() => {
    const start = current;
    const diff = target - start;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + diff * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target]);
  
  return Math.round(current);
}

// Mini sparkline component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5 h-4">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 16;
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-300"
            style={{
              height: `${Math.max(height, 2)}px`,
              backgroundColor: color,
              opacity: i === data.length - 1 ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

// Heart rate zone indicator
function getHeartRateZone(hr: number, restingHR: number = 60): { zone: string; color: string; emoji: string } {
  const maxHR = 220 - 25; // Assuming average age, adjust as needed
  const hrr = maxHR - restingHR;
  const intensity = (hr - restingHR) / hrr;
  
  if (intensity < 0.5) return { zone: 'Resting', color: 'text-emerald-400', emoji: '😌' };
  if (intensity < 0.6) return { zone: 'Light', color: 'text-cyan-400', emoji: '🚶' };
  if (intensity < 0.7) return { zone: 'Moderate', color: 'text-yellow-400', emoji: '🏃' };
  if (intensity < 0.8) return { zone: 'Vigorous', color: 'text-orange-400', emoji: '💪' };
  return { zone: 'Max', color: 'text-red-400', emoji: '🔥' };
}

// Weather recommendation
function getWeatherRecommendation(temp: number, uvIndex?: number): { text: string; icon: React.ReactNode } {
  if (temp > 30) {
    return {
      text: 'Stay hydrated!',
      icon: <WaterDrop size={10} className="text-cyan-400" />
    };
  }
  if (uvIndex && uvIndex > 6) {
    return {
      text: 'UV high - use protection',
      icon: <Zap size={10} className="text-yellow-400" />
    };
  }
  if (temp < 10) {
    return {
      text: 'Bundle up!',
      icon: <Wind size={10} className="text-blue-400" />
    };
  }
  return {
    text: 'Perfect weather',
    icon: <CloudSun size={10} className="text-emerald-400" />
  };
}

const TelemetryGrid = React.memo(function TelemetryGrid({ weatherData, watchData }: TelemetryGridProps) {
  const { t } = useTranslation();
  const [isHoveringWeather, setIsHoveringWeather] = useState(false);
  const [isHoveringWatch, setIsHoveringWatch] = useState(false);
  
  // Animated values
  const animatedTemp = useAnimatedValue(weatherData?.temp || 0);
  const animatedHR = useAnimatedValue(watchData?.heartRate || 0);
  const animatedSteps = useAnimatedValue(watchData?.steps || 0);
  
  // Calculate steps progress
  const stepsProgress = watchData?.stepsGoal 
    ? Math.min((watchData.steps / watchData.stepsGoal) * 100, 100)
    : 0;
  
  // Heart rate analysis
  const hrZone = watchData?.heartRate 
    ? getHeartRateZone(watchData.heartRate, watchData.restingHR)
    : null;
  
  // Weather recommendation
  const weatherRec = weatherData 
    ? getWeatherRecommendation(weatherData.temp, weatherData.uvIndex)
    : null;

  return (
    <div className="mb-6 px-5">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Activity size={16} className="text-slate-500" />
        <h3 className="text-sm font-black text-white tracking-tight">Đo lường sinh học</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Card Môi trường */}
        <div 
          className="glass-card p-4 flex flex-col justify-between min-h-[105px] relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-slate-800/40"
          onMouseEnter={() => setIsHoveringWeather(true)}
          onMouseLeave={() => setIsHoveringWeather(false)}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${weatherData ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <CloudSun size={14} className={weatherData ? 'text-amber-400' : 'text-slate-500'} />
              </div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Môi trường</span>
            </div>
          </div>
          
          <div className="mt-3 relative z-10">
            {weatherData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{animatedTemp}°C</span>
                  {weatherData.trend && (
                    <span className="ml-1">
                      {weatherData.trend === 'up' ? (
                        <TrendingUp size={12} className="text-orange-400" />
                      ) : weatherData.trend === 'down' ? (
                        <TrendingDown size={12} className="text-cyan-400" />
                      ) : null}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{weatherData.status || 'Thời tiết hiện tại'}</p>
                {/* Additional weather info on hover */}
                {isHoveringWeather && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {weatherData.humidity !== undefined && (
                      <p className="text-slate-400 text-[9px] font-bold flex items-center gap-1">
                        <WaterDrop size={8} /> {weatherData.humidity}% độ ẩm
                      </p>
                    )}
                    {weatherRec && (
                      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
                        {weatherRec.icon}
                        <p className="text-cyan-400/80 text-[9px] font-bold">{weatherRec.text}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-500">Chưa đồng bộ</span>
                <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" /> Chờ dữ liệu
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Card Sinh hiệu */}
        <div 
          className="glass-card p-4 flex flex-col justify-between min-h-[105px] relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-slate-800/40 cursor-pointer active:scale-95"
          onMouseEnter={() => setIsHoveringWatch(true)}
          onMouseLeave={() => setIsHoveringWatch(false)}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${watchData?.heartRate ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <Heart size={14} className={watchData?.heartRate ? 'text-rose-400 animate-pulse' : 'text-slate-500'} />
              </div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Sinh hiệu</span>
            </div>
          </div>
          
          <div className="mt-3 relative z-10">
            {watchData && watchData.heartRate > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{animatedHR}</span>
                  <span className="text-xs font-bold text-rose-400">bpm</span>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{animatedHR}</span>
                    <span className="text-xs font-bold text-rose-400">bpm</span>
                  </div>
                  {watchData.heartRateTrend && watchData.heartRateTrend.length > 0 && (
                    <div className="mb-1 opacity-80">
                      <MiniSparkline data={watchData.heartRateTrend} color="#fb7185" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{hrZone ? `${hrZone.emoji} ${hrZone.zone} zone` : 'Nhịp tim'}</p>
                {/* Additional health info on hover */}
                {isHoveringWatch && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {watchData.steps > 0 && (
                      <p className="text-slate-400 text-[9px] font-bold flex items-center gap-1">
                        <Footprints size={8} /> {animatedSteps.toLocaleString()} steps
                      </p>
                    )}
                    {watchData.calories && (
                      <p className="text-slate-400 text-[9px] font-bold flex items-center gap-1">
                        <Zap size={8} /> {watchData.calories} cal
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-500">Ngoại tuyến</span>
                <span className="text-[10px] text-slate-600 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" /> Quét thiết bị
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TelemetryGrid;