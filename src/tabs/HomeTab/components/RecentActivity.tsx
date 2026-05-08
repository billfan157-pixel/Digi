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
      <div className="text-center py-8 bg-slate-200/40 dark:bg-slate-900/40 rounded-2xl border border-slate-300/50 dark:border-white/5">
        <Droplet size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm font-medium">{t('home.no_activity_today')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 dark:text-white text-base font-black flex items-center gap-2">
          <History size={16} className="text-cyan-500 dark:text-cyan-400" />
          {t('home.recent_activity')}
        </h3>
        <button 
          onClick={() => setShowHistory(true)} 
          className="text-cyan-500 dark:text-cyan-400 text-xs font-bold hover:underline"
        >
          {t('home.view_all')}
        </button>
      </div>
      
      <div className="space-y-2">
        {recentEntries.map((entry: WaterLog, index: number) => (
          <div key={entry.id || `recent-${index}`} className="group flex items-center justify-between p-2.5 bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300 dark:border-white/10 rounded-2xl hover:border-cyan-500/30 dark:hover:border-cyan-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${presetStyles[entry.color || 'cyan']?.bg || presetStyles.cyan.bg} ${presetStyles[entry.color || 'cyan']?.border || presetStyles.cyan.border}`}>
                {renderIcon(entry.icon || 'Droplet', { size: 18, className: presetStyles[entry.color || 'cyan']?.text || presetStyles.cyan.text })}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {entry.name === 'DigiBottle' ? t('home.pure_water') : entry.name}
                  </p>
                  {entry.name === 'DigiBottle' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 flex items-center gap-0.5">
                      <Bluetooth size={8} /> DigiBottle
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatWaterEntryTime(entry)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-cyan-500 dark:text-cyan-400">+{entry.amount}ml</span>
              <button 
                onClick={() => handleDeleteEntry(entry.id)} 
                className="w-7 h-7 rounded-lg bg-slate-300/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RecentActivity;