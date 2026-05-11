import { Droplet, Coffee, Wine, History, X, Bluetooth } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { WaterLog } from '@/models';

interface RecentActivityProps {
  waterEntries: WaterLog[];
  handleDeleteEntry: (id: string | number) => Promise<void>;
  setShowHistory: (show: boolean) => void;
}

const formatWaterEntryTime = (entry: Pick<WaterLog, 'timestamp' | 'created_at'>) => {
  const rawTime = entry.timestamp ?? entry.created_at;
  if (!rawTime) return '--:--';
  const parsed = new Date(rawTime);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const presetStyles: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
};

const renderIcon = (iconName: string, props?: any): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    Droplet: <Droplet {...props} />,
    Coffee: <Coffee {...props} />,
    Wine: <Wine {...props} />,
  };
  return icons[iconName] || <Droplet {...props} />;
};

const RecentActivity = React.memo(function RecentActivity({ waterEntries, handleDeleteEntry, setShowHistory }: RecentActivityProps) {
  const { t } = useTranslation();

  const recentEntries = useMemo(() => {
    return [...(waterEntries || [])]
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime())
      .slice(0, 4);
  }, [waterEntries]);

  if (recentEntries.length === 0) {
    return (
      <div className="text-center py-10 bg-gradient-to-br from-slate-100/50 to-slate-50/30 dark:from-slate-900/40 dark:to-slate-800/20 rounded-[1.75rem] border border-slate-300/50 dark:border-white/10 backdrop-blur-sm">
        <Droplet size={36} className="text-slate-400 dark:text-slate-600 mx-auto mb-3 opacity-60" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">{t('home.no_activity_today')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-slate-900 dark:text-white text-base font-black flex items-center gap-2.5">
          <History size={17} className="text-cyan-500 dark:text-cyan-400" />
          {t('home.recent_activity')}
        </h3>
        <button 
          onClick={() => setShowHistory(true)} 
          className="text-cyan-600 dark:text-cyan-400 text-xs font-bold hover:underline opacity-85 hover:opacity-100 transition-opacity"
        >
          {t('home.view_all')}
        </button>
      </div>
      
      <div className="space-y-2">
        {recentEntries.map((entry: WaterLog, index: number) => (
          <div key={entry.id || `recent-${index}`} className="group flex items-center justify-between p-3 bg-gradient-to-r from-slate-100/50 to-slate-50/30 dark:from-slate-900/50 dark:to-slate-800/30 backdrop-blur-sm border border-slate-300/50 dark:border-white/10 rounded-[1.25rem] hover:from-cyan-500/10 hover:to-cyan-400/5 dark:hover:from-cyan-500/15 dark:hover:to-cyan-600/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all shadow-[0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_6px_rgba(255,255,255,0.01)] hover:shadow-[0_4px_12px_rgba(6,182,212,0.12)]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${presetStyles[entry.color || 'cyan']?.bg || presetStyles.cyan.bg} border ${presetStyles[entry.color || 'cyan']?.border || presetStyles.cyan.border} shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}>
                {renderIcon(entry.icon || 'Droplet', { size: 19, className: presetStyles[entry.color || 'cyan']?.text || presetStyles.cyan.text })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {entry.name === 'DigiBottle' ? t('home.pure_water') : entry.name}
                  </p>
                  {entry.name === 'DigiBottle' && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30 flex items-center gap-0.5 flex-shrink-0">
                      <Bluetooth size={9} /> DigiBottle
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{formatWaterEntryTime(entry)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 whitespace-nowrap">+{entry.amount}ml</span>
              <button 
                onClick={() => handleDeleteEntry(entry.id)} 
                className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/15 dark:hover:bg-rose-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RecentActivity;