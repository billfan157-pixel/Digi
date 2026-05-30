-- Fix hydration_battles FK to reference public_profiles instead of profiles
-- so bot duels work (bots only exist in public_profiles, not auth-linked profiles)

-- 1. Ensure bot profiles exist in public_profiles
INSERT INTO public.public_profiles (
  id, nickname, avatar_url, level, wp, total_wp,
  water_today, water_goal, user_title, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000000', '[System] Matchmaking', NULL, 0, 0, 0, 0, 0, NULL, now()),
  ('00000000-0000-0000-0000-000000000001', '[Bot] Rồng Nước', NULL, 5, 0, 0, 0, 0, NULL, now()),
  ('00000000-0000-0000-0000-000000000002', '[Bot] Thủy Thần', NULL, 10, 0, 0, 0, 0, NULL, now()),
  ('00000000-0000-0000-0000-000000000003', '[Bot] Giọt Sương', NULL, 3, 0, 0, 0, 0, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- 2. Fix FK on hydration_battles.opponent_id to reference public_profiles
ALTER TABLE public.hydration_battles
  DROP CONSTRAINT IF EXISTS hydration_battles_opponent_id_fkey,
  DROP CONSTRAINT IF EXISTS hydration_battles_opponent_public_profile_fkey,
  ADD CONSTRAINT hydration_battles_opponent_public_profile_fkey
    FOREIGN KEY (opponent_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE;

-- 3. Also fix challenger_id FK if it still references profiles
ALTER TABLE public.hydration_battles
  DROP CONSTRAINT IF EXISTS hydration_battles_challenger_id_fkey,
  DROP CONSTRAINT IF EXISTS hydration_battles_challenger_public_profile_fkey,
  ADD CONSTRAINT hydration_battles_challenger_public_profile_fkey
    FOREIGN KEY (challenger_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE;
