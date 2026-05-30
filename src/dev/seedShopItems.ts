import type { ShopItem } from '@/models';
import { supabase } from '@/lib/supabase';

const sampleItems: ShopItem[] = [
  { id: 'theme_cyan', name: 'Xanh Lục Lam', description: 'Lưới neon xanh lục lam mát mắt', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#06b6d4", "required_level": 15}', preview_color: '#06b6d4', is_active: true },
  { id: 'theme_yellow', name: 'Ánh Dương', description: 'Tia nắng ấm áp giữa không gian', price: 200, rarity: 'common', category: 'theme', meta_value: '{"primary": "#fbbf24", "required_level": 5}', preview_color: '#fbbf24', is_active: true },
  { id: 'theme_emerald', name: 'Lục Bảo (Emerald)', description: 'Xanh ngọc bích thiên nhiên tươi mát', price: 250, rarity: 'rare', category: 'theme', meta_value: '{"primary": "#10b981", "required_level": 10}', preview_color: '#10b981', is_active: true },
  { id: 'theme_purple', name: 'Dạ Khúc (Purple)', description: 'Sắc tím neon huyền bí', price: 500, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#a855f7", "required_level": 15}', preview_color: '#a855f7', is_active: true },
  { id: 'theme_red', name: 'Mặt Trời Lửa', description: 'Ánh mặt trời đỏ rực giữa vũ trụ tối', price: 450, rarity: 'epic', category: 'theme', meta_value: '{"primary": "#ef4444", "required_level": 15}', preview_color: '#ef4444', is_active: true },
  { id: 'theme_aurora', name: 'Cực Quang (Aurora)', description: 'Dải cực quang huyền ảo giữa không gian sâu', price: 700, rarity: 'legendary', category: 'theme', meta_value: '{"primary": "#a78bfa", "required_level": 28}', preview_color: '#a78bfa', is_active: true },

  // ── Khung viền Avatar sức khỏe (10 mới) ──
  { id: 'frame_bamboo', name: 'Tre Trúc', description: 'Đốt tre xanh mát xoay quanh avatar', price: 150, rarity: 'common', category: 'frame', meta_value: '{"required_level": 1}', preview_color: '#10b981', is_active: true },
  { id: 'frame_sunset', name: 'Hoàng Hôn', description: 'Vòng cung hoàng hôn ấm áp', price: 250, rarity: 'rare', category: 'frame', meta_value: '{"required_level": 8}', preview_color: '#f97316', is_active: true },
  { id: 'frame_ice_crystal', name: 'Băng Tinh', description: 'Bông tuyết tinh thể xoay quanh avatar', price: 350, rarity: 'rare', category: 'frame', meta_value: '{"required_level": 12}', preview_color: '#67e8f9', is_active: true },
  { id: 'frame_thunder', name: 'Sấm Sét', description: 'Tia chớp điện nhấp nháy đầy năng lượng', price: 500, rarity: 'epic', category: 'frame', meta_value: '{"required_level": 18}', preview_color: '#facc15', is_active: true },
  { id: 'frame_galaxy_swirl', name: 'Xoáy Ngân Hà', description: 'Xoáy thiên hà tím huyền ảo ngoài không gian', price: 1000, rarity: 'legendary', category: 'frame', meta_value: '{"required_level": 35}', preview_color: '#8b5cf6', is_active: true },
  { id: 'frame_premium_silver', name: 'Bạc Quý', description: 'Ánh bạc sang trọng tinh tế', price: 1200, rarity: 'epic', category: 'frame', meta_value: '{"required_level": 20, "required_tier": "plus"}', preview_color: '#cbd5e1', is_active: true },
  { id: 'frame_premium_gold', name: 'Hoàng Kim', description: 'Ánh vàng lấp lánh đẳng cấp', price: 1500, rarity: 'legendary', category: 'frame', meta_value: '{"required_level": 30, "required_tier": "plus"}', preview_color: '#fbbf24', is_active: true },
  { id: 'frame_premium_phoenix', name: 'Phượng Hoàng', description: 'Lửa thiêng phượng hoàng rực cháy', price: 2000, rarity: 'legendary', category: 'frame', meta_value: '{"required_level": 35, "required_tier": "plus"}', preview_color: '#ef4444', is_active: true },
  { id: 'frame_premium_lunar', name: 'Nguyệt Cầu', description: 'Trăng sao huyền ảo giữa bầu trời', price: 1800, rarity: 'legendary', category: 'frame', meta_value: '{"required_level": 30, "required_tier": "plus"}', preview_color: '#818cf8', is_active: true },
  { id: 'frame_premium_dragon', name: 'Long Thần', description: 'Rồng thiêng uy nghi quyền năng tối thượng', price: 5000, rarity: 'mythic', category: 'frame', meta_value: '{"required_level": 50, "required_tier": "pro"}', preview_color: '#f59e0b', is_active: true },

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
  // ── Âm thanh thông báo ──
  // Common (miễn phí / rẻ)
  { id: 'sound_water_drop', name: 'Giọt nước', description: 'Tiếng giọt nước trong trẻo mặc định', price: 0, rarity: 'common', category: 'sound', meta_value: '{"url": "water_drop", "required_level": 1}', is_active: true },
  { id: 'sound_bubble', name: 'Bong bóng', description: 'Tiếng bong bóng nước vui tai', price: 100, rarity: 'common', category: 'sound', meta_value: '{"url": "bubble", "required_level": 1}', is_active: true },
  { id: 'sound_pop', name: 'Pop nhẹ', description: 'Tiếng pop nhẹ nhàng tối giản', price: 100, rarity: 'common', category: 'sound', meta_value: '{"url": "pop", "required_level": 1}', is_active: true },
  { id: 'sound_click', name: 'Click điện tử', description: 'Tiếng click digital hiện đại', price: 150, rarity: 'common', category: 'sound', meta_value: '{"url": "click", "required_level": 1}', is_active: true },

  // Rare
  { id: 'sound_tada', name: 'Tada!', description: 'Âm thanh chiến thắng vui nhộn', price: 200, rarity: 'rare', category: 'sound', meta_value: '{"url": "tada", "required_level": 5}', is_active: true },
  { id: 'sound_chime', name: 'Chuông gió', description: 'Tiếng chuông gió nhẹ nhàng thanh thoát', price: 250, rarity: 'rare', category: 'sound', meta_value: '{"url": "chime", "required_level": 5}', is_active: true },
  { id: 'sound_bell', name: 'Chuông nhà thờ', description: 'Tiếng chuông ngân vang trang trọng', price: 300, rarity: 'rare', category: 'sound', meta_value: '{"url": "bell", "required_level": 10}', is_active: true },
  { id: 'sound_xylophone', name: 'Đàn mộc cầm', description: 'Giai điệu xylophone vui tươi', price: 350, rarity: 'rare', category: 'sound', meta_value: '{"url": "xylophone", "required_level": 10}', is_active: true },

  // Epic
  { id: 'sound_cyber', name: 'Cyberpunk', description: 'Âm thanh điện tử tương lai', price: 500, rarity: 'epic', category: 'sound', meta_value: '{"url": "cyber", "required_level": 20}', is_active: true },
  { id: 'sound_nature', name: 'Thiên nhiên', description: 'Tiếng chim hót và suối chảy', price: 500, rarity: 'epic', category: 'sound', meta_value: '{"url": "nature", "required_level": 20}', is_active: true },
  { id: 'sound_zen', name: 'Thiền định', description: 'Âm thanh tĩnh lặng thư thái', price: 600, rarity: 'epic', category: 'sound', meta_value: '{"url": "zen", "required_level": 25}', is_active: true },
  { id: 'sound_crystal', name: 'Pha lê', description: 'Tiếng pha lê trong veo cao quý', price: 700, rarity: 'epic', category: 'sound', meta_value: '{"url": "crystal", "required_level": 25}', is_active: true },

  // Legendary
  { id: 'sound_epic', name: 'Khải hoàn', description: 'Bản nhạc chiến thắng hoành tráng', price: 1000, rarity: 'legendary', category: 'sound', meta_value: '{"url": "epic", "required_level": 40}', is_active: true },
  { id: 'sound_mystical', name: 'Huyền bí', description: 'Âm thanh ma thuật huyền ảo', price: 1200, rarity: 'legendary', category: 'sound', meta_value: '{"url": "mystical", "required_level": 50}', is_active: true },

  // ── Premium Themes (Plus/Pro only) ──
  { id: 'premium_galaxy', name: 'Ngân Hà', description: 'Dải ngân hà tím huyền ảo', price: 2000, rarity: 'legendary', category: 'theme', preview_color: '#6d28d9', meta_value: '{"primary": "#6d28d9", "required_level": 30, "required_tier": "plus"}', is_active: true },
  { id: 'premium_storm', name: 'Bão Điện', description: 'Cơn bão sét xanh điện khí', price: 2500, rarity: 'legendary', category: 'theme', preview_color: '#0284c7', meta_value: '{"primary": "#0284c7", "required_level": 35, "required_tier": "plus"}', is_active: true },
  { id: 'premium_ember', name: 'Hồng Lửa', description: 'Ngọn lửa hồng rực cháy', price: 2000, rarity: 'legendary', category: 'theme', preview_color: '#e11d48', meta_value: '{"primary": "#e11d48", "required_level": 30, "required_tier": "plus"}', is_active: true },
  { id: 'premium_aurora_green', name: 'Cực Quang Xanh', description: 'Cực quang xanh lục bảo', price: 3000, rarity: 'legendary', category: 'theme', preview_color: '#10b981', meta_value: '{"primary": "#10b981", "required_level": 40, "required_tier": "plus"}', is_active: true },
  { id: 'premium_nebula', name: 'Tinh Vân', description: 'Tinh vân hồng tím ngoài không gian', price: 2500, rarity: 'legendary', category: 'theme', preview_color: '#a21caf', meta_value: '{"primary": "#a21caf", "required_level": 35, "required_tier": "plus"}', is_active: true },
  { id: 'premium_frost', name: 'Băng Giá', description: 'Băng giá xanh teal lạnh lẽo', price: 2000, rarity: 'legendary', category: 'theme', preview_color: '#0891b2', meta_value: '{"primary": "#0891b2", "required_level": 30, "required_tier": "plus"}', is_active: true },
  { id: 'premium_dragon', name: 'Huyết Long', description: 'Máu rồng đỏ thẫm quyền năng', price: 4000, rarity: 'legendary', category: 'theme', preview_color: '#b91c1c', meta_value: '{"primary": "#b91c1c", "required_level": 50, "required_tier": "pro"}', is_active: true },
  { id: 'premium_heaven', name: 'Thiên Giới', description: 'Ánh sáng vàng từ thiên đường', price: 4500, rarity: 'legendary', category: 'theme', preview_color: '#fde047', meta_value: '{"primary": "#fde047", "required_level": 55, "required_tier": "pro"}', is_active: true },
  { id: 'premium_void', name: 'Hư Vô', description: 'Khoảng không vô tận tĩnh lặng', price: 4000, rarity: 'legendary', category: 'theme', preview_color: '#4338ca', meta_value: '{"primary": "#4338ca", "required_level": 50, "required_tier": "pro"}', is_active: true },
  { id: 'premium_divine', name: 'Ánh Sáng', description: 'Ánh sáng thần thánh tím nhẹ', price: 5000, rarity: 'legendary', category: 'theme', preview_color: '#c084fc', meta_value: '{"primary": "#c084fc", "required_level": 60, "required_tier": "pro"}', is_active: true },
];

export async function seedShopItems() {
  const { error } = await supabase.from('shop_items').upsert(sampleItems);
  if (error) throw error;
  return sampleItems;
}
