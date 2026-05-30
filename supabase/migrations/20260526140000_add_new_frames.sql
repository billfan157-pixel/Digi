-- Thêm 5 khung viền thường + 5 khung viền premium vào shop_items

INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, preview_color, is_active)
VALUES
  -- ── 5 Khung thường ──
  ('frame_bamboo',       'Tre Trúc',          'Đốt tre xanh mát xoay quanh avatar',                 150,   'common',    'frame', '{"required_level": 1}',   '#10b981', true),
  ('frame_sunset',       'Hoàng Hôn',         'Vòng cung hoàng hôn ấm áp',                           250,   'rare',      'frame', '{"required_level": 8}',   '#f97316', true),
  ('frame_ice_crystal',  'Băng Tinh',          'Bông tuyết tinh thể xoay quanh avatar',              350,   'rare',      'frame', '{"required_level": 12}',  '#67e8f9', true),
  ('frame_thunder',      'Sấm Sét',            'Tia chớp điện nhấp nháy đầy năng lượng',              500,   'epic',      'frame', '{"required_level": 18}',  '#facc15', true),
  ('frame_galaxy_swirl', 'Xoáy Ngân Hà',       'Xoáy thiên hà tím huyền ảo ngoài không gian',         1000,  'legendary', 'frame', '{"required_level": 35}',  '#8b5cf6', true),

  -- ── 5 Khung Premium (Plus/Pro) ──
  ('frame_premium_silver',   'Bạc Quý',        'Ánh bạc sang trọng tinh tế',                          1200,  'epic',      'frame', '{"required_level": 20, "required_tier": "plus"}',  '#cbd5e1', true),
  ('frame_premium_gold',     'Hoàng Kim',      'Ánh vàng lấp lánh đẳng cấp',                          1500,  'legendary', 'frame', '{"required_level": 30, "required_tier": "plus"}',  '#fbbf24', true),
  ('frame_premium_phoenix',  'Phượng Hoàng',   'Lửa thiêng phượng hoàng rực cháy',                    2000,  'legendary', 'frame', '{"required_level": 35, "required_tier": "plus"}',  '#ef4444', true),
  ('frame_premium_lunar',    'Nguyệt Cầu',     'Trăng sao huyền ảo giữa bầu trời',                    1800,  'legendary', 'frame', '{"required_level": 30, "required_tier": "plus"}',  '#818cf8', true),
  ('frame_premium_dragon',   'Long Thần',      'Rồng thiêng uy nghi quyền năng tối thượng',            5000,  'mythic',    'frame', '{"required_level": 50, "required_tier": "pro"}',    '#f59e0b', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  meta_value = EXCLUDED.meta_value,
  preview_color = EXCLUDED.preview_color,
  is_active = EXCLUDED.is_active;
