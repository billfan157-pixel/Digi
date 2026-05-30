-- 10 Premium Themes cho Plus/Pro subscribers

INSERT INTO shop_items (id, name, description, price, rarity, category, meta_value, preview_color, is_active)
VALUES
  -- Plus tier (6 themes)
  ('premium_galaxy', 'Ngân Hà', 'Dải ngân hà tím huyền ảo', 2000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 30, 'required_tier', 'plus',
      'id', 'premium_galaxy', 'name', 'Ngân Hà',
      'blurLevel', '28px', 'effect', 'aurora-waves',
      'borderRadius', '24px', 'borderWidth', '2px', 'glassOpacity', '0.06',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.4, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(109,40,217,0.2), rgba(124,58,237,0.1), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#6d28d9', 'accentContrast', '#ffffff',
        'surface1', 'rgba(109,40,217,0.07)', 'surface2', 'rgba(109,40,217,0.11)', 'surface3', 'rgba(109,40,217,0.15)',
        'surfaceGlass', 'rgba(109,40,217,0.08)', 'borderGlass', '#6d28d9',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1e0033 40%, #020617 100%)',
        'glowColor', 'rgba(109,40,217,0.4)'
      )
    ), '#6d28d9', true),

  ('premium_storm', 'Bão Điện', 'Cơn bão sét xanh điện khí', 2500, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 35, 'required_tier', 'plus',
      'id', 'premium_storm', 'name', 'Bão Điện',
      'blurLevel', '12px', 'effect', 'cyber-grid',
      'borderRadius', '4px', 'borderWidth', '2px', 'glassOpacity', '0.12',
      'glassPattern', 'grid', 'glassGlowIntensity', 0.5, 'glassInnerGlow', false,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#0284c7', 'accentContrast', '#ffffff',
        'surface1', 'rgba(2,132,199,0.08)', 'surface2', 'rgba(2,132,199,0.12)', 'surface3', 'rgba(2,132,199,0.16)',
        'surfaceGlass', 'rgba(2,132,199,0.1)', 'borderGlass', '#0284c7',
        'bgGradient', 'radial-gradient(circle at 50% -10%, #0c4a6e 0%, #020617 100%)',
        'glowColor', 'rgba(2,132,199,0.5)'
      )
    ), '#0284c7', true),

  ('premium_ember', 'Hồng Lửa', 'Ngọn lửa hồng rực cháy', 2000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 30, 'required_tier', 'plus',
      'id', 'premium_ember', 'name', 'Hồng Lửa',
      'blurLevel', '18px', 'effect', 'fire-embers',
      'borderRadius', '10px', 'borderWidth', '2px', 'glassOpacity', '0.08',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.45, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(225,29,72,0.2), rgba(244,63,94,0.1), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#e11d48', 'accentContrast', '#ffffff',
        'surface1', 'rgba(225,29,72,0.06)', 'surface2', 'rgba(225,29,72,0.1)', 'surface3', 'rgba(225,29,72,0.14)',
        'surfaceGlass', 'rgba(225,29,72,0.08)', 'borderGlass', '#e11d48',
        'bgGradient', 'radial-gradient(circle at 50% -10%, #4c0519 0%, #2d000e 40%, #020617 100%)',
        'glowColor', 'rgba(225,29,72,0.45)'
      )
    ), '#e11d48', true),

  ('premium_aurora_green', 'Cực Quang Xanh', 'Cực quang xanh lục bảo', 3000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 40, 'required_tier', 'plus',
      'id', 'premium_aurora_green', 'name', 'Cực Quang Xanh',
      'blurLevel', '26px', 'effect', 'aurora-waves',
      'borderRadius', '36px', 'borderWidth', '1.5px', 'glassOpacity', '0.05',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.35, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(16,185,129,0.2), rgba(5,150,105,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#10b981', 'accentContrast', '#ffffff',
        'surface1', 'rgba(16,185,129,0.06)', 'surface2', 'rgba(16,185,129,0.09)', 'surface3', 'rgba(16,185,129,0.13)',
        'surfaceGlass', 'rgba(16,185,129,0.07)', 'borderGlass', '#10b981',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 40%, #020617 100%)',
        'glowColor', 'rgba(16,185,129,0.35)'
      )
    ), '#10b981', true),

  ('premium_nebula', 'Tinh Vân', 'Tinh vân hồng tím ngoài không gian', 2500, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 35, 'required_tier', 'plus',
      'id', 'premium_nebula', 'name', 'Tinh Vân',
      'blurLevel', '24px', 'effect', 'floating-particles',
      'borderRadius', '28px', 'borderWidth', '2px', 'glassOpacity', '0.06',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.4, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(162,28,175,0.2), rgba(168,85,247,0.1), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#a21caf', 'accentContrast', '#ffffff',
        'surface1', 'rgba(162,28,175,0.06)', 'surface2', 'rgba(162,28,175,0.10)', 'surface3', 'rgba(162,28,175,0.14)',
        'surfaceGlass', 'rgba(162,28,175,0.08)', 'borderGlass', '#a21caf',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #4a044e 0%, #2d0030 40%, #020617 100%)',
        'glowColor', 'rgba(162,28,175,0.4)'
      )
    ), '#a21caf', true),

  ('premium_frost', 'Băng Giá', 'Băng giá xanh teal lạnh lẽo', 2000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 30, 'required_tier', 'plus',
      'id', 'premium_frost', 'name', 'Băng Giá',
      'blurLevel', '16px', 'effect', 'cyber-grid',
      'borderRadius', '8px', 'borderWidth', '2px', 'glassOpacity', '0.10',
      'glassPattern', 'grid', 'glassGlowIntensity', 0.5, 'glassInnerGlow', false,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#0891b2', 'accentContrast', '#ffffff',
        'surface1', 'rgba(8,145,178,0.08)', 'surface2', 'rgba(8,145,178,0.12)', 'surface3', 'rgba(8,145,178,0.16)',
        'surfaceGlass', 'rgba(8,145,178,0.10)', 'borderGlass', '#0891b2',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #164e63 0%, #020617 100%)',
        'glowColor', 'rgba(8,145,178,0.5)'
      )
    ), '#0891b2', true),

  -- Pro tier (4 themes)
  ('premium_dragon', 'Huyết Long', 'Máu rồng đỏ thẫm quyền năng', 4000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 50, 'required_tier', 'pro',
      'id', 'premium_dragon', 'name', 'Huyết Long',
      'blurLevel', '20px', 'effect', 'fire-embers',
      'borderRadius', '8px', 'borderWidth', '3px', 'glassOpacity', '0.10',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.5, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(185,28,28,0.25), rgba(234,179,8,0.08), transparent)',
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#b91c1c', 'accentContrast', '#ffffff',
        'surface1', 'rgba(185,28,28,0.07)', 'surface2', 'rgba(185,28,28,0.11)', 'surface3', 'rgba(185,28,28,0.15)',
        'surfaceGlass', 'rgba(185,28,28,0.10)', 'borderGlass', '#b91c1c',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #450a0a 0%, #1f0000 40%, #020617 100%)',
        'glowColor', 'rgba(185,28,28,0.5)'
      )
    ), '#b91c1c', true),

  ('premium_heaven', 'Thiên Giới', 'Ánh sáng vàng từ thiên đường', 4500, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 55, 'required_tier', 'pro',
      'id', 'premium_heaven', 'name', 'Thiên Giới',
      'blurLevel', '28px', 'effect', 'golden-rays',
      'borderRadius', '30px', 'borderWidth', '2px', 'glassOpacity', '0.04',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.4, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(253,224,71,0.2), rgba(234,179,8,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#fde047', 'accentContrast', '#422006',
        'surface1', 'rgba(253,224,71,0.06)', 'surface2', 'rgba(253,224,71,0.09)', 'surface3', 'rgba(253,224,71,0.13)',
        'surfaceGlass', 'rgba(253,224,71,0.07)', 'borderGlass', '#fde047',
        'bgGradient', 'radial-gradient(circle at 50% -10%, #713f12 0%, #422006 40%, #020617 100%)',
        'glowColor', 'rgba(253,224,71,0.4)'
      )
    ), '#fde047', true),

  ('premium_void', 'Hư Vô', 'Khoảng không vô tận tĩnh lặng', 4000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 50, 'required_tier', 'pro',
      'id', 'premium_void', 'name', 'Hư Vô',
      'blurLevel', '40px', 'effect', 'space-stars',
      'borderRadius', '20px', 'borderWidth', '1px', 'glassOpacity', '0.02',
      'glassPattern', 'none', 'glassGlowIntensity', 0.25, 'glassInnerGlow', true,
      'glassHoverEffect', 'glow',
      'colors', jsonb_build_object(
        'accent', '#4338ca', 'accentContrast', '#ffffff',
        'surface1', 'rgba(67,56,202,0.05)', 'surface2', 'rgba(67,56,202,0.08)', 'surface3', 'rgba(67,56,202,0.12)',
        'surfaceGlass', 'rgba(67,56,202,0.04)', 'borderGlass', 'rgba(67,56,202,0.4)',
        'bgGradient', 'radial-gradient(circle at 50% 0%, #0f0a2a 0%, #050510 40%, #000000 100%)',
        'glowColor', 'rgba(67,56,202,0.25)'
      )
    ), '#4338ca', true),

  ('premium_divine', 'Ánh Sáng', 'Ánh sáng thần thánh tím nhẹ', 5000, 'legendary', 'theme',
    jsonb_build_object(
      'required_level', 60, 'required_tier', 'pro',
      'id', 'premium_divine', 'name', 'Ánh Sáng',
      'blurLevel', '24px', 'effect', 'floating-particles',
      'borderRadius', '40px', 'borderWidth', '1.5px', 'glassOpacity', '0.04',
      'glassPattern', 'gradient', 'glassGlowIntensity', 0.35, 'glassInnerGlow', true,
      'glassGradient', 'linear-gradient(to bottom right, rgba(192,132,252,0.2), rgba(168,85,247,0.1), transparent)',
      'glassHoverEffect', 'brightness',
      'colors', jsonb_build_object(
        'accent', '#c084fc', 'accentContrast', '#3b0764',
        'surface1', 'rgba(192,132,252,0.06)', 'surface2', 'rgba(192,132,252,0.09)', 'surface3', 'rgba(192,132,252,0.13)',
        'surfaceGlass', 'rgba(192,132,252,0.06)', 'borderGlass', '#c084fc',
        'bgGradient', 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1a0033 40%, #020617 100%)',
        'glowColor', 'rgba(192,132,252,0.35)'
      )
    ), '#c084fc', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  rarity = EXCLUDED.rarity,
  meta_value = EXCLUDED.meta_value,
  preview_color = EXCLUDED.preview_color,
  is_active = EXCLUDED.is_active;
