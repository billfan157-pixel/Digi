-- 1. Thêm cột equipped_notification_sound vào profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS equipped_notification_sound TEXT DEFAULT NULL;

-- 2. Seed âm thanh thông báo vào shop_items
INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, is_active)
VALUES
  -- Common
  ('sound_water_drop', 'Giọt nước', 'Tiếng giọt nước trong trẻo mặc định', 0, 'common', 'sound', '{"url": "water_drop", "required_level": 1}', true),
  ('sound_bubble', 'Bong bóng', 'Tiếng bong bóng nước vui tai', 100, 'common', 'sound', '{"url": "bubble", "required_level": 1}', true),
  ('sound_pop', 'Pop nhẹ', 'Tiếng pop nhẹ nhàng tối giản', 100, 'common', 'sound', '{"url": "pop", "required_level": 1}', true),
  ('sound_click', 'Click điện tử', 'Tiếng click digital hiện đại', 150, 'common', 'sound', '{"url": "click", "required_level": 1}', true),

  -- Rare
  ('sound_tada', 'Tada!', 'Âm thanh chiến thắng vui nhộn', 200, 'rare', 'sound', '{"url": "tada", "required_level": 5}', true),
  ('sound_chime', 'Chuông gió', 'Tiếng chuông gió nhẹ nhàng thanh thoát', 250, 'rare', 'sound', '{"url": "chime", "required_level": 5}', true),
  ('sound_bell', 'Chuông nhà thờ', 'Tiếng chuông ngân vang trang trọng', 300, 'rare', 'sound', '{"url": "bell", "required_level": 10}', true),
  ('sound_xylophone', 'Đàn mộc cầm', 'Giai điệu xylophone vui tươi', 350, 'rare', 'sound', '{"url": "xylophone", "required_level": 10}', true),

  -- Epic
  ('sound_cyber', 'Cyberpunk', 'Âm thanh điện tử tương lai', 500, 'epic', 'sound', '{"url": "cyber", "required_level": 20}', true),
  ('sound_nature', 'Thiên nhiên', 'Tiếng chim hót và suối chảy', 500, 'epic', 'sound', '{"url": "nature", "required_level": 20}', true),
  ('sound_zen', 'Thiền định', 'Âm thanh tĩnh lặng thư thái', 600, 'epic', 'sound', '{"url": "zen", "required_level": 25}', true),
  ('sound_crystal', 'Pha lê', 'Tiếng pha lê trong veo cao quý', 700, 'epic', 'sound', '{"url": "crystal", "required_level": 25}', true),

  -- Legendary
  ('sound_epic', 'Khải hoàn', 'Bản nhạc chiến thắng hoành tráng', 1000, 'legendary', 'sound', '{"url": "epic", "required_level": 40}', true),
  ('sound_mystical', 'Huyền bí', 'Âm thanh ma thuật huyền ảo', 1200, 'legendary', 'sound', '{"url": "mystical", "required_level": 50}', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  meta_value = EXCLUDED.meta_value,
  is_active = EXCLUDED.is_active;
