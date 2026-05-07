import { AppStorage } from './storage';
import { CheckCircle2, Droplets, Flame, Swords, Target } from 'lucide-react';
import type { SocialFeedPost } from '../models';

export const stableHash = (seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

export const stableRange = (seed: string, min: number, max: number) => {
  const span = max - min + 1;
  return min + (stableHash(seed) % span);
};

export const storySeed = (story: SocialFeedPost, suffix: string) =>
  `${suffix}:${story.id || story.author_id || story.created_at || story.content || 'story'}`;

export const getFallbackStoryPercent = (story: SocialFeedPost) => {
  if (story.author?.water_goal) {
    return Math.min(100, ((story.author?.water_today || 0) / story.author.water_goal) * 100);
  }

  if (typeof story.value === 'number') {
    return Math.max(0, Math.min(100, story.value));
  }

  return stableRange(storySeed(story, 'story-pct'), 40, 89);
};

export const getFallbackStoryTemperature = (story: SocialFeedPost) =>
 [32, 28, 35][stableHash(storySeed(story, 'story-temp')) % 3];

export const getFallbackStoryDrink = (story: SocialFeedPost) => {
  const drinks = ['Trà xanh', 'Cà phê đá', 'Nước lọc', 'Điện giải', 'Nước detox'];
  return drinks[stableHash(storySeed(story, 'story-drink')) % drinks.length];
};

export const postSeed = (postId: string | undefined, index: number, suffix: string) =>
  `${suffix}:${postId || `post-${index}`}`;

export const getFallbackPostTemperature = (post: any, index: number) => {
  if (post.temperature) return post.temperature;
  return index % 4 === 0 ? stableRange(postSeed(post.id, index, 'temp'), 32, 36) : undefined;
};

export const getFallbackPostHeartRate = (post: any, index: number) => {
  if (post.heart_rate) return post.heart_rate;
  return index % 5 === 0 ? stableRange(postSeed(post.id, index, 'heart'), 90, 129) : undefined;
};

export const getFallbackPostDrinkType = (post: any, index: number) => {
  if (post.drink_type) return post.drink_type;
  return index % 6 === 0 ? 'Trà Đào' : undefined;
};

export const sortPostsByLatest = (posts: SocialFeedPost[]) =>
  [...posts].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

export const getSavedPostStorageKey = (userId: string) => `digiwell_saved_posts_${userId}`;

export const readSavedPostIds = (userId: string | undefined) => {
  if (!userId || userId === 'undefined') return new Set<string>();

  try {
    const raw = AppStorage.getItem(getSavedPostStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []);
  } catch {
    return new Set<string>();
  }
};

export const writeSavedPostIds = (userId: string, ids: Set<string>) => {
  AppStorage.setItem(getSavedPostStorageKey(userId), JSON.stringify(Array.from(ids)));
};

export const getHydrationProgressPercent = (post: SocialFeedPost) => {
  const goal = post.author?.water_goal || 0;
  const amount = post.hydration_ml || (typeof post.value === 'number' ? post.value : 0) || 0;
  if (!goal) return 0;
  return Math.max(0, Math.min(100, Math.round((amount / goal) * 100)));
};

export const getPostSignalMeta = (post: SocialFeedPost) => {
  const progressPercent = getHydrationProgressPercent(post);

  if (post.type === 'challenge') {
    return {
      Icon: Swords,
      eyebrow: 'Thử thách wellness',
      title: 'Một lời mời cạnh tranh lành mạnh',
      description: 'Tham gia để biến feed thành hành động, không chỉ xem.',
      stat: 'Kèo mở',
      accentText: 'text-purple-300',
      cardClass: 'border-purple-500/30 bg-purple-500/5',
      panelClass: 'border-purple-500/20 bg-purple-500/10',
      progress: 72,
    };
  }

  if (post.type === 'milestone' || (post.streak_snapshot || 0) >= 7) {
    return {
      Icon: Flame,
      eyebrow: 'Cột mốc streak',
      title: `Chuỗi ${post.streak_snapshot || post.value || 0} ngày đang sáng`,
      description: 'Một tín hiệu tốt để tạo áp lực tích cực cho cộng đồng.',
      stat: `${post.streak_snapshot || post.value || 0} ngày`,
      accentText: 'text-orange-300',
      cardClass: 'border-orange-500/30 bg-orange-500/5',
      panelClass: 'border-orange-500/20 bg-orange-500/10',
      progress: 100,
    };
  }

  if (post.post_kind === 'progress' || post.type === 'daily_goal' || (post.hydration_ml || 0) > 0) {
    return {
      Icon: Droplets,
      eyebrow: 'Tiến độ hydration',
      title: progressPercent >= 100 ? 'Đã hoàn thành mục tiêu hôm nay' : 'Đang tiến gần mục tiêu hôm nay',
      description: 'Cụng ly để biến tín hiệu này thành một lần nhắc uống nước.',
      stat: `${post.hydration_ml || post.value || 0}ml`,
      accentText: 'text-cyan-300',
      cardClass: 'border-cyan-500/25 bg-cyan-500/5',
      panelClass: 'border-cyan-500/20 bg-cyan-500/10',
      progress: progressPercent || 45,
    };
  }

  if (post.image_url) {
    return {
      Icon: CheckCircle2,
      eyebrow: 'Proof wellness',
      title: 'Một khoảnh khắc gắn với mục tiêu',
      description: 'Ảnh trong feed nên là proof sức khỏe, mục tiêu hoặc hoạt động CLB.',
      stat: 'Proof',
      accentText: 'text-emerald-300',
      cardClass: 'border-emerald-500/25 bg-emerald-500/5',
      panelClass: 'border-emerald-500/20 bg-emerald-500/10',
      progress: 60,
    };
  }

  return {
    Icon: Target,
    eyebrow: 'Check-in mục tiêu',
    title: 'Một tín hiệu accountability',
    description: 'Dùng để kêu gọi nhắc nhở, giữ nhịp và quay lại mục tiêu.',
    stat: 'Check-in',
    accentText: 'text-slate-300',
    cardClass: 'border-white/5 bg-slate-900/50',
    panelClass: 'border-white/10 bg-slate-950/40',
    progress: 35,
  };
};