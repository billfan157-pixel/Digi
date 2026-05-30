-- Nâng cấp theme_yellow từ "Vàng Chanh" → "Ánh Dương"
-- Mới: hiệu ứng hạt ánh sáng (floating-particles) với vàng hổ phách, gradient nền ấm

UPDATE shop_items
SET
  name = 'Ánh Dương',
  description = 'Tia nắng ấm áp giữa không gian',
  preview_color = '#fbbf24',
  meta_value = jsonb_build_object(
    'required_level', 1,
    'id', 'theme_yellow',
    'name', 'Ánh Dương',
    'blurLevel', '20px',
    'effect', 'floating-particles',
    'borderRadius', '32px',
    'borderWidth', '2px',
    'glassOpacity', '0.06',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.35,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(251,191,36,0.2), rgba(245,158,11,0.1), transparent)',
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#fbbf24',
      'accentContrast', '#422006',
      'surface1', 'rgba(251,191,36,0.06)',
      'surface2', 'rgba(251,191,36,0.10)',
      'surface3', 'rgba(251,191,36,0.14)',
      'surfaceGlass', 'rgba(251,191,36,0.08)',
      'borderGlass', '#fbbf24',
      'bgGradient', 'radial-gradient(circle at 50% -20%, #78350f 0%, #451a03 40%, #020617 100%)',
      'glowColor', 'rgba(251,191,36,0.35)'
    )
  )::text
WHERE id = 'theme_yellow';
