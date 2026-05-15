// =================== CORE ===================
export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  level: number;
  total_exp: number;
  coins: number;
  wp: number;
  water_today: number;
  water_goal: number;
  gender: 'Nam' | 'Nữ' | 'Khác';
  age: number;
  height: number;
  weight: number;
  activity: 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
  climate: 'temperate' | 'warm' | 'hot' | 'tropical' | 'cold';
  goal: string;
  equipped_bottle_id: string | null;
  equipped_frame_id?: string | null;
  equipped_theme_id?: string | null;
  equipped_notification_sound?: string | null;
  created_at?: string;
  updated_at?: string;
  onboarding_completed?: boolean;
  // Wellness tracking fields
  sleep_hours?: number;
  sleep_quality?: number;
  mood_tracking?: boolean;
  sync_wellness_data?: boolean;
  energy_tracking?: boolean;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  name: string | null;
  exp: number;
  day: string;
  created_at: string;
}

// =================== SHOP ===================
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'bottle' | 'theme' | 'frame' | 'sound' | 'consumable';
  meta_value: unknown;
  image_url: string | null;
  preview_color: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  quantity: number;
  created_at: string;
  item?: ShopItem;
}

// =================== SOCIAL & FEED ===================
export interface PostPollOption {
  id: string;
  text: string;
  count: number;
}

export interface SocialFeedPost {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  post_kind: 'status' | 'progress' | 'story' | 'challenge' | 'milestone';
  visibility: 'public' | 'followers' | 'circle';
  hydration_ml: number | null;
  streak_snapshot: number | null;
  like_count: number;
  created_at: string;
  expires_at: string | null;
  event_type: string | null;
  reference_id: string | null;
  is_squad_highlight: boolean;
  
  // Joined data
  author?: Partial<Profile>;
  cheeredByMe?: boolean;

  // Client-side computed (not in DB)
  type?: 'status' | 'daily_goal' | 'milestone' | 'challenge' | 'achievement' | 'compare' | 'water_log' | 'tip' | 'poll' | 'photo';
  value?: number | string;
  comments_count?: number;
}

export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  stake_coins: number;
  status: 'pending' | 'active' | 'completed' | 'expired';
  created_at: string;
  challenger?: Partial<Profile>;
  opponent?: Partial<Profile>;
  yourProgress?: number;
  opponentProgress?: number;
  mode?: string;
  winner_id?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  author?: Partial<Profile>;
}

// =================== EXTENDED TYPES ===================
export interface SocialComment extends PostComment {
  user_id?: string;
}

export interface SocialNotification {
  id: string;
  user_id: string;
  type: 'cheer' | 'comment' | 'follow' | 'battle' | 'league';
  data: Record<string, unknown>;
  read?: boolean;
  is_read?: boolean;
  reference_id?: string;
  actor?: {
    nickname: string;
    avatar_url?: string;
  };
  content?: string;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  amount?: number;
  amount_ml?: number;
  name?: string | null;
  exp?: number;
  day?: string;
  created_at?: string;
  timestamp?: string;
  color?: string;
  icon?: string;
  drink_type?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  friend?: Partial<Profile>;
}

export interface SearchResult {
  id: string;
  nickname: string;
  avatar_url: string | null;
  level: number;
}

export interface DrinkPreset {
  id: string;
  name: string;
  amount: number;
  icon: string;
  color: string;
  description?: string;
  factor?: number;
  bg?: string;
}
