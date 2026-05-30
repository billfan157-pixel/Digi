-- Sync all themes' border-radius to 16px to match default theme
UPDATE shop_items
SET meta_value = (meta_value::jsonb || jsonb_build_object('borderRadius', '16px'))::text
WHERE category = 'theme';
