-- Nâng cấp 3 theme cùng lúc

-- 1. theme_midnight: "Sự Tĩnh Lặng" → "Bầu Trời Sao"
UPDATE shop_items
SET
  name = 'Bầu Trời Sao',
  description = 'Bầu trời đầy sao huyền ảo giữa không gian sâu',
  preview_color = '#818cf8',
  meta_value = jsonb_build_object(
    'required_level', 15,
    'id', 'theme_midnight',
    'name', 'Bầu Trời Sao',
    'blurLevel', '30px',
    'effect', 'space-stars',
    'borderRadius', '18px',
    'borderWidth', '1.5px',
    'glassOpacity', '0.04',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.3,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(129,140,248,0.15), transparent)',
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#818cf8',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(129,140,248,0.05)',
      'surface2', 'rgba(129,140,248,0.08)',
      'surface3', 'rgba(129,140,248,0.12)',
      'surfaceGlass', 'rgba(129,140,248,0.06)',
      'borderGlass', 'rgba(129,140,248,0.30)',
      'bgGradient', 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f0a2a 40%, #020617 100%)',
      'glowColor', 'rgba(129,140,248,0.30)'
    )
  )::text
WHERE id = 'theme_midnight';

-- 2. theme_crystal: "Crystal Aqua" → "Pha Lê Băng"
UPDATE shop_items
SET
  name = 'Pha Lê Băng',
  description = 'Tinh thể băng giá lấp lánh trong vũ trụ',
  preview_color = '#67e8f9',
  meta_value = jsonb_build_object(
    'required_level', 1,
    'id', 'theme_crystal',
    'name', 'Pha Lê Băng',
    'blurLevel', '22px',
    'effect', 'water-ripples',
    'borderRadius', '20px',
    'borderWidth', '2px',
    'glassOpacity', '0.06',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.4,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(103,232,249,0.15), rgba(6,182,212,0.1), transparent)',
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#67e8f9',
      'accentContrast', '#0c4a6e',
      'surface1', 'rgba(103,232,249,0.06)',
      'surface2', 'rgba(103,232,249,0.10)',
      'surface3', 'rgba(103,232,249,0.14)',
      'surfaceGlass', 'rgba(103,232,249,0.08)',
      'borderGlass', '#67e8f9',
      'bgGradient', 'radial-gradient(circle at 50% -10%, #155e75 0%, #083344 40%, #020617 100%)',
      'glowColor', 'rgba(103,232,249,0.40)'
    )
  )::text
WHERE id = 'theme_crystal';

-- 3. theme_cyan: "Xanh Cyan" → "Xanh Lục Lam" (fix màu từ #0077ff → #06b6d4)
UPDATE shop_items
SET
  name = 'Xanh Lục Lam',
  description = 'Lưới neon xanh lục lam mát mắt',
  preview_color = '#06b6d4',
  meta_value = jsonb_build_object(
    'required_level', 10,
    'id', 'theme_cyan',
    'name', 'Xanh Lục Lam',
    'blurLevel', '14px',
    'effect', 'cyber-grid',
    'borderRadius', '6px',
    'borderWidth', '2px',
    'glassOpacity', '0.10',
    'glassPattern', 'grid',
    'glassGlowIntensity', 0.5,
    'glassInnerGlow', false,
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#06b6d4',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(6,182,212,0.08)',
      'surface2', 'rgba(6,182,212,0.12)',
      'surface3', 'rgba(6,182,212,0.16)',
      'surfaceGlass', 'rgba(6,182,212,0.10)',
      'borderGlass', '#06b6d4',
      'bgGradient', 'radial-gradient(circle at 50% -20%, #083344 0%, #020617 100%)',
      'glowColor', 'rgba(6,182,212,0.50)'
    )
  )::text
WHERE id = 'theme_cyan';
