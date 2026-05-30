-- Fix required_level for themes that were overwritten by previous migration
-- This restores the required_level field that was lost when meta_value was updated

UPDATE shop_items
SET meta_value = (meta_value::jsonb || jsonb_build_object('required_level',
  CASE id
    WHEN 'theme_default' THEN 1
    WHEN 'th_cyan' THEN 1
    WHEN 'th_emerald' THEN 1
    WHEN 'th_gold' THEN 15
    WHEN 'th_purple' THEN 10
    WHEN 'th_rose' THEN 10
    WHEN 'theme_abyss' THEN 30
    WHEN 'theme_aurora' THEN 30
    WHEN 'theme_cyan' THEN 10
    WHEN 'theme_cyber' THEN 10
    WHEN 'theme_cyberpunk' THEN 25
    WHEN 'theme_emerald' THEN 10
    WHEN 'theme_forest' THEN 10
    WHEN 'theme_midnight' THEN 15
    WHEN 'theme_ocean' THEN 10
    WHEN 'theme_red' THEN 10
    WHEN 'theme_royal' THEN 30
    WHEN 'theme_sakura' THEN 10
    WHEN 'theme_sunset' THEN 20
    WHEN 'theme_yellow' THEN 1
    ELSE 1
  END
))::text
WHERE category = 'theme' AND meta_value::jsonb ? 'id' AND NOT (meta_value::jsonb ? 'required_level');
