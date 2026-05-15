-- 1. Thêm cột equipped_theme_id vào profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS equipped_theme_id TEXT DEFAULT 'theme_default';

-- 2. Seed các Theme Premium vào shop_items
INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, preview_color, is_active)
VALUES
  ('theme_default',   'Mặc định',        'Giao diện mặc định của DigiWell',              0,    'common',    'theme', '{}', '#22d3ee', true),
  ('theme_cyber',     'Cyber Neon',      'Ánh sáng neon từ tương lai số',               300,    'rare',      'theme', '{}', '#f0abfc', true),
  ('theme_emerald',   'Rừng Nhiệt Đới',   'Sắc xanh tươi mát của thiên nhiên',           300,    'rare',      'theme', '{}', '#34d399', true),
  ('theme_midnight',  'Nửa Đêm',         'Sự tĩnh lặng của màn đêm huyền bí',           500,    'epic',      'theme', '{}', '#818cf8', true),
  ('theme_sunset',    'Hoàng Hôn',       'Sắc cam ấm áp của buổi chiều tà',             500,    'epic',      'theme', '{}', '#fb923c', true),
  ('theme_aurora',    'Cực Quang',       'Dải sáng huyền ảo trên bầu trời Bắc Cực',     800,    'legendary', 'theme', '{}', '#a78bfa', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  preview_color = EXCLUDED.preview_color,
  is_active = EXCLUDED.is_active;
