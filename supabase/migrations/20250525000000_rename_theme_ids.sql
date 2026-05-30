-- Migration script to rename theme IDs from th_ prefix to theme_ prefix
-- and rename conflicting theme IDs to unique names

-- Temporarily disable foreign key constraint
ALTER TABLE user_purchases DROP CONSTRAINT IF EXISTS user_purchases_item_id_fkey;

-- First, update shop_items table (primary key changes)
DO $$
BEGIN
  UPDATE shop_items 
  SET id = 'theme_water' 
  WHERE id = 'th_cyan' AND category = 'theme';
  
  UPDATE shop_items 
  SET id = 'theme_jade' 
  WHERE id = 'th_emerald' AND category = 'theme';
  
  UPDATE shop_items 
  SET id = 'theme_imperial' 
  WHERE id = 'th_gold' AND category = 'theme';
  
  UPDATE shop_items 
  SET id = 'theme_violet' 
  WHERE id = 'th_purple' AND category = 'theme';
  
  UPDATE shop_items 
  SET id = 'theme_crimson' 
  WHERE id = 'th_rose' AND category = 'theme';
  
  UPDATE shop_items 
  SET id = 'theme_lime' 
  WHERE id = 'theme_emerald' AND category = 'theme';
  
  RAISE NOTICE 'Shop items theme ID migration completed successfully';
END $$;

-- Then update user_purchases to reference new theme IDs
DO $$
BEGIN
  UPDATE user_purchases 
  SET item_id = 'theme_water' 
  WHERE item_id = 'th_cyan';
  
  UPDATE user_purchases 
  SET item_id = 'theme_jade' 
  WHERE item_id = 'th_emerald';
  
  UPDATE user_purchases 
  SET item_id = 'theme_imperial' 
  WHERE item_id = 'th_gold';
  
  UPDATE user_purchases 
  SET item_id = 'theme_violet' 
  WHERE item_id = 'th_purple';
  
  UPDATE user_purchases 
  SET item_id = 'theme_crimson' 
  WHERE item_id = 'th_rose';
  
  UPDATE user_purchases 
  SET item_id = 'theme_lime' 
  WHERE item_id = 'theme_emerald';
  
  RAISE NOTICE 'User purchases theme ID migration completed successfully';
END $$;

-- Finally, update profiles table
DO $$
BEGIN
  -- Map th_cyan → theme_water
  UPDATE profiles 
  SET equipped_theme_id = 'theme_water' 
  WHERE equipped_theme_id = 'th_cyan';
  
  -- Map th_emerald → theme_jade
  UPDATE profiles 
  SET equipped_theme_id = 'theme_jade' 
  WHERE equipped_theme_id = 'th_emerald';
  
  -- Map th_gold → theme_imperial
  UPDATE profiles 
  SET equipped_theme_id = 'theme_imperial' 
  WHERE equipped_theme_id = 'th_gold';
  
  -- Map th_purple → theme_violet
  UPDATE profiles 
  SET equipped_theme_id = 'theme_violet' 
  WHERE equipped_theme_id = 'th_purple';
  
  -- Map th_rose → theme_crimson
  UPDATE profiles 
  SET equipped_theme_id = 'theme_crimson' 
  WHERE equipped_theme_id = 'th_rose';
  
  -- Map old theme_emerald → theme_lime (this was renamed to avoid conflict)
  UPDATE profiles 
  SET equipped_theme_id = 'theme_lime' 
  WHERE equipped_theme_id = 'theme_emerald';
  
  RAISE NOTICE 'Theme ID migration completed successfully';
END $$;

-- Re-enable foreign key constraint
ALTER TABLE user_purchases 
ADD CONSTRAINT user_purchases_item_id_fkey 
FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE;
