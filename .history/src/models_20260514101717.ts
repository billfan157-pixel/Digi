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
  amount_ml: number;
  drink_type: string;
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
  meta_value: any;
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
  post_kind: 'checkin' | 'status' | 'progress' | 'story' | 'milestone' | 'challenge' | 'achievement' | 'compare' | 'tip' | 'poll' | 'photo' | 'water_log' | 'daily_goal';
  visibility: 'public' | 'followers';
  hydration_ml: number | null;
  streak_snapshot: number | null;
  cheers_count: number;
  comments_count: number;
  drops_count: number;
  pulse_count?: number;
  created_at: string;
  expires_at: string | null;
  
  // Joined data
  author?: Partial<Profile>;
  cheeredByMe?: boolean;

  // Client-side computed or demo data
  type: 'status' | 'daily_goal' | 'milestone' | 'challenge' | 'achievement' | 'compare' | 'water_log' | 'tip' | 'poll' | 'photo';
  value?: number | string;
  temperature?: number;
  heart_rate?: number;
  drink_type?: string;
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
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Partial<Profile>;
}
