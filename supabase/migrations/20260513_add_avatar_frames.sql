-- 1. Thêm cột equipped_frame_id vào profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS equipped_frame_id TEXT DEFAULT NULL;

-- 2. Seed 8 khung viền sức khỏe vào shop_items
INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, preview_color, is_active)
VALUES
  ('frame_aqua_pulse',   'Nhịp Nước',              'Khung viền xanh dương nhịp đập, dành cho người yêu nước',     0,    'common',    'frame', '{"required_level": 1}',  '#22d3ee', true),
  ('frame_deep_ocean',   'Đại Dương Sâu',          'Hào quang đại dương sâu thẳm, xoáy quanh avatar',          200,    'rare',      'frame', '{"required_level": 5}',  '#3b82f6', true),
  ('frame_heartbeat',    'Nhịp Tim',               'Khung viền đập theo nhịp tim, thể hiện sức sống',          300,    'rare',      'frame', '{"required_level": 10}', '#fb7185', true),
  ('frame_energy_aura',  'Hào Quang Năng Lượng',   'Vòng năng lượng vàng xoáy, cho người vận động',            400,    'epic',      'frame', '{"required_level": 15}', '#fbbf24', true),
  ('frame_zen_garden',   'Vườn Thiền',             'Hào quang xanh lá nhẹ nhàng, thư thái',                    350,    'rare',      'frame', '{"required_level": 10}', '#34d399', true),
  ('frame_aurora',       'Cực Quang',              'Vòng xoáy cầu vồng cực quang huyền bí',                    800,    'epic',      'frame', '{"required_level": 30}', '#a78bfa', true),
  ('frame_fire_streak',  'Ngọn Lửa Streak',       'Hào quang lửa cho người giữ streak mạnh',                  600,    'epic',      'frame', '{"required_level": 20}', '#f97316', true),
  ('frame_diamond',      'Kim Cương Kỷ Luật',     'Khung kim cương lấp lánh, biểu tượng kỷ luật tối cao',    1500,    'legendary', 'frame', '{"required_level": 50}', '#7dd3fc', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  meta_value = EXCLUDED.meta_value,
  preview_color = EXCLUDED.preview_color,
  is_active = EXCLUDED.is_active;
