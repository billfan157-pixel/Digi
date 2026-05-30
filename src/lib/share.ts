import { Capacitor } from '@capacitor/core';
import i18n from '@/i18n';

interface ShareHydrationStatsOptions {
  streak: number;
  waterIntake: number;
  waterGoal: number;
  level?: number;
  coins?: number;
}

export async function shareHydrationStats(options: ShareHydrationStatsOptions) {
  const { streak, waterIntake, waterGoal, level, coins } = options;
  const progress = Math.round((waterIntake / Math.max(waterGoal, 1)) * 100);

  const text = [
    i18n.t('share.stats_title'),
    ``,
    i18n.t('share.streak_days', { streak }),
    i18n.t('share.today_progress', { intake: waterIntake, goal: waterGoal, pct: progress }),
    level ? i18n.t('share.level', { level }) : '',
    coins ? i18n.t('share.coins', { coins }) : '',
    ``,
    i18n.t('share.challenge_friends'),
  ].filter(Boolean).join('\n');

  if (Capacitor.isNativePlatform()) {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: i18n.t('share.stats_share_title'),
      text,
      url: 'https://digiwell-app.vercel.app',
      dialogTitle: i18n.t('share.dialog_title'),
    });
  } else {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }
}

export async function shareApp() {
  if (Capacitor.isNativePlatform()) {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: i18n.t('share.stats_title'),
      text: i18n.t('share.app_description'),
      url: 'https://digiwell-app.vercel.app',
      dialogTitle: i18n.t('share.share_digiwell'),
    });
  } else {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(i18n.t('share.clipboard_text'));
    }
  }
}
