-- Upgrade metadata for all 10 premium themes with correct overlays & layered effects
UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 30, 'required_tier', 'plus',
  'id', 'premium_galaxy', 'name', 'Ngân Hà', 'rarity', 'legendary',
  'blurLevel', '28px', 'effect', 'pearl-shimmer', 'overlayEffect', 'space-stars',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.06',
  'glassPattern', 'satin', 'glassGlowIntensity', 0.5, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(109,40,217,0.2), rgba(124,58,237,0.1), transparent)',
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#6d28d9', 'accentContrast', '#ffffff',
    'surface1', 'rgba(109,40,217,0.07)', 'surface2', 'rgba(109,40,217,0.11)', 'surface3', 'rgba(109,40,217,0.15)',
    'surfaceGlass', 'rgba(109,40,217,0.08)', 'borderGlass', '#6d28d9',
    'bgGradient', 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1e0033 40%, #020617 100%)',
    'glowColor', 'rgba(109,40,217,0.5)'
  )
)::text
WHERE id = 'premium_galaxy';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 35, 'required_tier', 'plus',
  'id', 'premium_storm', 'name', 'Bão Điện', 'rarity', 'legendary',
  'blurLevel', '12px', 'effect', 'silk-sweep', 'overlayEffect', 'cyber-grid',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.12',
  'glassPattern', 'grid', 'glassGlowIntensity', 0.6, 'glassInnerGlow', false,
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#0284c7', 'accentContrast', '#ffffff',
    'surface1', 'rgba(2,132,199,0.08)', 'surface2', 'rgba(2,132,199,0.12)', 'surface3', 'rgba(2,132,199,0.16)',
    'surfaceGlass', 'rgba(2,132,199,0.1)', 'borderGlass', '#0284c7',
    'bgGradient', 'radial-gradient(circle at 50% -10%, #0c4a6e 0%, #020617 100%)',
    'glowColor', 'rgba(2,132,199,0.6)'
  )
)::text
WHERE id = 'premium_storm';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 30, 'required_tier', 'plus',
  'id', 'premium_ember', 'name', 'Hồng Lửa', 'rarity', 'legendary',
  'blurLevel', '18px', 'effect', 'depth-breathe', 'overlayEffect', 'fire-embers',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.08',
  'glassPattern', 'satin', 'glassGlowIntensity', 0.55, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(225,29,72,0.2), rgba(244,63,94,0.1), transparent)',
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#e11d48', 'accentContrast', '#ffffff',
    'surface1', 'rgba(225,29,72,0.06)', 'surface2', 'rgba(225,29,72,0.1)', 'surface3', 'rgba(225,29,72,0.14)',
    'surfaceGlass', 'rgba(225,29,72,0.08)', 'borderGlass', '#e11d48',
    'bgGradient', 'radial-gradient(circle at 50% -10%, #4c0519 0%, #2d000e 40%, #020617 100%)',
    'glowColor', 'rgba(225,29,72,0.55)'
  )
)::text
WHERE id = 'premium_ember';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 40, 'required_tier', 'plus',
  'id', 'premium_aurora_green', 'name', 'Cực Quang Xanh', 'rarity', 'legendary',
  'blurLevel', '26px', 'effect', 'silk-sweep', 'overlayEffect', 'aurora-waves',
  'borderRadius', '16px', 'borderWidth', '1.5px', 'glassOpacity', '0.05',
  'glassPattern', 'satin', 'glassGlowIntensity', 0.55, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(16,185,129,0.2), rgba(5,150,105,0.1), transparent)',
  'glassHoverEffect', 'brightness',
  'colors', jsonb_build_object(
    'accent', '#10b981', 'accentContrast', '#ffffff',
    'surface1', 'rgba(16,185,129,0.06)', 'surface2', 'rgba(16,185,129,0.09)', 'surface3', 'rgba(16,185,129,0.13)',
    'surfaceGlass', 'rgba(16,185,129,0.07)', 'borderGlass', '#10b981',
    'bgGradient', 'radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 40%, #020617 100%)',
    'glowColor', 'rgba(16,185,129,0.45)'
  )
)::text
WHERE id = 'premium_aurora_green';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 35, 'required_tier', 'plus',
  'id', 'premium_nebula', 'name', 'Tinh Vân', 'rarity', 'legendary',
  'blurLevel', '24px', 'effect', 'pearl-shimmer', 'overlayEffect', 'floating-particles',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.06',
  'glassPattern', 'lens', 'glassGlowIntensity', 0.5, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(162,28,175,0.2), rgba(168,85,247,0.1), transparent)',
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#a21caf', 'accentContrast', '#ffffff',
    'surface1', 'rgba(162,28,175,0.06)', 'surface2', 'rgba(162,28,175,0.10)', 'surface3', 'rgba(162,28,175,0.14)',
    'surfaceGlass', 'rgba(162,28,175,0.08)', 'borderGlass', '#a21caf',
    'bgGradient', 'radial-gradient(circle at 50% -20%, #4a044e 0%, #2d0030 40%, #020617 100%)',
    'glowColor', 'rgba(162,28,175,0.5)'
  )
)::text
WHERE id = 'premium_nebula';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 30, 'required_tier', 'plus',
  'id', 'premium_frost', 'name', 'Băng Giá', 'rarity', 'legendary',
  'blurLevel', '16px', 'effect', 'canvas-texture', 'overlayEffect', 'cyber-grid',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.10',
  'glassPattern', 'lens', 'glassGlowIntensity', 0.6, 'glassInnerGlow', false,
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#0891b2', 'accentContrast', '#ffffff',
    'surface1', 'rgba(8,145,178,0.08)', 'surface2', 'rgba(8,145,178,0.12)', 'surface3', 'rgba(8,145,178,0.16)',
    'surfaceGlass', 'rgba(8,145,178,0.10)', 'borderGlass', '#0891b2',
    'bgGradient', 'radial-gradient(circle at 50% -20%, #164e63 0%, #020617 100%)',
    'glowColor', 'rgba(8,145,178,0.6)'
  )
)::text
WHERE id = 'premium_frost';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 50, 'required_tier', 'pro',
  'id', 'premium_dragon', 'name', 'Huyết Long', 'rarity', 'legendary',
  'blurLevel', '20px', 'effect', 'depth-breathe', 'overlayEffect', 'golden-rays',
  'borderRadius', '16px', 'borderWidth', '3px', 'glassOpacity', '0.10',
  'glassPattern', 'satin', 'glassGlowIntensity', 0.6, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(185,28,28,0.25), rgba(234,179,8,0.08), transparent)',
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#b91c1c', 'accentContrast', '#ffffff',
    'surface1', 'rgba(185,28,28,0.07)', 'surface2', 'rgba(185,28,28,0.11)', 'surface3', 'rgba(185,28,28,0.15)',
    'surfaceGlass', 'rgba(185,28,28,0.10)', 'borderGlass', '#b91c1c',
    'bgGradient', 'radial-gradient(circle at 50% 0%, #450a0a 0%, #1f0000 40%, #020617 100%)',
    'glowColor', 'rgba(185,28,28,0.6)'
  )
)::text
WHERE id = 'premium_dragon';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 55, 'required_tier', 'pro',
  'id', 'premium_heaven', 'name', 'Thiên Giới', 'rarity', 'legendary',
  'blurLevel', '28px', 'effect', 'pearl-shimmer', 'overlayEffect', 'golden-rays',
  'borderRadius', '16px', 'borderWidth', '2px', 'glassOpacity', '0.04',
  'glassPattern', 'lens', 'glassGlowIntensity', 0.55, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(253,224,71,0.2), rgba(234,179,8,0.1), transparent)',
  'glassHoverEffect', 'brightness',
  'colors', jsonb_build_object(
    'accent', '#fde047', 'accentContrast', '#422006',
    'surface1', 'rgba(253,224,71,0.06)', 'surface2', 'rgba(253,224,71,0.09)', 'surface3', 'rgba(253,224,71,0.13)',
    'surfaceGlass', 'rgba(253,224,71,0.07)', 'borderGlass', '#fde047',
    'bgGradient', 'radial-gradient(circle at 50% -10%, #713f12 0%, #422006 40%, #020617 100%)',
    'glowColor', 'rgba(253,224,71,0.4)'
  )
)::text
WHERE id = 'premium_heaven';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 50, 'required_tier', 'pro',
  'id', 'premium_void', 'name', 'Hư Vô', 'rarity', 'legendary',
  'blurLevel', '40px', 'effect', 'canvas-texture', 'overlayEffect', 'space-stars',
  'borderRadius', '16px', 'borderWidth', '1px', 'glassOpacity', '0.02',
  'glassPattern', 'satin', 'glassGlowIntensity', 0.5, 'glassInnerGlow', true,
  'glassHoverEffect', 'glow',
  'colors', jsonb_build_object(
    'accent', '#4338ca', 'accentContrast', '#ffffff',
    'surface1', 'rgba(67,56,202,0.05)', 'surface2', 'rgba(67,56,202,0.08)', 'surface3', 'rgba(67,56,202,0.12)',
    'surfaceGlass', 'rgba(67,56,202,0.04)', 'borderGlass', 'rgba(67,56,202,0.4)',
    'bgGradient', 'radial-gradient(circle at 50% 0%, #0f0a2a 0%, #050510 40%, #000000 100%)',
    'glowColor', 'rgba(67,56,202,0.35)'
  )
)::text
WHERE id = 'premium_void';

