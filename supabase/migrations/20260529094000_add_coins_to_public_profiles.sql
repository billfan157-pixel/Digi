-- ============================================================
-- Fix: Add missing `coins` column to public.public_profiles
-- Arena Duel V2 RPCs reference `coins` on public_profiles
-- but the column only existed on public.profiles.
-- ============================================================

-- 1. Add coins column to public_profiles
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0;

-- 2. Backfill from public.profiles
UPDATE public.public_profiles
SET coins = COALESCE(public.profiles.coins, 0)
FROM public.profiles
WHERE public.public_profiles.id = public.profiles.id;

-- 3. Update sync trigger to include coins
CREATE OR REPLACE FUNCTION private.sync_public_profile()
RETURNS trigger
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
    coins
  )
  VALUES (
    new.id,
    new.nickname,
    new.avatar_url,
    new.level,
    new.wp,
    new.total_wp,
    new.water_today,
    new.water_goal,
    new.user_title,
    new.updated_at,
    COALESCE(new.coins, 0)
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = excluded.nickname,
    avatar_url = excluded.avatar_url,
    level = excluded.level,
    wp = excluded.wp,
    total_wp = excluded.total_wp,
    water_today = excluded.water_today,
    water_goal = excluded.water_goal,
    user_title = excluded.user_title,
    updated_at = excluded.updated_at,
    coins = excluded.coins;

  RETURN new;
END;
$$;

-- 4. Update trigger to fire on coins changes too
DROP TRIGGER IF EXISTS sync_public_profile_after_profile_write ON public.profiles;
CREATE TRIGGER sync_public_profile_after_profile_write
AFTER INSERT OR UPDATE OF nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at, coins
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.sync_public_profile();

-- 5. Also ensure all duel_* columns exist on public.profiles (source of truth)
--    since public_profiles syncs FROM profiles, profiles must have these columns.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS duel_elo integer NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS duel_matches_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_last_match_at timestamptz,
  ADD COLUMN IF NOT EXISTS duel_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_draws integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_wp integer NOT NULL DEFAULT 0;

-- 6. Sync duel_* columns into public_profiles
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS duel_elo integer NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS duel_matches_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_last_match_at timestamptz,
  ADD COLUMN IF NOT EXISTS duel_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_draws integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_wp integer NOT NULL DEFAULT 0;

-- Backfill duel columns
UPDATE public.public_profiles
SET
  duel_elo = COALESCE(public.profiles.duel_elo, 1200),
  duel_matches_total = COALESCE(public.profiles.duel_matches_total, 0),
  duel_last_match_at = public.profiles.duel_last_match_at,
  duel_win_streak = COALESCE(public.profiles.duel_win_streak, 0),
  duel_total_wins = COALESCE(public.profiles.duel_total_wins, 0),
  duel_total_losses = COALESCE(public.profiles.duel_total_losses, 0),
  duel_total_draws = COALESCE(public.profiles.duel_total_draws, 0),
  duel_wp = COALESCE(public.profiles.duel_wp, 0)
FROM public.profiles
WHERE public.public_profiles.id = public.profiles.id;

-- 7. Update sync trigger to include all duel_* columns
CREATE OR REPLACE FUNCTION private.sync_public_profile()
RETURNS trigger
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
    coins,
    duel_elo,
    duel_matches_total,
    duel_last_match_at,
    duel_win_streak,
    duel_total_wins,
    duel_total_losses,
    duel_total_draws,
    duel_wp
  )
  VALUES (
    new.id,
    new.nickname,
    new.avatar_url,
    new.level,
    new.wp,
    new.total_wp,
    new.water_today,
    new.water_goal,
    new.user_title,
    new.updated_at,
    COALESCE(new.coins, 0),
    COALESCE(new.duel_elo, 1200),
    COALESCE(new.duel_matches_total, 0),
    new.duel_last_match_at,
    COALESCE(new.duel_win_streak, 0),
    COALESCE(new.duel_total_wins, 0),
    COALESCE(new.duel_total_losses, 0),
    COALESCE(new.duel_total_draws, 0),
    COALESCE(new.duel_wp, 0)
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = excluded.nickname,
    avatar_url = excluded.avatar_url,
    level = excluded.level,
    wp = excluded.wp,
    total_wp = excluded.total_wp,
    water_today = excluded.water_today,
    water_goal = excluded.water_goal,
    user_title = excluded.user_title,
    updated_at = excluded.updated_at,
    coins = excluded.coins,
    duel_elo = excluded.duel_elo,
    duel_matches_total = excluded.duel_matches_total,
    duel_last_match_at = excluded.duel_last_match_at,
    duel_win_streak = excluded.duel_win_streak,
    duel_total_wins = excluded.duel_total_wins,
    duel_total_losses = excluded.duel_total_losses,
    duel_total_draws = excluded.duel_total_draws,
    duel_wp = excluded.duel_wp;

  RETURN new;
END;
$$;

-- 8. Update trigger columns list
DROP TRIGGER IF EXISTS sync_public_profile_after_profile_write ON public.profiles;
CREATE TRIGGER sync_public_profile_after_profile_write
AFTER INSERT OR UPDATE OF nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at, coins, duel_elo, duel_matches_total, duel_last_match_at, duel_win_streak, duel_total_wins, duel_total_losses, duel_total_draws, duel_wp
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.sync_public_profile();

-- 9. Add missing indexes for duel columns on public_profiles
CREATE INDEX IF NOT EXISTS idx_public_profiles_duel_elo
  ON public.public_profiles(duel_elo DESC)
  WHERE leaderboard_opt_in = true;

CREATE INDEX IF NOT EXISTS idx_public_profiles_duel_wp
  ON public.public_profiles(duel_wp DESC);

-- 10. Grant select on public_profiles columns (already granted at table level, but ensure)
GRANT SELECT ON public.public_profiles TO authenticated;

-- 11. One-time sync: push any existing profiles that haven't been synced
INSERT INTO public.public_profiles (
  id, nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at,
  coins, duel_elo, duel_matches_total, duel_last_match_at, duel_win_streak,
  duel_total_wins, duel_total_losses, duel_total_draws, duel_wp
)
SELECT
  id, nickname, avatar_url, level, wp, total_wp, water_today, water_goal, user_title, updated_at,
  COALESCE(coins, 0), COALESCE(duel_elo, 1200), COALESCE(duel_matches_total, 0), duel_last_match_at,
  COALESCE(duel_win_streak, 0), COALESCE(duel_total_wins, 0), COALESCE(duel_total_losses, 0),
  COALESCE(duel_total_draws, 0), COALESCE(duel_wp, 0)
FROM public.profiles
WHERE id NOT IN (SELECT id FROM public.public_profiles)
ON CONFLICT (id) DO NOTHING;

-- 12. Fix the arena RPC that referenced public_profiles without coins.
--     The functions already reference public_profiles; with coins now present they will work.
--     No function re-creation needed since they dynamically resolve columns at runtime.

-- Done. Run `npx supabase db push --include-all` to apply.
