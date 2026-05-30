-- Update shop_items.meta_value with full theme config for all themes
-- This allows dynamic theme loading from server without app updates

-- Update existing theme_default - merge with existing meta_value to preserve required_level
UPDATE shop_items 
SET meta_value = (meta_value::jsonb || jsonb_build_object(
  'id', 'theme_default',
  'name', 'Mặc định',
  'blurLevel', '20px',
  'effect', 'none',
  'borderRadius', '16px',
  'borderWidth', '1px',
  'glassOpacity', '0.04',
  'glassPattern', 'none',
  'glassGlowIntensity', 0.15,
  'glassInnerGlow', false,
  'glassHoverEffect', 'opacity',
  'colors', jsonb_build_object(
    'accent', '#22d3ee',
    'accentContrast', '#06121a',
    'surface1', 'rgba(34,211,238,0.03)',
    'surface2', 'rgba(34,211,238,0.05)',
    'surface3', 'rgba(34,211,238,0.08)',
    'surfaceGlass', 'rgba(34,211,238,0.04)',
    'borderGlass', 'rgba(34,211,238,0.1)',
    'bgGradient', 'radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%)',
    'glowColor', 'rgba(34,211,238,0.15)'
  )
)::text
WHERE id = 'theme_default';

-- Insert remaining themes that don't exist in shop_items
INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, preview_color, is_active)
VALUES
  ('th_cyan', 'Hồ Thủy Tiên', 'Sắc xanh dịu mát của hồ nước tiên', 200, 'common', 'theme', 
    jsonb_build_object(
      'required_level', 1,
      'id', 'th_cyan',
      'name', 'Hồ Thủy Tiên',
      'blurLevel', '16px',
      'effect', 'water-ripples',
      'borderRadius', '40px',
      'borderWidth', '1.5px',
      'glassOpacity', '0.06',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.2,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(14,165,233,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#0ea5e9',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(14,165,233,0.05)',
        'surface2', 'rgba(14,165,233,0.08)',
        'surface3', 'rgba(14,165,233,0.12)',
        'surfaceGlass', 'rgba(14,165,233,0.06)',
        'borderGlass', 'rgba(14,165,233,0.2)',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #0c4a6e 0%, #020617 100%)',
        'glowColor', 'rgba(14,165,233,0.15)'
      )
    ), '#0ea5e9', true),

  ('th_emerald', 'Lục Bảo', 'Sắc xanh lục bảo quý giá', 200, 'common', 'theme',
    jsonb_build_object(
      'required_level', 1,
      'id', 'th_emerald',
      'name', 'Lục Bảo',
      'blurLevel', '24px',
      'effect', 'floating-particles',
      'borderRadius', '32px',
      'borderWidth', '1px',
      'glassOpacity', '0.05',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.25,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(16,185,129,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#10b981',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(16,185,129,0.05)',
        'surface2', 'rgba(16,185,129,0.08)',
        'surface3', 'rgba(16,185,129,0.12)',
        'surfaceGlass', 'rgba(16,185,129,0.06)',
        'borderGlass', 'rgba(16,185,129,0.2)',
        'bgGradient', 'linear-gradient(180deg, #064e3b 0%, #020617 100%)',
        'glowColor', 'rgba(16,185,129,0.25)'
      )
    ), '#10b981', true),

  ('th_gold', 'Hoàng Kim', 'Sức mạnh của vàng quý', 500, 'epic', 'theme',
    jsonb_build_object(
      'required_level', 15,
      'id', 'th_gold',
      'name', 'Hoàng Kim',
      'blurLevel', '24px',
      'effect', 'golden-rays',
      'borderRadius', '12px',
      'borderWidth', '3px',
      'glassOpacity', '0.1',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.4,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(234,179,8,0.2), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#eab308',
        'accentContrast', '#422006',
        'surface1', 'rgba(234,179,8,0.08)',
        'surface2', 'rgba(234,179,8,0.12)',
        'surface3', 'rgba(234,179,8,0.16)',
        'surfaceGlass', 'rgba(234,179,8,0.1)',
        'borderGlass', '#eab308',
        'bgGradient', 'conic-gradient(from 180deg at 50% 0%, #422006, #713f12, #020617, #713f12, #422006)',
        'glowColor', 'rgba(234,179,8,0.4)'
      )
    ), '#eab308', true),

  ('th_purple', 'Màn Đêm', 'Sự huyền bí của màn đêm', 300, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'th_purple',
      'name', 'Màn Đêm',
      'blurLevel', '30px',
      'effect', 'space-stars',
      'borderRadius', '14px',
      'borderWidth', '1px',
      'glassOpacity', '0.04',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.2,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(168,85,247,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#a855f7',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(168,85,247,0.05)',
        'surface2', 'rgba(168,85,247,0.08)',
        'surface3', 'rgba(168,85,247,0.12)',
        'surfaceGlass', 'rgba(168,85,247,0.06)',
        'borderGlass', 'rgba(168,85,247,0.15)',
        'bgGradient', 'linear-gradient(180deg, #3b0764 0%, #020617 100%)',
        'glowColor', 'rgba(168,85,247,0.2)'
      )
    ), '#a855f7', true),

  ('th_rose', 'Hoa Hồng Máu', 'Sắc đỏ rực rỡ của hoa hồng', 300, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'th_rose',
      'name', 'Hoa Hồng Máu',
      'blurLevel', '20px',
      'effect', 'fire-embers',
      'borderRadius', '8px',
      'borderWidth', '2px',
      'glassOpacity', '0.06',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.3,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(244,63,94,0.1), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#f43f5e',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(244,63,94,0.05)',
        'surface2', 'rgba(244,63,94,0.08)',
        'surface3', 'rgba(244,63,94,0.12)',
        'surfaceGlass', 'rgba(244,63,94,0.06)',
        'borderGlass', '#f43f5e',
        'bgGradient', 'radial-gradient(circle at 50% -10%, #4c0519 0%, #020617 100%)',
        'glowColor', 'rgba(244,63,94,0.3)'
      )
    ), '#f43f5e', true),

  ('theme_abyss', 'Vực Thẳm Không Gian', 'Độ sâu vô tận của không gian', 800, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 30,
      'id', 'theme_abyss',
      'name', 'Vực Thẳm Không Gian',
      'blurLevel', '40px',
      'effect', 'space-stars',
      'borderRadius', '24px',
      'borderWidth', '0px',
      'glassOpacity', '0.8',
      'glassPattern', 'none',
      'glassGlowIntensity', 0.6,
      'glassInnerGlow', true,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#6366f1',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(99,102,241,0.06)',
        'surface2', 'rgba(99,102,241,0.1)',
        'surface3', 'rgba(99,102,241,0.14)',
        'surfaceGlass', 'rgba(0,0,0,0.85)',
        'borderGlass', 'rgba(99,102,241,0.4)',
        'bgGradient', 'black',
        'glowColor', 'rgba(99,102,241,0.6)'
      )
    ), '#6366f1', true),

  ('theme_cyan', 'Xanh Cyan', 'Cyberpunk style với sắc cyan', 400, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_cyan',
      'name', 'Xanh Cyan',
      'blurLevel', '12px',
      'effect', 'cyber-grid',
      'borderRadius', '4px',
      'borderWidth', '2px',
      'glassOpacity', '0.1',
      'glassPattern', 'grid',
      'glassGlowIntensity', 0.4,
      'glassInnerGlow', false,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#06b6d4',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(6,182,212,0.08)',
        'surface2', 'rgba(6,182,212,0.12)',
        'surface3', 'rgba(6,182,212,0.16)',
        'surfaceGlass', 'rgba(6,182,212,0.1)',
        'borderGlass', '#06b6d4',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #083344 0%, #020617 100%)',
        'glowColor', 'rgba(6,182,212,0.4)'
      )
    ), '#06b6d4', true),

  ('theme_cyber', 'Cyber Neon', 'Neon hồng rực rỡ', 400, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_cyber',
      'name', 'Cyber Neon',
      'blurLevel', '10px',
      'effect', 'cyber-grid',
      'borderRadius', '2px',
      'borderWidth', '2px',
      'glassOpacity', '0.12',
      'glassPattern', 'grid',
      'glassGlowIntensity', 0.5,
      'glassInnerGlow', false,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#f0abfc',
        'accentContrast', '#000000',
        'surface1', 'rgba(240,171,252,0.08)',
        'surface2', 'rgba(240,171,252,0.12)',
        'surface3', 'rgba(240,171,252,0.16)',
        'surfaceGlass', 'rgba(240,171,252,0.12)',
        'borderGlass', '#f0abfc',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #2e1065 0%, #020617 100%)',
        'glowColor', 'rgba(240,171,252,0.5)'
      )
    ), '#f0abfc', true),

  ('theme_cyberpunk', 'Cyberpunk 2077', 'Cyberpunk tối thượng', 600, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 25,
      'id', 'theme_cyberpunk',
      'name', 'Cyberpunk 2077',
      'blurLevel', '8px',
      'effect', 'cyber-grid',
      'borderRadius', '0px',
      'borderWidth', '3px',
      'glassOpacity', '0.15',
      'glassPattern', 'grid',
      'glassGlowIntensity', 0.6,
      'glassInnerGlow', false,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#d946ef',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(217,70,239,0.08)',
        'surface2', 'rgba(217,70,239,0.12)',
        'surface3', 'rgba(217,70,239,0.16)',
        'surfaceGlass', 'rgba(217,70,239,0.15)',
        'borderGlass', '#d946ef',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #4a044e 0%, #020617 100%)',
        'glowColor', 'rgba(217,70,239,0.6)'
      )
    ), '#d946ef', true),

  ('theme_forest', 'Rừng Nguyên Sinh', 'Sắc xanh đậm của rừng nguyên sinh', 300, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_forest',
      'name', 'Rừng Nguyên Sinh',
      'blurLevel', '22px',
      'effect', 'floating-particles',
      'borderRadius', '36px',
      'borderWidth', '1.5px',
      'glassOpacity', '0.05',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.2,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(5,150,105,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#059669',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(5,150,105,0.05)',
        'surface2', 'rgba(5,150,105,0.08)',
        'surface3', 'rgba(5,150,105,0.12)',
        'surfaceGlass', 'rgba(5,150,105,0.06)',
        'borderGlass', 'rgba(5,150,105,0.2)',
        'bgGradient', 'linear-gradient(180deg, #14532d 0%, #020617 100%)',
        'glowColor', 'rgba(5,150,105,0.2)'
      )
    ), '#059669', true),

  ('theme_midnight', 'Sự Tĩnh Lặng', 'Sự bình yên của màn đêm', 500, 'epic', 'theme',
    jsonb_build_object(
      'required_level', 15,
      'id', 'theme_midnight',
      'name', 'Sự Tĩnh Lặng',
      'blurLevel', '28px',
      'effect', 'space-stars',
      'borderRadius', '12px',
      'borderWidth', '1px',
      'glassOpacity', '0.03',
      'glassPattern', 'none',
      'glassGlowIntensity', 0.15,
      'glassInnerGlow', false,
      'glassHoverEffect', 'opacity',
      'colors', jsonb_build_object(
        'accent', '#818cf8',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(129,140,248,0.04)',
        'surface2', 'rgba(129,140,248,0.07)',
        'surface3', 'rgba(129,140,248,0.1)',
        'surfaceGlass', 'rgba(129,140,248,0.05)',
        'borderGlass', 'rgba(129,140,248,0.15)',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)',
        'glowColor', 'rgba(129,140,248,0.15)'
      )
    ), '#818cf8', true),

  ('theme_ocean', 'Đại Dương Xanh', 'Sắc xanh sâu thẳm của đại dương', 300, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_ocean',
      'name', 'Đại Dương Xanh',
      'blurLevel', '20px',
      'effect', 'water-ripples',
      'borderRadius', '24px',
      'borderWidth', '1px',
      'glassOpacity', '0.06',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.25,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(59,130,246,0.15), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#3b82f6',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(59,130,246,0.05)',
        'surface2', 'rgba(59,130,246,0.08)',
        'surface3', 'rgba(59,130,246,0.12)',
        'surfaceGlass', 'rgba(59,130,246,0.06)',
        'borderGlass', 'rgba(59,130,246,0.25)',
        'bgGradient', 'radial-gradient(circle at 50% 10%, #172554 0%, #020617 100%)',
        'glowColor', 'rgba(59,130,246,0.25)'
      )
    ), '#3b82f6', true),

  ('theme_red', 'Đỏ Thẫm', 'Sắc đỏ thẫm mạnh mẽ', 300, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_red',
      'name', 'Đỏ Thẫm',
      'blurLevel', '16px',
      'effect', 'fire-embers',
      'borderRadius', '6px',
      'borderWidth', '2px',
      'glassOpacity', '0.1',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.3,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(220,38,38,0.1), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#dc2626',
        'accentContrast', '#ffffff',
        'surface1', 'rgba(220,38,38,0.05)',
        'surface2', 'rgba(220,38,38,0.08)',
        'surface3', 'rgba(220,38,38,0.12)',
        'surfaceGlass', 'rgba(220,38,38,0.06)',
        'borderGlass', '#dc2626',
        'bgGradient', 'linear-gradient(180deg, #450a0a 0%, #020617 100%)',
        'glowColor', 'rgba(220,38,38,0.3)'
      )
    ), '#dc2626', true),

  ('theme_royal', 'Đế Vương Hoàng Gia', 'Sức mạnh của hoàng gia', 800, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 30,
      'id', 'theme_royal',
      'name', 'Đế Vương Hoàng Gia',
      'blurLevel', '26px',
      'effect', 'golden-rays',
      'borderRadius', '16px',
      'borderWidth', '4px',
      'glassOpacity', '0.12',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.5,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(251,191,36,0.25), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#fbbf24',
        'accentContrast', '#451a03',
        'surface1', 'rgba(251,191,36,0.08)',
        'surface2', 'rgba(251,191,36,0.12)',
        'surface3', 'rgba(251,191,36,0.16)',
        'surfaceGlass', 'rgba(251,191,36,0.12)',
        'borderGlass', '#fbbf24',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #78350f 0%, #020617 100%)',
        'glowColor', 'rgba(251,191,36,0.5)'
      )
    ), '#fbbf24', true),

  ('theme_sakura', 'Hoa Anh Đào', 'Sắc hồng dịu dàng của hoa anh đào', 400, 'rare', 'theme',
    jsonb_build_object(
      'required_level', 10,
      'id', 'theme_sakura',
      'name', 'Hoa Anh Đào',
      'blurLevel', '22px',
      'effect', 'floating-particles',
      'borderRadius', '40px',
      'borderWidth', '1.5px',
      'glassOpacity', '0.04',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.2,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(251,207,232,0.15), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#fbcfe8',
        'accentContrast', '#500724',
        'surface1', 'rgba(251,207,232,0.05)',
        'surface2', 'rgba(251,207,232,0.08)',
        'surface3', 'rgba(251,207,232,0.12)',
        'surfaceGlass', 'rgba(251,207,232,0.06)',
        'borderGlass', 'rgba(251,207,232,0.2)',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #500724 0%, #020617 100%)',
        'glowColor', 'rgba(251,207,232,0.2)'
      )
    ), '#fbcfe8', true),

  ('theme_yellow', 'Vàng Chanh', 'Sắc vàng tươi sáng', 200, 'common', 'theme',
    jsonb_build_object(
      'required_level', 1,
      'id', 'theme_yellow',
      'name', 'Vàng Chanh',
      'blurLevel', '24px',
      'effect', 'golden-rays',
      'borderRadius', '28px',
      'borderWidth', '1px',
      'glassOpacity', '0.05',
      'glassPattern', 'gradient',
      'glassGlowIntensity', 0.2,
      'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(253,224,71,0.15), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#fde047',
        'accentContrast', '#422006',
        'surface1', 'rgba(253,224,71,0.05)',
        'surface2', 'rgba(253,224,71,0.08)',
        'surface3', 'rgba(253,224,71,0.12)',
        'surfaceGlass', 'rgba(253,224,71,0.06)',
        'borderGlass', 'rgba(253,224,71,0.2)',
        'bgGradient', 'radial-gradient(circle at 50% -10%, #422006 0%, #020617 100%)',
        'glowColor', 'rgba(253,224,71,0.2)'
      )
    ), '#fde047', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  meta_value = EXCLUDED.meta_value,
  preview_color = EXCLUDED.preview_color,
  is_active = EXCLUDED.is_active;

