-- Nâng cấp theme_red từ "Đỏ Thẫm" → "Mặt Trời Lửa"
-- Mới: hiệu ứng tia mặt trời (golden-rays) với đỏ rực, gradient nền đậm hơn

UPDATE shop_items
SET
  name = 'Mặt Trời Lửa',
  description = 'Ánh mặt trời đỏ rực giữa vũ trụ tối',
  preview_color = '#ef4444',
  meta_value = jsonb_build_object(
    'required_level', 10,
    'id', 'theme_red',
    'name', 'Mặt Trời Lửa',
    'blurLevel', '24px',
    'effect', 'golden-rays',
    'borderRadius', '16px',
    'borderWidth', '3px',
    'glassOpacity', '0.08',
    'glassPattern', 'gradient',
    'glassGlowIntensity', 0.5,
    'glassInnerGlow', true,
    'glassGradient', 'linear-gradient(to bottom right, rgba(239,68,68,0.2), rgba(249,115,22,0.1), transparent)',
    'glassHoverEffect', 'glow',
    'colors', jsonb_build_object(
      'accent', '#ef4444',
      'accentContrast', '#ffffff',
      'surface1', 'rgba(239,68,68,0.06)',
      'surface2', 'rgba(239,68,68,0.10)',
      'surface3', 'rgba(239,68,68,0.14)',
      'surfaceGlass', 'rgba(239,68,68,0.08)',
      'borderGlass', '#ef4444',
      'bgGradient', 'radial-gradient(circle at 50% -20%, #7f1d1d 0%, #450a0a 40%, #020617 100%)',
      'glowColor', 'rgba(239,68,68,0.5)'
    )
  )::text
WHERE id = 'theme_red';
