import type { ShopItem } from '@/models';
import { supabase } from '@/lib/supabase';
import { readThemePreference } from '@/services/appPreferences.service';
import { updateProfileFields } from '@/services/profile.service';

export interface ShopData {
  items: ShopItem[];
  ownedItems: Set<string>;
}

export function parseItemMeta(item: Pick<ShopItem, 'meta_value'>) {
  const raw = item.meta_value;
  if (!raw) return {};
  const str = String(raw);
  // Fast path: single valid JSON
  try {
    return JSON.parse(str);
  } catch {
    // Fallback: walk braces to extract & merge multiple concatenated JSON objects
    try {
      let depth = 0;
      let start = -1;
      const parts: string[] = [];
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            parts.push(str.slice(start, i + 1));
            start = -1;
          }
        }
      }
      if (parts.length === 0) return {};
      const merged: Record<string, unknown> = {};
      for (const p of parts) {
        Object.assign(merged, JSON.parse(p));
      }
      return merged;
    } catch {
      return {};
    }
  }
};

export function getRequiredLevel(item: Pick<ShopItem, 'meta_value'>) {
  return parseItemMeta(item).required_level || 1;
}

export function getRequiredTier(item: Pick<ShopItem, 'meta_value'>): string | null {
  return (parseItemMeta(item) as Record<string, unknown>).required_tier as string || null;
}

export function canAccessPremiumItem(
  item: Pick<ShopItem, 'meta_value'>,
  userTier: string | null | undefined
): boolean {
  const tier = getRequiredTier(item);
  if (!tier) return true; // not a premium item
  if (!userTier || userTier === 'free') return false;
  if (tier === 'plus') return userTier === 'plus' || userTier === 'pro';
  if (tier === 'pro') return userTier === 'pro';
  return false;
}

export function getThemeColor(item: Pick<ShopItem, 'meta_value' | 'preview_color'>) {
  const meta = parseItemMeta(item);
  return meta.primary || item.preview_color || '#06b6d4';
}

export function getSoundValue(item: Pick<ShopItem, 'meta_value'>) {
  const meta = parseItemMeta(item) as Record<string, unknown>;
  return String(meta.url || (typeof item.meta_value === 'string' ? item.meta_value : '') || '');
}

export async function fetchShopData(userId: string): Promise<ShopData> {
  const [{ data: shopItems, error: itemsError }, { data: purchases, error: purchasesError }] =
    await Promise.all([
      supabase
        .from('shop_items')
        .select(
          'id, name, description, price, rarity, category, meta_value, image_url, preview_color, animation_type, is_active'
        )
        .eq('is_active', true),

      supabase
        .from('user_purchases')
        .select('item_id')
        .eq('user_id', userId),
    ]);

  if (itemsError) throw itemsError;
  if (purchasesError) throw purchasesError;

  return {
    items: (shopItems || []) as ShopItem[],
    ownedItems: new Set(
      purchases?.map((purchase: { item_id: string }) => purchase.item_id) || []
    ),
  };
}

export async function purchaseShopItem(
  userId: string,
  item: Pick<ShopItem, 'id'>
) {
  const { data, error } = await supabase.rpc('purchase_item', {
    p_user_id: userId,
    p_item_id: item.id,
  });

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new Error('Purchase failed');
  }

  return true;
}

export async function equipShopItem(userId: string, item: ShopItem) {
  if (item.category === 'bottle') {
    const profile = await updateProfileFields(userId, {
      equipped_bottle_id: item.id,
    });

    return {
      profile,
      themeColor: null,
    };
  }

  if (item.category === 'theme') {
    const profile = await updateProfileFields(userId, {
      equipped_theme_id: item.id,
    });

    return {
      profile,
      themeColor: item.preview_color,
    };
  }

  if (item.category === 'frame') {
    const profile = await updateProfileFields(userId, {
      equipped_frame_id: item.id,
    });

    return {
      profile,
      themeColor: null,
    };
  }

  if (item.category === 'sound') {
    const profile = await updateProfileFields(userId, {
      equipped_notification_sound: getSoundValue(item),
    });

    return {
      profile,
      themeColor: null,
    };
  }

  return {
    profile: null,
    themeColor: readThemePreference(userId),
  };
}

export async function redeemGiftCode(
  userId: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  reward_type?: 'coins' | 'item';
  reward_value?: string;
}> {
  const { data, error } = await supabase.rpc('redeem_gift_code', {
    p_user_id: userId,
    p_code: code,
  });

  if (error) {
    throw error;
  }

  return data as {
    success: boolean;
    message: string;
    reward_type?: 'coins' | 'item';
    reward_value?: string;
  };
}