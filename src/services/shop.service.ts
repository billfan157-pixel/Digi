import type { ShopItem } from '@/models';
import { supabase } from '@/lib/supabase';
import { readThemePreference } from '@/services/appPreferences.service';
import { updateProfileFields } from '@/services/profile.service';

export interface ShopData {
  items: ShopItem[];
  ownedItems: Set<string>;
}

const parseItemMeta = (item: Pick<ShopItem, 'meta_value'>) => {
  try {
    return item.meta_value ? JSON.parse(item.meta_value as string) : {};
  } catch (err) {
    console.error('[parseItemMeta]', err);
    return {};
  }
};

export function getRequiredLevel(item: Pick<ShopItem, 'meta_value'>) {
  return parseItemMeta(item).required_level || 1;
}

export function getThemeColor(item: Pick<ShopItem, 'meta_value' | 'preview_color'>) {
  const meta = parseItemMeta(item);
  return meta.primary || item.preview_color || '#06b6d4';
}

export function getSoundValue(item: Pick<ShopItem, 'meta_value'>) {
  const meta = parseItemMeta(item) as Record<string, unknown>;
  return String(meta.url || item.meta_value || '');
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