UPDATE shop_items
SET meta_value = jsonb_build_object(
  'required_level', 60, 'required_tier', 'pro',
  'id', 'premium_divine', 'name', 'Ánh Sáng', 'rarity', 'legendary',
  'blurLevel', '24px', 'effect', 'silk-sweep', 'overlayEffect', 'floating-particles',
  'borderRadius', '16px', 'borderWidth', '1.5px', 'glassOpacity', '0.04',
  'glassPattern', 'lens', 'glassGlowIntensity', 0.6, 'glassInnerGlow', true,
  'glassGradient', 'linear-gradient(to bottom right, rgba(192,132,252,0.2), rgba(168,85,247,0.1), transparent)',
  'glassHoverEffect', 'brightness',
  'colors', jsonb_build_object(
    'accent', '#c084fc', 'accentContrast', '#3b0764',
    'surface1', 'rgba(192,132,252,0.06)', 'surface2', 'rgba(192,132,252,0.09)', 'surface3', 'rgba(192,132,252,0.13)',
    'surfaceGlass', 'rgba(192,132,252,0.06)', 'borderGlass', '#c084fc',
    'bgGradient', 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1a0033 40%, #020617 100%)',
    'glowColor', 'rgba(192,132,252,0.45)'
  )
)::text
WHERE id = 'premium_divine';
