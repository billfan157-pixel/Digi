import i18n from '@/i18n';

export type SocialComposerState = {
  content: string;
  imageUrl: string;
  // `progress` is kept as a legacy alias and is persisted as `status` until the DB taxonomy migrates.
  postKind: 'status' | 'progress' | 'story' | 'challenge';
  visibility: 'public' | 'followers';
  eventType?: string;
  referenceId?: string;
};



export const DEFAULT_SOCIAL_COMPOSER: SocialComposerState = {
  content: '',
  imageUrl: '',
  postKind: 'status',
  visibility: 'followers',
};

export type SocialProfileSummary = {
  id: string;
  nickname: string;
};

export type SocialDiscoverProfile = SocialProfileSummary & {
  isFollowing: boolean;
  isInCircle?: boolean;
  avatar_url?: string | null;
  water_today?: number | null;
  water_goal?: number | null;
  level?: number | null;
};

export type SocialProfileStats = {
  followers: number;
  following: number;
  posts: number;
};

export type CloseCircleMember = SocialProfileSummary & {
  avatar_url?: string | null;
  water_today?: number | null;
  water_goal?: number | null;
  level?: number | null;
  priority: number;
  is_pinned: boolean;
  latest_post_id?: string | null;
  latest_at?: string | null;
};

export const DEFAULT_SOCIAL_PROFILE_STATS: SocialProfileStats = {
  followers: 0,
  following: 0,
  posts: 0,
};

export const getRelativeTimeLabel = (value: string | null | undefined): string => {
  if (!value) return i18n.t('common.just_now');

  const date = new Date(value);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return i18n.t('common.just_now');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return i18n.t('common.minutes_ago', { minutes: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return i18n.t('common.hours_ago', { hours: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return i18n.t('common.days_ago', { days: diffInDays });
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const buildPurchaseShareText = (params: {
  nickname?: string;
  itemName: string;
  itemCategory: string;
}) => {
  const name = params.nickname || 'Mình';
  const categoryLabel: Record<string, string> = {
    theme: i18n.t('common.category_theme_shop'),
    frame: i18n.t('common.category_frame_shop'),
    bottle: i18n.t('common.category_bottle_shop'),
    sound: i18n.t('common.category_sound_shop'),
  };
  const label = categoryLabel[params.itemCategory] || i18n.t('common.category_item_shop');
  return `${name} vừa mở khóa ${label} "${params.itemName}" trong cửa hàng DigiWell!`;
};

export const buildProgressShareText = (params: {
  nickname?: string;
  waterIntake: number;
  waterGoal: number;
  streak: number;
}) => {
  const progressPercent = Math.min(100, Math.round((params.waterIntake / Math.max(params.waterGoal, 1)) * 100));
  const name = params.nickname || 'Mình';

  return `${name} vừa chạm ${progressPercent}% mục tiêu nước hôm nay: ${params.waterIntake}/${params.waterGoal}ml. Streak hiện tại ${params.streak} ngày, ai theo thử thách uống nước cùng không?`;
};

export const isMissingSocialSchemaError = (message: string) => {
  const lowered = message.toLowerCase();
  return lowered.includes('social_posts')
    || lowered.includes('social_follows')
    || lowered.includes('social_post_likes')
    || lowered.includes('widget_partners')
    || lowered.includes('nudges')
    || lowered.includes('social-media')
    || lowered.includes('bucket')
    || lowered.includes('relation')
    || lowered.includes('does not exist');
};
