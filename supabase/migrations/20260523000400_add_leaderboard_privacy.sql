-- Migration to add leaderboard_opt_in column to profiles and public_profiles, and update sync triggers.

-- 1. Add column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. Add column to public.public_profiles
ALTER TABLE public.public_profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN DEFAULT TRUE NOT NULL;

-- 3. Update sync function to handle leaderboard_opt_in
CREATE OR REPLACE FUNCTION private.sync_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.public_profiles (
    id,
    nickname,
    avatar_url,
    level,
    wp,
    total_wp,
    water_today,
    water_goal,
    user_title,
    updated_at,
    leaderboard_opt_in
  )
  VALUES (
    new.id,
    COALESCE(NULLIF(new.nickname, ''), 'Người dùng DigiWell'),
    new.avatar_url,
    new.level,
    new.wp,
    new.total_wp,
    new.water_today,
    new.water_goal,
    new.user_title,
    new.updated_at,
    new.leaderboard_opt_in
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = COALESCE(NULLIF(excluded.nickname, ''), public.public_profiles.nickname, 'Người dùng DigiWell'),
    avatar_url = excluded.avatar_url,
    level = excluded.level,
    wp = excluded.wp,
    total_wp = excluded.total_wp,
    water_today = excluded.water_today,
    water_goal = excluded.water_goal,
    user_title = excluded.user_title,
    updated_at = excluded.updated_at,
    leaderboard_opt_in = excluded.leaderboard_opt_in;

  RETURN new;
END;
$$;

-- 4. Re-create trigger with the new column in the after update list
DROP TRIGGER IF EXISTS sync_public_profile_after_profile_write ON public.profiles;
CREATE TRIGGER sync_public_profile_after_profile_write
  AFTER INSERT OR UPDATE OF nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at, leaderboard_opt_in
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_public_profile();

-- 5. Add index on public_profiles for leaderboard_opt_in and wp queries
CREATE INDEX IF NOT EXISTS idx_public_profiles_opt_in_wp ON public.public_profiles (leaderboard_opt_in, wp DESC);
