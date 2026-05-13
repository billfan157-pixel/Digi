import type { ShopItem } from '@/models';
import { supabase } from '@/lib/supabase';

const sampleItems: ShopItem[] = [
  { id: 'theme_cyan', name: 'Cyberpunk (Cyan)', description: 'Màu lục lam Neon mặc định', price: 0, rarity: 'common', category: 'theme', meta_value: '{"primary": "#06b6d4", "required_level": 1}', preview_color: '#06b6d4', is_active: true },
  { id: 'theme_yellow', name: 'Hoàng Kim (Gold)', description: 'Ánh vàng vương giả quyền quý', price: 200, rarity: 'rare', category: 'theme', meta_value: '{"primary": "#f59e0b", "required_level": 5}', preview_color: '#f59e0b', is_active: true },
  { id: 'theme_emerald', name: 'Lục Bảo (Emerald)', description: 'Xanh ngọc bích thiên nhiên tươi mát', price: 250, rarity: 'rare', category: 'theme', meta_value: '{"primary": "#10b981", "required_level": 10}', preview_color: '#10b981', is_active: true },
  { id: 'theme_purple', name: 'Dạ Khúc (Purple)', description: 'Sắc tím neon huyền bí', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#a855f7", "required_level": 15}', preview_color: '#a855f7', is_active: true },
  { id: 'theme_red', name: 'Hỏa Ngục (Crimson)', description: 'Màu đỏ thẫm rực lửa', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#e11d48", "required_level": 25}', preview_color: '#e11d48', is_active: true },
  { id: 'theme_aurora', name: 'Cực Quang (Aurora)', description: 'Sắc hồng cực quang siêu hiếm', price: 1000, rarity: 'legendary', category: 'theme', meta_value: '{"primary": "#ec4899", "required_level": 50}', preview_color: '#ec4899', is_active: true },

  // ── Khung viền Avatar sức khỏe ──
  { id: 'frame_aqua_pulse', name: 'Nhịp Nước', description: 'Khung viền xanh dương nhịp đập, dành cho người yêu nước', price: 0, rarity: 'common', category: 'frame', meta_value: '{"required_level": 1}', preview_color: '#22d3ee', is_active: true },
  { id: 'frame_deep_ocean', name: 'Đại Dương Sâu', description: 'Hào quang đại dương sâu thẳm, xoáy quanh avatar', price: 200, rarity: 'rare', category: 'frame', meta_value: '{"required_level": 5}', preview_color: '#3b82f6', is_active: true },
  { id: 'frame_heartbeat', name: 'Nhịp Tim', description: 'Khung viền đập theo nhịp tim, thể hiện sức sống', price: 300, rarity: 'rare', category: 'frame', meta_value: '{"required_level": 10}', preview_color: '#fb7185', is_active: true },
  { id: 'frame_energy_aura', name: 'Hào Quang Năng Lượng', description: 'Vòng năng lượng vàng xoáy, cho người vận động', price: 400, rarity: 'epic', category: 'frame', meta_value: '{"required_level": 15}', preview_color: '#fbbf24', is_active: true },
  { id: 'frame_zen_garden', name: 'Vườn Thiền', description: 'Hào quang xanh lá nhẹ nhàng, thư thái', price: 350, rarity: 'rare', category: 'frame', meta_value: '{"required_level": 10}', preview_color: '#34d399', is_active: true },
  { id: 'frame_aurora', name: 'Cực Quang', description: 'Vòng xoáy cầu vồng cực quang huyền bí', price: 800, rarity: 'epic', category: 'frame', meta_value: '{"required_level": 30}', preview_color: '#a78bfa', is_active: true },
  { id: 'frame_fire_streak', name: 'Ngọn Lửa Streak', description: 'Hào quang lửa cho người giữ streak mạnh', price: 600, rarity: 'epic', category: 'frame', meta_value: '{"required_level": 20}', preview_color: '#f97316', is_active: true },
  { id: 'frame_diamond', name: 'Kim Cương Kỷ Luật', description: 'Khung kim cương lấp lánh, biểu tượng kỷ luật tối cao', price: 1500, rarity: 'legendary', category: 'frame', meta_value: '{"required_level": 50}', preview_color: '#7dd3fc', is_active: true },

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