-- Update existing themes in shop_items with full config - preserve existing fields like required_level
UPDATE shop_items
SET meta_value = (meta_value::jsonb || CASE
  WHEN id = 'theme_cyber' THEN jsonb_build_object(
    'id', 'theme_cyber',
    'name', 'Cyber Neon',
    'blurLevel', '10px',
    'effect', 'cyber-grid',
    'borderRadius', '2px',
    'borderWidth', '2px',
    'glassOpacity', '0.12',
    'glassPattern', 'grid',
    'glassGlowIntensity', 0.5,
    'glassInnerGlow', false,
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#f0abfc',
      'accentContrast', '#000000',
      'surface1', 'rgba(240,171,252,0.08)',
      'surface2', 'rgba(240,171,252,0.12)',
      'surface3', 'rgba(240,171,252,0.16)',
      'surfaceGlass', 'rgba(240,171,252,0.12)',
      'borderGlass', '#f0abfc',
      'bgGradient', 'radial-gradient(circle at 50% -20%, #2e1065 0%, #020617 100%)',
      'glowColor', 'rgba(240,171,252,0.5)'
    )
  )
  WHEN id = 'theme_emerald' THEN jsonb_build_object(
    'id', 'theme_emerald',
    'name', 'Rừng Nhiệt Đới',
    'blurLevel', '26px',
    'effect', 'floating-particles',
    'borderRadius', '48px',
    'borderWidth', '1px',
    'glassOpacity', '0.04',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.2,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(34,197,94,0.15), transparent)',
    'glassHoverEffect', 'brightness',
    'colors', jsonb_build_object(
      'accent', '#22c55e',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(34,197,94,0.05)',
      'surface2', 'rgba(34,197,94,0.08)',
      'surface3', 'rgba(34,197,94,0.12)',
      'surfaceGlass', 'rgba(34,197,94,0.06)',
      'borderGlass', 'rgba(34,197,94,0.2)',
      'bgGradient', 'radial-gradient(circle at 50% 0%, #052e16 0%, #020617 100%)',
      'glowColor', 'rgba(34,197,94,0.2)'
    )
  )
  WHEN id = 'theme_midnight' THEN jsonb_build_object(
    'id', 'theme_midnight',
    'name', 'Sự Tĩnh Lặng',
    'blurLevel', '28px',
    'effect', 'space-stars',
    'borderRadius', '12px',
    'borderWidth', '1px',
    'glassOpacity', '0.03',
    'glassPattern', 'none',
    'glassGlowIntensity', 0.15,
    'glassInnerGlow', false,
    'glassHoverEffect', 'opacity',
    'colors', jsonb_build_object(
      'accent', '#818cf8',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(129,140,248,0.04)',
      'surface2', 'rgba(129,140,248,0.07)',
      'surface3', 'rgba(129,140,248,0.1)',
      'surfaceGlass', 'rgba(129,140,248,0.05)',
      'borderGlass', 'rgba(129,140,248,0.15)',
      'bgGradient', 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)',
      'glowColor', 'rgba(129,140,248,0.15)'
    )
  )
  WHEN id = 'theme_sunset' THEN jsonb_build_object(
    'id', 'theme_sunset',
    'name', 'Hoàng Hôn',
    'blurLevel', '20px',
    'effect', 'fire-embers',
    'borderRadius', '20px',
    'borderWidth', '1.5px',
    'glassOpacity', '0.08',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.25,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(249,115,22,0.15), transparent)',
    'glassHoverEffect', 'brightness',
    'colors', jsonb_build_object(
      'accent', '#f97316',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(249,115,22,0.06)',
      'surface2', 'rgba(249,115,22,0.1)',
      'surface3', 'rgba(249,115,22,0.14)',
      'surfaceGlass', 'rgba(249,115,22,0.08)',
      'borderGlass', 'rgba(249,115,22,0.3)',
      'bgGradient', 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #020617 100%)',
      'glowColor', 'rgba(249,115,22,0.25)'
    )
  )
  WHEN id = 'theme_aurora' THEN jsonb_build_object(
    'id', 'theme_aurora',
    'name', 'Cực Quang',
    'blurLevel', '22px',
    'effect', 'aurora-waves',
    'borderRadius', '30px',
    'borderWidth', '1px',
    'glassOpacity', '0.05',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.3,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(167,139,250,0.2), rgba(232,121,249,0.1), transparent)',
    'glassHoverEffect', 'brightness',
    'colors', jsonb_build_object(
      'accent', '#a78bfa',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(167,139,250,0.06)',
      'surface2', 'rgba(167,139,250,0.09)',
      'surface3', 'rgba(167,139,250,0.12)',
      'surfaceGlass', 'rgba(167,139,250,0.08)',
      'borderGlass', 'rgba(255,255,255,0.25)',
      'bgGradient', 'conic-gradient(from 180deg at 50% 0%, #1e1b4b, #2e1065, #020617, #083344, #1e1b4b)',
      'glowColor', 'rgba(167,139,250,0.3)'
    )
  )
  ELSE '{}'::jsonb
END)::text
WHERE category = 'theme';
