-- Restructure free theme tiers for clear 5-tier hierarchy
-- Reference: docs/TIER_HIERARCHY.md
--
-- Changes:
--   Tier 2 (Phổ Thông): theme_yellow (lv1→5), theme_crystal (lv1→8, set rarity=common)
--   Tier 4 (Cao Cấp): theme_red (rare→epic, lv10→15), theme_cyan/cyber (rare→epic, lv10→15), theme_imperial (lv15→18)
--   Tier 5 (Đỉnh Cao): theme_aurora (lv30→28), theme_royal (lv30→35)
--   Glow: rebalanced so higher tiers always have ≥ glow of lower tiers

-- ============================================================
-- AUTO-REPAIR: Fix concatenated JSON in shop_items.meta_value
-- ============================================================
UPDATE shop_items
SET meta_value = (
  SELECT jsonb_object_agg(key, value)::text
  FROM (
    SELECT DISTINCT ON (key) key, value
    FROM (
      SELECT (jsonb_each(elem)).key, (jsonb_each(elem)).value
      FROM jsonb_array_elements(('[' || replace(meta_value, '}{', '},{') || ']')::jsonb) AS elem
    ) AS fields
  ) AS unique_fields
)
WHERE meta_value LIKE '%}{%';

-- ============================================================
-- TIER 1-2: theme_yellow (common, lv1→5, glow 0.35→0.30)
-- ============================================================
UPDATE shop_items
SET
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 5,
    'glassGlowIntensity', 0.30
  ))::text
WHERE id = 'theme_yellow';

-- ============================================================
-- TIER 1-2: theme_crystal (set rarity=common, lv1→8, glow 0.40→0.35)
-- ============================================================
UPDATE shop_items
SET
  price = 250,
  rarity = 'common',
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 8,
    'glassGlowIntensity', 0.35
  ))::text
WHERE id = 'theme_crystal';

-- ============================================================
-- TIER 4: theme_red (rare→epic, lv10→15, 300→450, glow 0.50→0.40)
-- ============================================================
UPDATE shop_items
SET
  price = 450,
  rarity = 'epic',
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 15,
    'glassGlowIntensity', 0.40
  ))::text
WHERE id = 'theme_red';

-- ============================================================
-- TIER 4: theme_cyan (rare→epic, lv10→15, 400→500, glow 0.50→0.45)
-- ============================================================
UPDATE shop_items
SET
  price = 500,
  rarity = 'epic',
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 15,
    'glassGlowIntensity', 0.45
  ))::text
WHERE id = 'theme_cyan';

-- ============================================================
-- TIER 4: theme_cyber (rare→epic, lv10→15, 400→500, glow 0.50→0.45)
-- ============================================================
UPDATE shop_items
SET
  price = 500,
  rarity = 'epic',
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 15,
    'glassGlowIntensity', 0.45
  ))::text
WHERE id = 'theme_cyber';

-- ============================================================
-- TIER 4: theme_imperial (lv15→18, 500→550)
-- ============================================================
UPDATE shop_items
SET
  price = 550,
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 18
  ))::text
WHERE id = 'theme_imperial';

-- ============================================================
-- TIER 4: theme_midnight (500→450)
-- ============================================================
UPDATE shop_items
SET
  price = 450,
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 15
  ))::text
WHERE id = 'theme_midnight';

-- ============================================================
-- TIER 4: theme_sunset (glow 0.25→0.30)
-- ============================================================
UPDATE shop_items
SET meta_value = (meta_value::jsonb || jsonb_build_object(
  'glassGlowIntensity', 0.30
))::text
WHERE id = 'theme_sunset';

-- ============================================================
-- TIER 5: theme_aurora (lv30→28, 800→700, glow 0.30→0.45)
-- ============================================================
UPDATE shop_items
SET
  price = 700,
  meta_value = (meta_value::jsonb || jsonb_build_object(
    'required_level', 28,
    'glassGlowIntensity', 0.45
  ))::text
WHERE id = 'theme_aurora';

-- ============================================================
-- TIER 5: theme_royal (lv30→35)
-- ============================================================
UPDATE shop_items
SET meta_value = (meta_value::jsonb || jsonb_build_object(
  'required_level', 35
))::text
WHERE id = 'theme_royal';
