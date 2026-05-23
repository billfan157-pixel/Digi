import { useTranslation } from 'react-i18next';
import { Hand, BarChart3 } from 'lucide-react';
import TabHeader from '@/components/layout/TabHeader';
import type { Profile } from '@/models';

interface HomeHeaderProps {
  profile: Profile | null;
  onMenuOpen: () => void;
  onWeeklyReportClick?: () => void;
  hasNewReport?: boolean;
}

export default function HomeHeader({ profile, onMenuOpen, onWeeklyReportClick, hasNewReport }: HomeHeaderProps) {
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
          </span> <Hand size={18} className="inline text-slate-400" />
        </>
      }
      profile={profile}
      onAvatarClick={onMenuOpen}
      actionIcon={onWeeklyReportClick ? (
        <span className="relative flex items-center justify-center">
          <BarChart3 size={18} />
          {hasNewReport && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          )}
        </span>
      ) : undefined}
      onActionClick={onWeeklyReportClick}
      actionLabel={t('home.weekly_report') || 'Báo cáo tuần'}
    />
  );
}
