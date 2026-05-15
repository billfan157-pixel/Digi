import { Droplet, Coffee, Activity, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import TabHeader from '@/components/layout/TabHeader';
import type { Profile } from '@/models';

interface HomeHeaderProps {
  profile: Profile | null;
  onMenuOpen: () => void;
}

export const presetStyles: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
};

export const renderIcon = (iconName: string, props?: any): React.ReactNode => {
  if (iconName === 'Droplet') return <Droplet {...props} />;
  if (iconName === 'Coffee') return <Coffee {...props} />;
  if (iconName === 'Activity') return <Activity {...props} />;
  if (iconName === 'Zap') return <Zap {...props} />;
  return <Droplet {...props} />;
};

export default function HomeHeader({ profile, onMenuOpen }: HomeHeaderProps) {
  const { t } = useTranslation();
  
  const nowText = {
    date: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date()),
  };

  return (
    <TabHeader
      label={nowText.date}
      title={
        <>
          {t('home.greeting')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {profile?.nickname || t('home.you')}
          </span> 👋
        </>
      }
      profile={profile}
      onAvatarClick={onMenuOpen}
    />
  );
}
