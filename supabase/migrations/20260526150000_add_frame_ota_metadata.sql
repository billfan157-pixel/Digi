-- Thêm effectSourceId + borderClasses vào meta_value của tất cả khung
-- Cho phép OTA: khung mới chỉ cần insert DB là app load được (nếu dùng effect cũ)

UPDATE shop_items SET meta_value = '{"required_level": 1, "effectSourceId": "frame_aqua_pulse", "borderClasses": "border-cyan-400/40"}' WHERE id = 'frame_aqua_pulse';
UPDATE shop_items SET meta_value = '{"required_level": 5, "effectSourceId": "frame_deep_ocean", "borderClasses": "border-blue-600/50 shadow-[inset_0_0_10px_rgba(30,64,175,0.5)]"}' WHERE id = 'frame_deep_ocean';
UPDATE shop_items SET meta_value = '{"required_level": 10, "effectSourceId": "frame_heartbeat", "borderClasses": "border-rose-500/30"}' WHERE id = 'frame_heartbeat';
UPDATE shop_items SET meta_value = '{"required_level": 15, "effectSourceId": "frame_energy_aura", "borderClasses": "border-amber-400/20"}' WHERE id = 'frame_energy_aura';
UPDATE shop_items SET meta_value = '{"required_level": 10, "effectSourceId": "frame_zen_garden", "borderClasses": "border-emerald-500/40"}' WHERE id = 'frame_zen_garden';
UPDATE shop_items SET meta_value = '{"required_level": 30, "effectSourceId": "frame_aurora", "borderClasses": "border-transparent"}' WHERE id = 'frame_aurora';
UPDATE shop_items SET meta_value = '{"required_level": 20, "effectSourceId": "frame_fire_streak", "borderClasses": "border-orange-600/20"}' WHERE id = 'frame_fire_streak';
UPDATE shop_items SET meta_value = '{"required_level": 50, "effectSourceId": "frame_diamond", "borderClasses": "border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.4)]"}' WHERE id = 'frame_diamond';
UPDATE shop_items SET meta_value = '{"required_level": 1, "effectSourceId": "frame_bamboo", "borderClasses": "border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"}' WHERE id = 'frame_bamboo';
UPDATE shop_items SET meta_value = '{"required_level": 8, "effectSourceId": "frame_sunset", "borderClasses": "border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.4)]"}' WHERE id = 'frame_sunset';
UPDATE shop_items SET meta_value = '{"required_level": 12, "effectSourceId": "frame_ice_crystal", "borderClasses": "border-cyan-300/50 shadow-[0_0_12px_rgba(103,232,249,0.4)]"}' WHERE id = 'frame_ice_crystal';
UPDATE shop_items SET meta_value = '{"required_level": 18, "effectSourceId": "frame_thunder", "borderClasses": "border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.5)]"}' WHERE id = 'frame_thunder';
UPDATE shop_items SET meta_value = '{"required_level": 35, "effectSourceId": "frame_galaxy_swirl", "borderClasses": "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.6)]"}' WHERE id = 'frame_galaxy_swirl';
UPDATE shop_items SET meta_value = '{"required_level": 20, "required_tier": "plus", "effectSourceId": "frame_premium_silver", "borderClasses": "border-slate-300/60 shadow-[0_0_15px_rgba(203,213,225,0.5)] shadow-[inset_0_0_10px_rgba(203,213,225,0.2)]"}' WHERE id = 'frame_premium_silver';
UPDATE shop_items SET meta_value = '{"required_level": 30, "required_tier": "plus", "effectSourceId": "frame_premium_gold", "borderClasses": "border-yellow-400/60 shadow-[0_0_20px_rgba(251,191,36,0.7)] shadow-[inset_0_0_15px_rgba(251,191,36,0.3)]"}' WHERE id = 'frame_premium_gold';
UPDATE shop_items SET meta_value = '{"required_level": 35, "required_tier": "plus", "effectSourceId": "frame_premium_phoenix", "borderClasses": "border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.6)]"}' WHERE id = 'frame_premium_phoenix';
UPDATE shop_items SET meta_value = '{"required_level": 30, "required_tier": "plus", "effectSourceId": "frame_premium_lunar", "borderClasses": "border-indigo-400/50 shadow-[0_0_25px_rgba(129,140,248,0.6)]"}' WHERE id = 'frame_premium_lunar';
UPDATE shop_items SET meta_value = '{"required_level": 50, "required_tier": "pro", "effectSourceId": "frame_premium_dragon", "borderClasses": "border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.8)] shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]"}' WHERE id = 'frame_premium_dragon';
