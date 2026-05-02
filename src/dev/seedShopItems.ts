import type { ShopItem } from '@/models';
import { supabase } from '@/lib/supabase';

const sampleItems: ShopItem[] = [
  { id: 'theme_cyan', name: 'Cyberpunk (Cyan)', description: 'Màu lục lam Neon mặc định', price: 0, rarity: 'common', category: 'theme', meta_value: '{"primary": "#06b6d4", "required_level": 1}', preview_color: '#06b6d4', is_active: true },
  { id: 'theme_yellow', name: 'Hoàng Kim (Gold)', description: 'Ánh vàng vương giả quyền quý', price: 200, rarity: 'rare', category: 'theme', meta_value: '{"primary": "#f59e0b", "required_level": 5}', preview_color: '#f59e0b', is_active: true },
  { id: 'theme_emerald', name: 'Lục Bảo (Emerald)', description: 'Xanh ngọc bích thiên nhiên tươi mát', price: 250, rarity: 'rare', category: 'theme', meta_value: '{"primary": "#10b981", "required_level": 10}', preview_color: '#10b981', is_active: true },
  { id: 'theme_purple', name: 'Dạ Khúc (Purple)', description: 'Sắc tím neon huyền bí', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#a855f7", "required_level": 15}', preview_color: '#a855f7', is_active: true },
  { id: 'theme_red', name: 'Hỏa Ngục (Crimson)', description: 'Màu đỏ thẫm rực lửa', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#e11d48", "required_level": 25}', preview_color: '#e11d48', is_active: true },
  { id: 'theme_aurora', name: 'Cực Quang (Aurora)', description: 'Sắc hồng cực quang siêu hiếm', price: 1000, rarity: 'legendary', category: 'theme', meta_value: '{"primary": "#ec4899", "required_level": 50}', preview_color: '#ec4899', is_active: true },
  { id: 'frame_silver', name: 'Khung Bạc', description: 'Khung avatar bạc', price: 250, rarity: 'rare', category: 'frame', meta_value: '{"url": "silver-frame.png", "required_level": 5}', is_active: true },
  { id: 'bottle_cyberpunk', name: 'Cyberpunk Neon', description: 'Skin bình nước phong cách Cyberpunk', price: 500, rarity: 'epic', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png', meta_value: '{"url": "https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_cyberpunk.png", "required_level": 10}', is_active: true },
  { id: 'bottle_panda', name: 'Gấu Trúc', description: 'Skin bình nước hình gấu trúc', price: 300, rarity: 'rare', category: 'bottle', image_url: 'https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png', meta_value: '{"url": "https://plbwqjdrivyffrhpbmvm.supabase.co/storage/v1/object/public/shop_items/bottle_panda.png", "required_level": 5}', is_active: true },
  { id: 'sound_tada', name: 'Tada!', description: 'Âm thanh chiến thắng vui nhộn', price: 150, rarity: 'rare', category: 'sound', meta_value: '{"url": "tada.wav", "required_level": 1}', is_active: true },
  { id: 'sound_water_drop', name: 'Giọt nước', description: 'Tiếng giọt nước trong trẻo mặc định', price: 0, rarity: 'common', category: 'sound', meta_value: '{"url": "water_drop.wav", "required_level": 1}', is_active: true },
  { id: 'sound_bubble', name: 'Bong bóng', description: 'Tiếng bong bóng nước vui tai', price: 100, rarity: 'common', category: 'sound', meta_value: '{"url": "bubble.wav", "required_level": 1}', is_active: true },
];

export async function seedShopItems() {
  const { error } = await supabase.from('shop_items').upsert(sampleItems);
  if (error) throw error;
  return sampleItems;
}
