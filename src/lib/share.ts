import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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
    `DigiWell - Hydration Tracker`,
    ``,
    `Streak: ${streak} ngày`,
    `Hôm nay: ${waterIntake}/${waterGoal}ml (${progress}%)`,
    level ? `Level: ${level}` : '',
    coins ? `Coins: ${coins}` : '',
    ``,
    `Thử thách bạn bè! 💧`,
  ].filter(Boolean).join('\n');

  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title: 'DigiWell - Hydration Stats',
      text,
      url: 'https://digiwell-app.vercel.app',
      dialogTitle: 'Chia sẻ tiến độ hydration',
    });
  } else {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }
}

export async function shareApp() {
  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title: 'DigiWell - Hydration Tracker',
      text: 'Theo dõi lượng nước uống hàng ngày với AI insights và gamification!',
      url: 'https://digiwell-app.vercel.app',
      dialogTitle: 'Chia sẻ DigiWell',
    });
  } else {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText('DigiWell - https://digiwell-app.vercel.app');
    }
  }
}
