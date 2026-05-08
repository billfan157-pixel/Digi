import { Droplet, Coffee, Activity, Zap, Camera } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import AvatarFrame from '@/components/AvatarFrame';
import type { Profile } from '@/models';

interface HomeHeaderProps {
  profile: Profile | null;
  isScanning: boolean;
  handleScan: () => void;
  onMenuOpen: () => void;
}

export const renderIcon = (iconName: string, props?: any): React.ReactNode => {
  if (iconName === 'Droplet') return <Droplet {...props} />;
  if (iconName === 'Coffee') return <Coffee {...props} />;
  if (iconName === 'Activity') return <Activity {...props} />;
  if (iconName === 'Zap') return <Zap {...props} />;
  return <Droplet {...props} />;
};

export default function HomeHeader({ profile, isScanning, handleScan, onMenuOpen }: HomeHeaderProps) {
  const { t } = useTranslation();
  
  const nowText = {
    date: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date()),
  };

  return (
    <div className="flex justify-between items-center pt-6 pb-2 px-6">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">
          {nowText.date}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {t('home.greeting')}<span className="text-cyan-500 dark:text-cyan-400">
            {profile?.nickname || t('home.you')}
          </span> 👋
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleScan} 
          disabled={isScanning} 
          className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-300 dark:border-white/5 flex items-center justify-center text-cyan-500 dark:text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all duration-200 ease-out disabled:opacity-50"
        >
          <Camera size={18} />
        </button>
        <button onClick={onMenuOpen} className="rounded-full active:scale-95 transition-all duration-200 ease-out flex items-center justify-center">
          <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
        </button>
      </div>
    </div>
  );
}