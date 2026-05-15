import React from 'react';
import { useTranslation } from 'react-i18next';
import TabHeader from '@/components/layout/TabHeader';
import type { Profile } from '@/models';

interface HomeHeaderProps {
  profile: Profile | null;
  onMenuOpen: () => void;
}

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
