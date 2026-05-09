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
    <div className="flex justify-between items-center pt-2 pb-3 px-6 relative z-20">
      <div className="flex-1 pr-4">
        <p className="section-title text-slate-400 mb-1.5">
          {nowText.date}
        </p>
        <h1 className="text-3xl font-black tracking-tighter text-white leading-tight">
          {t('home.greeting')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {profile?.nickname || t('home.you')}
          </span> 👋
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleScan} 
          disabled={isScanning} 
          className="w-11 h-11 rounded-xl bg-slate-800/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/15 active:scale-90 transition-all duration-200 ease-out disabled:opacity-50 shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] group"
        >
          <Camera size={18} className="group-hover:scale-110 transition-transform" />
        </button>
        <button onClick={onMenuOpen} className="rounded-full active:scale-90 transition-all duration-200 ease-out flex items-center justify-center hover:scale-105">
          <AvatarFrame size="sm" level={profile?.level || 1} avatarUrl={profile?.avatar_url ?? null} nickname={profile?.nickname} showBadge={false} />
        </button>
      </div>
    </div>
  );
}